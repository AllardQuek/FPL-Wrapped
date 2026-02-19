#!/usr/bin/env bash
# Full recreate index workflow
# Dry-run by default. Run with --yes to apply changes and --delete-old to remove the old index after alias swap.

set -euo pipefail

ES_HOST="${ES_HOST:-https://my-elasticsearch-project-f89bc5.es.us-central1.gcp.elastic.cloud}"
ES_API_KEY="${ES_API_KEY:-}"
if [ -z "$ES_API_KEY" ]; then
  echo "ERROR: set ES_API_KEY environment variable before running."
  exit 1
fi

# Usage: ./full-recreate-index.sh [SRC_INDEX] [NEW_INDEX] [ALIAS] [PIPELINE_NAME] [MAPPING_FILE] [PIPELINE_FILE] [--yes] [--delete-old]
SRC_INDEX="${1:-fpl-gameweek-decisions}"
NEW_INDEX="${2:-fpl-gameweek-decisions-v2}"
ALIAS="${3:-fpl-gameweek-decisions-alias}"
PIPELINE_NAME="${4:-fpl-bench-denorm}"
MAPPING_FILE="${5:-scripts/es/mapping-fpl-gameweek-decisions.json}"
PIPELINE_FILE="${6:-scripts/es/pipeline-fpl-bench-denorm.json}"
DRY_RUN=true
DELETE_OLD=false

for arg in "${@:7}"; do
  if [ "$arg" = "--yes" ]; then DRY_RUN=false; fi
  if [ "$arg" = "--delete-old" ]; then DELETE_OLD=true; fi
done

echo "ES_HOST: $ES_HOST"
echo "Source index: $SRC_INDEX"
echo "New index: $NEW_INDEX"
echo "Alias: $ALIAS"
echo "Pipeline name: $PIPELINE_NAME"
echo "Mapping file: $MAPPING_FILE"
echo "Pipeline file: $PIPELINE_FILE"
echo "Dry run: $DRY_RUN"
echo "Delete old index after swap: $DELETE_OLD"

command -v jq >/dev/null 2>&1 || { echo >&2 "jq is required. Install it and retry."; exit 1; }

function curl_auth() {
  curl -s -H "Authorization: ApiKey $ES_API_KEY" -H "Content-Type: application/json" "$@"
}

# echo
# echo "1) Find indices with default pipeline = $PIPELINE_NAME (scanning all indices)"
# all_indices=$(curl_auth "$ES_HOST/_cat/indices?h=index" | tr -d '\r')
# to_unset=()
# for idx in $all_indices; do
#   pipeline=$(curl_auth "$ES_HOST/$idx/_settings" | jq -r ".\"$idx\".settings.index.default_pipeline // empty")
#   if [ -n "$pipeline" ] && [ "$pipeline" = "$PIPELINE_NAME" ]; then
#     to_unset+=("$idx")
#   fi
# done

# if [ ${#to_unset[@]} -eq 0 ]; then
#   echo "No fpl-* indices found with default pipeline $PIPELINE_NAME"
# else
#   echo "Indices that will have default pipeline unset:"
#   for i in "${to_unset[@]}"; do echo " - $i"; done
# fi

# if $DRY_RUN; then
#   echo "Dry run: no changes will be made. Re-run with --yes to apply changes."; echo
# else
#   echo "Applying changes: unsetting default pipeline on indices..."
#   for i in "${to_unset[@]}"; do
#     echo "Unsetting default_pipeline on $i"
#     curl_auth -X PUT "$ES_HOST/$i/_settings" -d '{"index": {"default_pipeline": null}}' | jq .
#   done

#   echo "Deleting ingest pipeline $PIPELINE_NAME"
#   curl_auth -X DELETE "$ES_HOST/_ingest/pipeline/$PIPELINE_NAME" | jq .

#   echo "Deleting existing index $NEW_INDEX if present"
#   curl_auth -X DELETE "$ES_HOST/$NEW_INDEX" | jq . || true
# fi

