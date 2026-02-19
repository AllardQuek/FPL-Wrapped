I'll create a short todo plan and update the mapping file to use `bench_1_slot_<pos>_*` fields.

Updated todo list

Generating patch (53 lines) in [](file:///Users/allard/Local-Projects/FPL-Wrapped/scripts/es/mapping-fpl-gameweek-decisions.json)

Read [](file:///Users/allard/Local-Projects/FPL-Wrapped/scripts/es/mapping-fpl-gameweek-decisions.json)

Generating patch (56 lines) in [](file:///Users/allard/Local-Projects/FPL-Wrapped/scripts/es/mapping-fpl-gameweek-decisions.json)

Generating patch (3 lines) in [](file:///Users/allard/Local-Projects/FPL-Wrapped/scripts/es/mapping-fpl-gameweek-decisions.json)

Generating patch (28 lines) in [](file:///Users/allard/Local-Projects/FPL-Wrapped/scripts/es/mapping-fpl-gameweek-decisions.json)


```

```
Mapping updated to `bench_1_slot_*` in mapping-fpl-gameweek-decisions.json.

Now the full "start from scratch" procedure — run these commands in order (replace env vars as needed). I assume:
- source index: `fpl-gameweek-decisions`
- new index you want: `fpl-gameweek-decisions-v3`
- pipeline name: `fpl-bench-denorm`
- alias (optional): `fpl-gameweek-decisions-alias`

1) Set env vars
```bash
export ES_HOST="https://my-elasticsearch-project-f89bc5.es.us-central1.gcp.elastic.cloud"
export ES_API_KEY="TnJSOVVwd0JSUExrZ05nOGJmT3c6ek92eWJCTERuRG50ZVpEdTVqX29jUQ=="
export SRC_INDEX="fpl-gameweek-decisions"
export NEW_INDEX="fpl-gameweek-decisions-v3"
export ALIAS="fpl-gameweek-decisions-alias"
```

2) Delete pipeline and any existing v2/v3 indices (start clean)
```bash
curl -s -X DELETE "$ES_HOST/_ingest/pipeline/fpl-bench-denorm" \
  -H "Authorization: ApiKey $ES_API_KEY"

curl -s -X DELETE "$ES_HOST/fpl-gameweek-decisions-v2" \
  -H "Authorization: ApiKey $ES_API_KEY"

curl -s -X DELETE "$ES_HOST/$NEW_INDEX" \
  -H "Authorization: ApiKey $ES_API_KEY"
```

3) Create the ingest pipeline (uses pipeline-fpl-bench-denorm.json in repo)
```bash
curl -X PUT "$ES_HOST/_ingest/pipeline/fpl-bench-denorm" \
  -H "Authorization: ApiKey $ES_API_KEY" \
  -H "Content-Type: application/json" \
  -d @scripts/es/pipeline-fpl-bench-denorm.json
```
(You can inspect the file: pipeline-fpl-bench-denorm.json)

4) Create the new index with the mapping (uses mapping-fpl-gameweek-decisions.json)
```bash
curl -X PUT "$ES_HOST/$NEW_INDEX" \
  -H "Authorization: ApiKey $ES_API_KEY" \
  -H "Content-Type: application/json" \
  -d @scripts/es/mapping-fpl-gameweek-decisions.json
```
(You can inspect the file: mapping-fpl-gameweek-decisions.json)

5) Reindex from the source into the new index using the pipeline
```bash
curl -X POST "$ES_HOST/_reindex" \
  -H "Authorization: ApiKey $ES_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "source": { "index": "'"$SRC_INDEX"'" },
    "dest":  { "index": "'"$NEW_INDEX"'", "pipeline": "fpl-bench-denorm" }
  }'
```

6) Verify a sample doc and mapping
```bash
curl -s -H "Authorization: ApiKey $ES_API_KEY" "$ES_HOST/$NEW_INDEX/_search?size=1" | jq .
curl -s -H "Authorization: ApiKey $ES_API_KEY" "$ES_HOST/$NEW_INDEX/_mapping" | jq .
```

7) Swap alias (atomic) so clients can keep one logical name
- If you already use the alias, swap as below; otherwise add the alias to the new index instead of removing.
```bash
curl -X POST "$ES_HOST/_aliases" \
  -H "Authorization: ApiKey $ES_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "actions": [
      { "remove": { "index": "'"$SRC_INDEX"'", "alias": "'"$ALIAS"'" } },
      { "add":    { "index": "'"$NEW_INDEX"'", "alias": "'"$ALIAS"'" } }
    ]
  }'
```

8) (Optional) Delete the old index after verification
```bash
curl -X DELETE "$ES_HOST/$SRC_INDEX" \
  -H "Authorization: ApiKey $ES_API_KEY"
```

Notes & safety
- Run steps 2–5 in a non-peak period and test step 6 thoroughly before swapping the alias.
- If your pipeline or mapping JSON files are modified in the repo, the above commands use those files directly.
- If any command returns an error, stop and inspect before proceeding (I can run them for you if you want).

Would you like me to run these steps now (I will use the `ELASTICSEARCH_API_KEY` from your .env.local), or do you prefer to run them yourself?

Made changes.