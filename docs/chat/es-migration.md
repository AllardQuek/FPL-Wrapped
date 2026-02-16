You can treat your current Elastic project as the “source of truth” and script a small exporter that reads all tools/agents via the Agent Builder Kibana APIs, saves them as JSON, then replays that JSON into the target account.

### Overall approach

- Use `GET /api/agent_builder/tools` and `GET /api/agent_builder/agents` in the **source** project/space to dump all your tools and agents. [elastic](https://www.elastic.co/docs/explore-analyze/ai-features/agent-builder/kibana-api)
- Serialize the responses to disk (e.g., one JSON file per tool/agent or a single bundle file).  
- In the **target** project/space, loop over that JSON and call `POST /api/agent_builder/tools` and `POST /api/agent_builder/agents` to recreate them. [elastic](https://www.elastic.co/docs/explore-analyze/ai-features/agent-builder/kibana-api)

### Example: export script (Node/TypeScript-style pseudocode)

```ts
import fetch from "node-fetch";
import fs from "fs/promises";

const KIBANA_URL = process.env.KIBANA_URL!;
const API_KEY = process.env.API_KEY!; // from Elastic API keys
const SPACE = ""; // e.g. "/s/my-space" or "" for default

const base = `${KIBANA_URL}${SPACE}/api/agent_builder`;

async function getJson(path: string) {
  const res = await fetch(`${base}${path}`, {
    headers: { Authorization: `ApiKey ${API_KEY}` },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

async function exportConfig() {
  const tools = await getJson("/tools");          // list tools[page:1]
  const agents = await getJson("/agents");        // list agents[page:1]

  await fs.writeFile("agent_builder_tools.json", JSON.stringify(tools, null, 2));
  await fs.writeFile("agent_builder_agents.json", JSON.stringify(agents, null, 2));
}

exportConfig().catch(console.error);
```

This uses the list APIs documented on the Kibana Agent Builder page. [elastic](https://www.elastic.co/docs/explore-analyze/ai-features/agent-builder/kibana-api)

### Example: import script into another account

Set `KIBANA_URL` and `API_KEY` to the **target** account, and optionally adjust `SPACE`.

```ts
async function postJson(path: string, body: any) {
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: {
      "Authorization": `ApiKey ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

async function importConfig() {
  const tools = JSON.parse(await fs.readFile("agent_builder_tools.json", "utf8"));
  const agents = JSON.parse(await fs.readFile("agent_builder_agents.json", "utf8"));

  // Tools: you can either keep ids from source or strip them
  for (const tool of tools.items ?? tools) {
    const { id, ...rest } = tool;
    await postJson("/tools", { id, ...rest });    // create tool API[page:1]
  }

  // Agents: same idea
  for (const agent of agents.items ?? agents) {
    const { id, ...rest } = agent;
    await postJson("/agents", { id, ...rest });   // create agent API[page:1]
  }
}

importConfig().catch(console.error);
```

### Important details

- **Spaces:** If you use non-default spaces, add `/s/{space-id}` in the URL as shown in the docs (for example `/s/my-space/api/agent_builder/tools`). [elastic](https://www.elastic.co/docs/explore-analyze/ai-features/agent-builder/kibana-api)
- **Order:** Import tools first, then agents, so agents can reference the tool IDs.  
- **IDs and collisions:** If the target already has a tool/agent with the same id, either:
  - switch to `PUT /api/agent_builder/tools/{id}` / `PUT /agents/{id}` to “upsert”, or  
  - strip the id and let Elastic generate a new one, then update your agents’ `tool_ids` accordingly. [elastic](https://www.elastic.co/docs/explore-analyze/ai-features/agent-builder/kibana-api)

If you tell me what language/runtime you prefer (Node, Python, bash + curl), I can turn this into a ready-to-run script tailored to your setup.