# echo
# echo "2) Create ingest pipeline from $PIPELINE_FILE"
# if $DRY_RUN; then
#   echo "Dry run: skip creating pipeline."
# else
#   if [ ! -f "$PIPELINE_FILE" ]; then echo "ERROR: pipeline file $PIPELINE_FILE not found"; exit 1; fi
#   curl -X PUT "$ES_HOST/_ingest/pipeline/$PIPELINE_NAME" \
#     -H "Authorization: ApiKey $ES_API_KEY" \
#     -H "Content-Type: application/json" \
#     --data-binary "@$PIPELINE_FILE" | jq .
# fi

# echo
# echo "3) Create new index $NEW_INDEX with mapping $MAPPING_FILE"
# if $DRY_RUN; then
#   echo "Dry run: skip creating index."
# else
#   if [ ! -f "$MAPPING_FILE" ]; then echo "ERROR: mapping file $MAPPING_FILE not found"; exit 1; fi
#   curl -X PUT "$ES_HOST/$NEW_INDEX" \
#     -H "Authorization: ApiKey $ES_API_KEY" \
#     -H "Content-Type: application/json" \
#     --data-binary "@$MAPPING_FILE" | jq .
# fi

# echo
# echo "4) Reindex from $SRC_INDEX -> $NEW_INDEX using pipeline $PIPELINE_NAME"
# if $DRY_RUN; then
#   echo "Dry run: not performing reindex."
# else
#   reindex_body=$(cat <<JSON
# {
#   "source": { "index": "$SRC_INDEX" },
#   "dest":  { "index": "$NEW_INDEX", "pipeline": "$PIPELINE_NAME" }
# }
# JSON
# )
#   curl -X POST "$ES_HOST/_reindex" \
#     -H "Authorization: ApiKey $ES_API_KEY" \
#     -H "Content-Type: application/json" \
#     -d "$reindex_body" | jq .
# fi

# echo
# echo "5) Verify sample documents and mapping on $NEW_INDEX"
# if $DRY_RUN; then
#   echo "Dry run: skip verification."
# else
#   echo "Sample document:"; curl_auth "$ES_HOST/$NEW_INDEX/_search?size=1" | jq .
#   echo "Mapping:"; curl_auth "$ES_HOST/$NEW_INDEX/_mapping" | jq .
# fi

echo
echo "6) Swap alias to point to $NEW_INDEX"
if $DRY_RUN; then
  echo "Dry run: skip alias operations."
else
  # Check if alias exists
  alias_info=$(curl_auth "$ES_HOST/_alias/$ALIAS" || true)
  if [ -n "$alias_info" ] && [ "$alias_info" != "null" ]; then
    echo "Alias $ALIAS exists; performing atomic swap."
    alias_actions=$(cat <<JSON
{
  "actions": [
    { "remove": { "index": "$SRC_INDEX", "alias": "$ALIAS" } },
    { "add":    { "index": "$NEW_INDEX", "alias": "$ALIAS" } }
  ]
}
JSON
)
    curl -X POST "$ES_HOST/_aliases" -H "Authorization: ApiKey $ES_API_KEY" -H "Content-Type: application/json" -d "$alias_actions" | jq .
  else
    echo "Alias $ALIAS does not exist; adding alias pointing to $NEW_INDEX"
    add_action=$(cat <<JSON
{ "actions": [ { "add": { "index": "$NEW_INDEX", "alias": "$ALIAS" } } ] }
JSON
)
    curl -X POST "$ES_HOST/_aliases" -H "Authorization: ApiKey $ES_API_KEY" -H "Content-Type: application/json" -d "$add_action" | jq .
  fi
fi

if $DRY_RUN; then
  echo "Dry run complete. Re-run with --yes to apply changes."
  exit 0
fi

if $DELETE_OLD; then
  echo "7) Deleting original index $SRC_INDEX as requested"
  curl -X DELETE "$ES_HOST/$SRC_INDEX" -H "Authorization: ApiKey $ES_API_KEY" | jq .
fi

echo "All done. Verify your clients point to alias $ALIAS (or directly to $NEW_INDEX if you prefer)."
