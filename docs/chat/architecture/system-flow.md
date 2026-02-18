# Chat System Overview

This page describes the end-to-end runtime architecture across Web chat, Telegram, Elastic Agent Builder, and Elasticsearch.

## Component diagram

```mermaid
flowchart TD
    U1[Web User /chat] --> CUI[Chat UI]
    U2[Telegram User] --> TGW[/api/webhook/telegram]

    CUI --> CHAPI[/api/chat SSE]
    CHAPI --> EAC[lib/chat/elastic-agent.ts]

    TGW --> TBOT[lib/chat/telegram-bot.ts]
    TBOT --> TCHAT[telegram/services/chat-service.ts]
    TCHAT --> EAC

    EAC --> KIB[Kibana Agent Builder API]
    KIB --> TOOLS[Agent Tools + Workflows]
    TOOLS --> ESIDX[(fpl-gameweek-decisions)]
    TOOLS --> ESEXE[(fpl-indexing-executions)]

    TCHAT --> CHSTORE[(fpl-chat-charts)]
    TCHAT --> CHARTPAGE[/chat/chart/:id]
```

## Web chat sequence

```mermaid
sequenceDiagram
    participant User as Web User
    participant UI as app/chat/page.tsx
    participant API as app/api/chat/route.ts
    participant Agent as lib/chat/elastic-agent.ts
    participant Kibana as Agent Builder API
    participant ES as Elasticsearch

    User->>UI: Ask FPL question
    UI->>API: POST /api/chat {question, conversationId?}
    API->>Agent: streamChatWithAgent(...)
    Agent->>Kibana: /api/agent_builder/converse/async
    Kibana->>ES: Tool/workflow queries
    Kibana-->>Agent: SSE events (reasoning/tool_call/tool_result/text)
    Agent-->>API: Normalized stream chunks
    API-->>UI: SSE chunks
    UI-->>User: Incremental answer + tools + charts
```

## Telegram sequence

```mermaid
sequenceDiagram
    participant Tg as Telegram
    participant Hook as /api/webhook/telegram
    participant Bot as telegram-bot.ts
    participant ChatSvc as telegram/services/chat-service.ts
    participant Agent as elastic-agent.ts

    Tg->>Hook: POST update
    Hook-->>Tg: 200 OK immediately
    Hook->>Bot: waitUntil(handleUpdate)
    Bot->>ChatSvc: route command/message
    ChatSvc->>Agent: streamChatWithAgent(prompt, conversationId?)
    Agent-->>ChatSvc: content + tool + reasoning chunks
    ChatSvc-->>Tg: edit/send progress + final messages
```

## Design constraints

- Web chat and Telegram share the same Agent Builder backend and conversation continuation model.
- Indexing is asynchronous and resumable through execution documents in Elasticsearch.
- Chart rendering supports both inline web charts and Telegram chart links via persisted chart specs.
