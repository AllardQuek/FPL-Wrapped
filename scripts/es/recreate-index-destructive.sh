#!/usr/bin/env bash
# Destructive recreate of an index keeping the original name.
#
# Steps:
# 1) Backup original index to a timestamped backup index (non-destructive)
# 2) Delete original index (destructive)
# 3) Create new index with provided mapping (same name as original)
# 4) Ensure ingest pipeline exists and reindex backup -> original using pipeline
# 5) Verify docs and mapping
# 6) Optionally delete backup when --delete-backup is passed

set -euo pipefail

ES_HOST="${ES_HOST:-https://my-elasticsearch-project-f89bc5.es.us-central1.gcp.elastic.cloud}"
ES_API_KEY="${ES_API_KEY:-}"
if [ -z "$ES_API_KEY" ]; then
  echo "ERROR: set ES_API_KEY environment variable before running."
  exit 1
fi

SRC_INDEX="${1:-fpl-gameweek-decisions}"
MAPPING_FILE="${2:-scripts/es/mapping-fpl-gameweek-decisions.json}"
PIPELINE_FILE="${3:-scripts/es/pipeline-fpl-bench-denorm.json}"
DRY_RUN=true
DELETE_BACKUP=false

for arg in "${@:4}"; do
  if [ "$arg" = "--yes" ]; then DRY_RUN=false; fi
  if [ "$arg" = "--delete-backup" ]; then DELETE_BACKUP=true; fi
done

if $DRY_RUN; then
  echo "Dry run: the script will show actions but not apply changes. Re-run with --yes to execute." 
fi

command -v jq >/dev/null 2>&1 || { echo >&2 "jq is required. Install it and retry."; exit 1; }

function curl_auth() {
  curl -s -H "Authorization: ApiKey $ES_API_KEY" -H "Content-Type: application/json" "$@"
}

timestamp=$(date +%s)
BACKUP_INDEX="${SRC_INDEX}-backup-${timestamp}"

echo "Source index: $SRC_INDEX"
echo "Backup index: $BACKUP_INDEX"
echo "Mapping file: $MAPPING_FILE"
echo "Pipeline file: $PIPELINE_FILE"
echo "Dry run: $DRY_RUN"
echo "Delete backup after success: $DELETE_BACKUP"

if $DRY_RUN; then
  echo
  echo "DRY RUN - commands that would run:"
  echo "1) Reindex $SRC_INDEX -> $BACKUP_INDEX (backup)"
  echo "   curl -X POST $ES_HOST/_reindex -d '{ \"source\":{\"index\":\"$SRC_INDEX\"}, \"dest\":{\"index\":\"$BACKUP_INDEX\"} }'"
  echo "2) DELETE $SRC_INDEX"
  echo "3) PUT $SRC_INDEX with mapping from $MAPPING_FILE"
  echo "4) PUT pipeline from $PIPELINE_FILE"
  echo "5) Reindex $BACKUP_INDEX -> $SRC_INDEX using pipeline"
  echo "6) (optional) DELETE $BACKUP_INDEX if --delete-backup supplied"
  exit 0
fi

# 1) Backup original
echo
echo "1) Backing up $SRC_INDEX -> $BACKUP_INDEX"
curl_auth -X POST "$ES_HOST/_reindex?wait_for_completion=true" -d "{ \"source\": { \"index\": \"$SRC_INDEX\" }, \"dest\": { \"index\": \"$BACKUP_INDEX\" } }" | jq .

# 2) Delete original
echo
echo "2) Deleting original index $SRC_INDEX"
curl_auth -X DELETE "$ES_HOST/$SRC_INDEX" | jq .

# 3) Create new index with mapping
echo
echo "3) Creating new index $SRC_INDEX with mapping $MAPPING_FILE"
if [ ! -f "$MAPPING_FILE" ]; then echo "ERROR: mapping file $MAPPING_FILE not found"; exit 1; fi
curl_auth -X PUT "$ES_HOST/$SRC_INDEX" --data-binary "@${MAPPING_FILE}" | jq .

# 4) Create/put ingest pipeline
echo
echo "4) Installing ingest pipeline from $PIPELINE_FILE"
if [ ! -f "$PIPELINE_FILE" ]; then echo "ERROR: pipeline file $PIPELINE_FILE not found"; exit 1; fi
PIPELINE_NAME="fpl-bench-denorm"
curl_auth -X PUT "$ES_HOST/_ingest/pipeline/$PIPELINE_NAME" --data-binary "@${PIPELINE_FILE}" | jq .

# 5) Reindex backup -> original with pipeline
echo
echo "5) Reindexing $BACKUP_INDEX -> $SRC_INDEX using pipeline $PIPELINE_NAME"
curl_auth -X POST "$ES_HOST/_reindex?wait_for_completion=true" -d "{ \"source\": { \"index\": \"$BACKUP_INDEX\" }, \"dest\": { \"index\": \"$SRC_INDEX\", \"pipeline\": \"$PIPELINE_NAME\" } }" | jq .

# 6) Verify sample document & mapping
echo
echo "6) Verifying $SRC_INDEX sample doc and mapping"
curl_auth "$ES_HOST/$SRC_INDEX/_search?size=1" | jq .
curl_auth "$ES_HOST/$SRC_INDEX/_mapping" | jq .

if $DELETE_BACKUP; then
  echo
  echo "7) Deleting backup index $BACKUP_INDEX as requested"
  curl_auth -X DELETE "$ES_HOST/$BACKUP_INDEX" | jq .
fi

echo
echo "Destructive recreate complete. Clients can continue using index name: $SRC_INDEX"
