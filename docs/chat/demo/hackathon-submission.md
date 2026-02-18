## Inspiration

FPL Wrapped Chat started from a simple problem: domain experts (FPL managers) regularly perform ad-hoc, time-series analysis across distributed data (mini-leagues, gameweeks) but lack a single, explainable interface to ask natural-language questions and get immediate, visual answers. We used FPL as a focused demo to validate a general pattern: a tool-driven agent that picks the right Elasticsearch capability, performs safe on-demand indexing, and returns explainable, streaming answers with charts.

## What it does

- Natural-language chat for mini-league / manager / Gameweek questions (captaincy spreads, chips, hits, differentials, points trends).
- Uses a planner agent to choose between Search, ES|QL aggregations, or orchestrated indexing workflows.
- Streams answers as text and Vega-Lite charts, and can trigger resumable, auditable indexing for missing data.
- Embeds in a web UI and via a Telegram webhook for native workflows.

## How we built it

- Agent Builder-style planner that reasons about coverage and selects tools (ES Search, ES|QL, or indexing workflows).
- Elasticsearch for indexed gameweek and manager documents, ES|QL for complex aggregations, and Workflows for orchestrated indexing.
- Streaming responses implemented in the chat UI with Vega-Lite for visualizations.
- On-demand indexing API + `/onboard` UI that runs chunked, resumable indexing with preflight coverage checks and execution logs for provenance.

## Challenges we ran into

- Indexing scale: onboarding hasn’t been stress-tested on very large leagues; chunking, rate-limits, and retry semantics required careful handling.
- Provenance and trust: early answers needed a verifier/cross-check stage to avoid overconfident claims.
- Trial constraints: Elastic trial and resource limits constrained large-scale testing and required conservative defaults.

## Accomplishments that we're proud of

- Built a multi-step agent that actively picks tools and executes ES|QL, Search, or indexing workflows rather than relying on prompt-only behavior.
- Streaming answers with inline Vega-Lite charts for immediate visual insight.
- Implemented resumable, auditable indexing with preflight checks so the agent can expand its dataset safely on request.

## What we learned

- Tool-driven agents add real value when they can reliably inspect data coverage and choose the minimal-impact action (query vs index).
- Provenance and confidence signals are vital for user trust—showing tool traces and coverage avoids meaningless answers.
- A narrow demo (FPL) proves the technical pattern, but judges care about transferability and measured impact.

## What's next for FPL Wrapped Chat

- Add a verifier agent stage to re-run aggregations and surface provenance/confidence for every claim.
- Run synthetic stress tests for large-league indexing and document fallback behavior (rate-limit, chunk resume).
- Collect metrics: answer success rate, avg time-to-answer, indexing throughput, and reduction in manual steps; include these in the demo.
- Produce a 90s scripted demo video and a one-slide architecture diagram that highlights Agent Builder decisions, ES|QL usage, and provenance traces.
