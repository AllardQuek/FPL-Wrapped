# Plan: Chat with FPL Data (Elastic Agent Builder)

**TL;DR**: Build a conversational interface to query FPL league data using **Elastic's Agent Builder** (no custom agent code needed!). Available via web UI (`/chat`) and Telegram bot (`/ask`). The agent lives in Elastic Cloud and we just call its API.

**Estimated Time**: 1-2 days

**Simplified Architecture:**
```
User Question (Web or Telegram)
         ↓
  Our API Route (app/api/chat/route.ts)
         ↓
  Elastic Agent API (Kibana REST API)
         ↓
  Elastic Agent (configured in Kibana UI)
    ├─ Has access to ES indices
    ├─ Can query FPL data
    └─ Formats responses
         ↓
  Return Answer to User
```

**Key Benefit:** No OpenAI costs, no agent orchestration code, no tool implementations. Elastic handles everything!

---

## **Prerequisites**

✅ **You already have:**
- Elasticsearch infrastructure with FPL data indexed
- Next.js app structure
- Telegram bot basics (optional)

✔️ **You'll configure:**
- Agent in Kibana UI (one-time setup, 10-15 minutes)

---

## **Steps**

### **1. Configure Agent in Kibana** (One-time setup)

**1.1 Create Agent in Kibana**
1. Log into your Elastic Cloud → Kibana
2. Navigate to **Search → Agent Builder** (or **Management → AI Assistants**)
3. Click **Create Agent**
4. Name: `FPL League Assistant`
5. Configure system prompt with these key elements:

**Prompt Philosophy:**
- Agent queries the `fpl-gameweek-decisions` index directly (no custom tools, no auto-indexing)
- Parse league IDs, gameweeks, manager names, player names from natural language
- Handle flexible query patterns: single GW, ranges ("GW20-25"), season-wide queries ("across the season"), multiple leagues
- Conversational, FPL-savvy responses with personality (not database output)
- If no league ID provided in question, ask user for clarification
- Users must include league IDs in questions since there's no page context to infer from

**Key Index Fields to Document:**
- `manager_id`, `manager_name`, `team_name`, `league_ids` (array)
- `gameweek`, `season` (e.g., "2024/25")
- `captain`, `vice_captain` (objects with `name`, `element_id`, `points`)
- `transfers` (array with `cost` field - negative values = points hits)
- `chip_used`, `picks` (starting XI), `bench` (4 players)
- `points` (GW points), `points_on_bench`, `team_value` (in 10ths, e.g., 1050 = £105.0m)

**Essential Query Examples:**
- "Who captained Salah in GW25 in league 1305804?" → Parse league, GW, player from natural language
- "Show bench points for league 1305804" → Query `league_ids`, sort by `points_on_bench`
- "Who took hits in league 1305804?" → Query `transfers.cost < 0`, filter by `league_ids`
- "Compare leagues 1305804 and 999999" → Query both separately, compare results

**Response Style Guidelines:**
- **Conversational, not technical**: "5 managers captained Salah..." not "Query returned 5 results"
- **FPL terminology**: hits, hauls, differentials, template, blanks
- **Empathy & personality**: "Ouch!" for bench disasters, "Great differential!" for successful picks
- **Concise**: Top 3-5 items for lists unless user asks for more
- **Contextual**: Always mention GW/league (e.g., "In GW25 for league 1305804...")
- **Emojis sparingly**: 💬 answers, 😭 bench regrets, 🎯 captains, 📊 stats

**Edge Cases:**
- No data found → "I couldn't find data for league [ID]. Make sure it's been indexed first."
- Future gameweeks → "GW[N] hasn't finished yet, so data might be incomplete."
- Ambiguous query → Ask for clarification rather than guessing

> **📝 Note:** The actual system prompt is configured and maintained in Kibana, allowing you to iterate and refine it based on real usage without code changes. This documentation captures the philosophy and key elements to include. See [Elastic Agent Builder docs](https://www.elastic.co/docs/explore-analyze/ai-features/agent-builder) for prompt engineering best practices.

**1.2 Add Data Source**
- Click **Add Connector**
- Select **Elasticsearch** 
- Grant access to index: `fpl-gameweek-decisions`
- Test connection

**1.3 Test Agent in Kibana**
- Use the built-in chat interface
- Test queries:
  - "Show managers who captained Salah in GW25 in league 1305804"
  - "Who has the most bench points in league 1305804?"
  - "List managers who took hits in league 1305804"
- Verify responses make sense and query the data correctly

**1.4 Get Agent ID**
- After creation, note the **Agent ID**
- This will be visible in the URL or agent settings page (e.g., `elastic-ai-agent` or a custom ID)
- Format: String identifier (e.g., `elastic-ai-agent`, `fpl-assistant`, or UUID)

**Reference:** [Elastic Agent Builder Kibana API Docs](https://www.elastic.co/docs/explore-analyze/ai-features/agent-builder/kibana-api)

**Important from official docs:**
- ✅ Use `input` field (not `message`)
- ✅ Use `agent_id` field (not `connector_id`)
- ✅ Endpoint: `/api/agent_builder/converse`
- ✅ For streaming: `/api/agent_builder/converse/async`

---

### **2. Build API Integration**

**2.1 Create Elastic Agent Client**

Create `lib/chat/elastic-agent.ts`:
```typescript
interface ChatResponse {
  response: string;
  conversationId: string;
}

/**
 * Chat with Elastic Agent via Kibana Agent Builder API
 * Docs: https://www.elastic.co/docs/explore-analyze/ai-features/agent-builder/kibana-api
 * 
 * Philosophy: Keep it simple. Pass the raw user question to the agent.
 * The agent is smart enough to parse natural language, extract parameters,
 * and query ES appropriately.
 */
export async function chatWithAgent(
  message: string,
  conversationId?: string
): Promise<ChatResponse> {
  
  // Get Kibana URL (same as Elasticsearch URL, just different port/path)
  const esUrl = process.env.ELASTICSEARCH_URL?.replace(':443', '').replace(':9200', '');
  const agentId = process.env.ELASTIC_AGENT_ID;
  
  if (!esUrl || !agentId) {
    throw new Error('Missing ELASTICSEARCH_URL or ELASTIC_AGENT_ID in environment');
  }
  
  const kibanaUrl = esUrl; // Kibana typically on same domain
  
  // Call Agent Builder /converse endpoint
  // If conversation_id is omitted, Elastic creates a new conversation
  const requestBody: any = {
    input: message,                  // IMPORTANT: Field is "input" not "message"
    agent_id: agentId,               // IMPORTANT: Field is "agent_id" not "connector_id"
  };
  
  // Include conversation_id if continuing existing chat
  if (conversationId) {
    requestBody.conversation_id = conversationId;
  }
  
  const chatRes = await fetch(
    `${kibanaUrl}/api/agent_builder/converse`,
    {
      method: 'POST',
      headers: {
        'Authorization': `ApiKey ${process.env.ELASTICSEARCH_API_KEY}`,
        'Content-Type': 'application/json',
        'kbn-xsrf': 'true', // Required by Kibana
      },
      body: JSON.stringify(requestBody)
    }
  );
  
  if (!chatRes.ok) {
    const error = await chatRes.text();
    throw new Error(`Failed to chat with agent: ${chatRes.status} ${error}`);
  }
  
  const result = await chatRes.json();
  
  return {
    response: result.content || result.message || 'No response from agent',
    conversationId: result.conversation_id || conversationId || 'unknown'
  };
}
```

**Note on Kibana Spaces:**  
If using Spaces in Kibana, prefix the endpoint with `/s/<space_name>`:
```typescript
// Example for "fpl" space:
`${kibanaUrl}/s/fpl/api/agent_builder/converse`
```

For default space, use the endpoint as shown above (no prefix needed).
```

**2.2 Create Simple Handler**

Create `lib/chat/handler.ts`:
```typescript
import { chatWithAgent } from './elastic-agent';

export async function handleChatQuery(
  question: string,
  conversationId?: string
): Promise<{ answer: string; conversationId: string }> {
  const { response, conversationId: newConvId } = await chatWithAgent(
    question,
    conversationId
  );
  return { answer: response, conversationId: newConvId };
}
```

**Philosophy:** Trust the agent! Examples of what the agent must parse:
- ❓ "Who captained Salah in GW25 in league 1305804?" → Agent extracts GW25 + league ID
- ❓ "Show me bench points across all gameweeks for league 1305804" → Agent extracts league + aggregates GWs
- ❓ "Who has taken the most hits this season in my league?" → Agent needs league ID from user
- ❓ "Compare leagues 1305804 and 999999" → Agent extracts both league IDs

Users must include league IDs/gameweeks in their questions since there's no page context to infer from.

**2.3 Conversation Lifecycle (Important!)**

Based on [Elastic's Agent Builder API docs](https://www.elastic.co/docs/explore-analyze/ai-features/agent-builder/kibana-api#chat-and-conversations):

**How conversation_id works:**
- First call: Omit `conversation_id` → Elastic creates new conversation and returns its ID
- Subsequent calls: Include the `conversation_id` → Agent sees prior context
- Storage: Your app should persist the `conversation_id` per user/session

**Storage options:**
1. **Stateless (simple)**: Each query is a new conversation (no memory between questions)
2. **Session-based**: Store `conversation_id` in session/cookie for multi-turn chat
3. **Persistent**: Store in DB per user for long-term conversation history

For MVP, we'll use **stateless** (option 1) - simplest to implement. Can add persistence later.

---

### **3. Web UI Interface**

**3.1 Create Chat Page**

Create `app/chat/page.tsx`:
```typescript
'use client'

import { useState } from 'react'

export default function ChatPage() {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  // Uncomment for multi-turn conversation support:
  // const [conversationId, setConversationId] = useState<string | undefined>()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setAnswer('')

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        question,
        // conversationId, // Uncomment for multi-turn support
      })
    })

    const data = await res.json()
    setAnswer(data.answer || data.error)
    // setConversationId(data.conversationId) // Uncomment for multi-turn support
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">💬 Chat with Your FPL Data</h1>
      
      <form onSubmit={handleSubmit} className="mb-6">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask anything about FPL data..."
          className="w-full p-4 border rounded-lg min-h-[100px]"
          disabled={loading}
        />
        <button
          type="submit"
          className="mt-2 px-6 py-2 bg-purple-600 text-white rounded-lg disabled:opacity-50"
          disabled={loading || !question}
        >
          {loading ? 'Thinking...' : 'Ask'}
        </button>
      </form>

      {answer && (
        <div className="p-6 bg-slate-100 rounded-lg whitespace-pre-wrap">
          {answer}
        </div>
      )}

      <div className="mt-8 text-sm text-slate-600">
        <p className="font-semibold mb-2">💡 Try asking:</p>
        <ul className="space-y-1">
          <li>• Who captained Salah in GW25 in league 1305804?</li>
          <li>• Show me bench points across all gameweeks for league 1305804</li>
          <li>• Compare transfer strategies for leagues 1305804 and 999999</li>
          <li>• Who has taken the most hits this season in league 1305804?</li>
          <li>• What's the average team value in league 1305804?</li>
        </ul>
        <p className="mt-3 text-xs italic">
          💡 Be sure to include the league ID in your questions!
        </p>
      </div>
    </div>
  )
}
```

**Note:** Multi-turn conversation support is commented out for MVP simplicity. The agent handles complex, multi-part questions intelligently even without conversation history.

**3.2 Create API Route**

Create `app/api/chat/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { handleChatQuery } from '@/lib/chat/handler'

export async function POST(req: NextRequest) {
  try {
    const { question, conversationId } = await req.json()

    if (!question) {
      return NextResponse.json({ error: 'Question required' }, { status: 400 })
    }

    const result = await handleChatQuery(question, conversationId)

    return NextResponse.json({ 
      answer: result.answer,
      conversationId: result.conversationId
    })
  } catch (error: any) {
    console.error('Chat error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process question' },
      { status: 500 }
    )
  }
}
```

---

### **4. Telegram Bot Integration** (Optional)

**4.1 Add Chat Command to Bot**

Create or update `scripts/telegram-bot.ts`:
```typescript
import { Bot } from 'grammy'
import { handleChatQuery } from '../lib/chat/handler'

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN!)

bot.command('ask', async (ctx) => {
  const question = ctx.match // Text after /ask command
  
  if (!question) {
    return ctx.reply('Usage: /ask Who captained Salah in GW25?')
  }

  const replyMsg = await ctx.reply('🤔 Thinking...')

  try {
    const { answer } = await handleChatQuery(question)
    await ctx.api.editMessageText(
      ctx.chat.id, 
      replyMsg.message_id, 
      `💬 ${answer}`
    )
  } catch (error: any) {
    await ctx.api.editMessageText(
      ctx.chat.id, 
      replyMsg.message_id, 
      `❌ Sorry, had trouble processing that: ${error.message}`
    )
  }
})

bot.command('start', (ctx) => {
  ctx.reply(`
👋 FPL Chat Bot

Commands:
/ask [question] - Ask anything about your league
/help - Show example questions

Example: /ask Who took the most hits this season in league 1305804?

Note: Include league ID in your questions!
`)
})

bot.command('help', (ctx) => {
  ctx.reply(`
💡 Example Questions:

• Who captained Haaland in GW25 in league 1305804?
• Show me managers who took hits in league 1305804
• Who has the most bench points in league 1305804?
• Compare team values in leagues 1305804 and 999999
• Which differential picks worked in GW25 in league 1305804?
• Show me chip usage in league 1305804

Just type: /ask [your question]
Include the league ID in your question!
`)
})

console.log('🤖 Bot started...')
bot.start()
```

**4.2 Run Bot**
```bash
pnpm tsx scripts/telegram-bot.ts
```

---

### **5. Environment Setup**

**5.1 Add Environment Variables**

Update `.env.local`:
```bash
# Existing
ENABLE_ELASTICSEARCH=true
ELASTICSEARCH_URL=https://your-deployment.es.region.cloud.es.io:443
ELASTICSEARCH_API_KEY=...

# New - Get from Kibana after creating agent
ELASTIC_AGENT_ID=elastic-ai-agent
ENABLE_CHAT=true

# Optional - Telegram bot
TELEGRAM_BOT_TOKEN=...

# Optional - If using Kibana Spaces (not default space)
# KIBANA_SPACE=fpl
```

**About Kibana Spaces:**  
If your agent is in a custom Kibana Space (not the default space), you'll need to prefix API paths with `/s/<space_name>`. Set `KIBANA_SPACE` env var and update the code to handle this. For most users, this is not needed.

**5.2 Update Feature Flags**

Update `lib/config/features.ts`:
```typescript
export const FEATURES = {
  // Existing
  ELASTICSEARCH_ENABLED: process.env.ENABLE_ELASTICSEARCH === 'true',
  MINI_LEAGUE_REPORTS: process.env.ENABLE_MINI_LEAGUE_REPORTS === 'true',
  
  // New
  CHAT_ENABLED: process.env.ENABLE_CHAT === 'true' && 
                !!process.env.ELASTIC_AGENT_ID,
} as const;
```

---

### **6. Testing**

**6.1 Test Agent in Kibana First**
1. Go to your agent in Kibana
2. Use built-in test interface
3. Verify it can query your index
4. Test 5-10 example questions:
   - "Show managers who captained Salah"
   - "Who has bench points over 15?"
   - "List managers who took hits"
5. Verify responses are accurate

**6.2 Test API Integration**
```bash
# Start dev server
pnpm dev

# Test API endpoint directly
curl -X POST "http://localhost:3000/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"question": "Who captained Salah in GW25 in league 1305804?"}'

# Or test Elastic Agent Builder endpoint directly (bypass our app)
curl -X POST "${KIBANA_URL}/api/agent_builder/converse" \
  -H "Authorization: ApiKey ${ELASTICSEARCH_API_KEY}" \
  -H "kbn-xsrf: true" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Show me FPL managers who captained Salah",
    "agent_id": "elastic-ai-agent"
  }'
```

**6.3 Test Web UI**
1. Go to `http://localhost:3000/chat`
2. Try questions from Kibana tests
3. Verify responses match
4. Test loading states
5. Test error handling (bad question, no data, etc.)

**6.4 Test Telegram Bot** (if enabled)
1. Run bot: `pnpm tsx scripts/telegram-bot.ts`
2. Message: `/ask Who took hits in GW25?`
3. Verify response matches web UI

**6.5 Test Error Handling**
- Invalid questions
- Non-existent league IDs (if indexing is required first)
- Network failures
- ES connection issues

---

## **Verification Checklist**

**Infrastructure:**
- ✅ Agent created and configured in Kibana
- ✅ Agent can access fpl-gameweek-decisions index
- ✅ Test queries work in Kibana interface
- ✅ Agent ID recorded in environment variables

**Integration:**
- ✅ API client can call Elastic conversation endpoint
- ✅ Conversations created successfully
- ✅ Messages sent and responses received
- ✅ Context (league ID, gameweek) passed correctly

**User Interfaces:**
- ✅ `/chat` page loads and works
- ✅ Questions submitted successfully
- ✅ Answers display correctly
- ✅ Loading states work
- ✅ Error handling graceful
- ✅ Telegram bot responds (if enabled)

**Quality:**
- ✅ Answers are accurate (spot check 10 questions)
- ✅ Response time acceptable (<5s typical)
- ✅ Agent handles variations in phrasing
- ✅ Error messages helpful

---

## **Example Interactions**

### Web UI
```
User: "Who captained Salah in GW25 in league 1305804?"
Agent: Parses league 1305804, GW25, captain Salah from natural language
Bot: "5 managers captained Salah in GW25: John, Sarah, Mike, Lisa, Tom."

User: "Show me bench points across all gameweeks for league 1305804"
Agent: Extracts league 1305804, aggregates points_on_bench across all GWs
Bot: "Bench point disasters:
      GW12: Sarah left 18pts on bench (Toney 14, Saka 4)
      GW25: Tom left 15pts (Watkins 12, Gordon 3)"

User: "Compare transfer strategies for leagues 1305804 and 999999"
Agent: Parses both league IDs, queries transfers/hits for each
Bot: "Transfer comparison:
      League 1305804: Avg 2.1 transfers/GW, 15% take hits
      League 999999: Avg 1.8 transfers/GW, 8% take hits
      League 1305804 is more aggressive with transfers!"
```

### Telegram
```
User: /ask Who has taken the most hits this season in league 1305804?
Bot: 💬 Sarah leads with -32 hit points (8 hits total), followed by 
     Tom with -24 points (6 hits). Mike has taken 0 hits all season!

User: /ask Show me differential picks that worked in GW25 in league 1305804
Bot: 💬 In GW25, Tom's Isak (12% owned) hauled 18pts while the template 
     captain Haaland blanked. John's Watkins also paid off with 14pts!
```

---

## **Architecture Decisions**

**Why Elastic Agent Builder over custom OpenAI agent?**
- ✅ No OpenAI API costs
- ✅ No tool orchestration code to maintain
- ✅ Native ES integration (agent built for querying ES)
- ✅ Built-in conversation management
- ✅ Agent can leverage Elastic's semantic search
- ✅ One less external dependency

**Why trust the agent vs pre-processing queries?**
- ✅ **Flexibility**: Agent handles any query structure naturally
  - "Who captained Salah in GW25 in league 1305804?" ✓
  - "Show me bench points across all gameweeks for league 1305804" ✓
  - "Compare leagues 1305804 and 999999" ✓
  - "What was the average team value in December for league 1305804?" ✓
- ✅ **Future-proof**: New query types work without code changes
- ✅ **User-friendly**: Natural language, no rigid formats required
- ✅ **Less code**: No query pre-processing or parameter extraction logic
- ⚠️ **Trade-off**: Agent must be well-prompted (see Step 1.1)
- ⚠️ **Trade-off**: Users must include league IDs/gameweeks in questions

**Why manual Kibana config vs API automation?**
- Faster to test and iterate
- Easier to tweak prompts in UI
- Can test agent independently
- Can automate later if needed

**Conversation persistence:**
- Web UI: Stateless by default (each query is fresh)  
  - Can enable multi-turn by uncommenting conversation ID tracking in code
- Telegram: Could persist conversation ID per chat for context
- Can add conversation history UI later if needed

**API endpoint options:**
- `/api/agent_builder/converse` - Synchronous (what we're using)
- `/api/agent_builder/converse/async` - Async/streaming for real-time responses
- Can switch to async later for better UX (see "Extending Further" section)

**Data indexing requirement:**
- Data must be pre-indexed (can't auto-index like custom agent)
- Trade-off: Simpler code, but requires manual indexing step
- Could add "data not found" messaging in agent prompt

---

## **Limitations & Trade-offs**

**Compared to custom OpenAI agent:**
- ❌ Can't auto-index missing data (requires pre-indexed data)
- ❌ Less flexible tool orchestration
- ❌ Tied to Elastic stack
- ✅ But: Simpler, cheaper, native ES integration

**If you need auto-indexing:** Consider the custom agent approach or add manual "index first" step

**Cost comparison:**
- Elastic Agent Builder: Included with ES Cloud (no extra LLM costs)
- Custom OpenAI agent: ~$0.01-0.02 per query

**Best for:** Querying pre-indexed data (perfect for post-gameweek analysis)
**Not ideal for:** Real-time data that requires FPL API fallbacks

---

## **Next Steps**

After chat is working:
1. **Refine agent prompts** based on actual usage
2. **Add more context to agent** (player names, common queries)
3. **Enable multi-turn conversations** (uncomment conversation ID tracking)
4. **Switch to async/streaming** for real-time responses (see below)
5. **Build structured reports** (Phase 2) that complement chat
6. **Add Discord integration** (similar to Telegram)

**Future enhancements:**

**1. Streaming responses (async API):**
```typescript
// Update elastic-agent.ts to use /converse/async
const chatRes = await fetch(
  `${kibanaUrl}/api/agent_builder/converse/async`,
  {
    method: 'POST',
    headers: {
      'Authorization': `ApiKey ${process.env.ELASTICSEARCH_API_KEY}`,
      'Content-Type': 'application/json',
      'kbn-xsrf': 'true',
    },
    body: JSON.stringify({
      input: message,
      agent_id: agentId,
      conversation_id: conversationId,
    })
  }
);

// Response is a stream of events
const reader = chatRes.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  // Parse server-sent events and stream to client
  onChunk(chunk);
}
```

**2. Multi-turn conversations:**
```typescript
// Store conversation ID per user session
const sessionStore = new Map<string, string>(); // userId -> conversationId

bot.command('ask', async (ctx) => {
  const userId = ctx.from?.id.toString();
  const existingConvId = sessionStore.get(userId);
  
  const { answer, conversationId: newConvId } = await handleChatQuery(
    question,
    existingConvId // Reuse existing conversation
  );
    existingConvId // Reuse existing conversation
  );
  
  sessionStore.set(userId, newConvId); // Store for next message
  ctx.reply(answer);
});
```

**3. Proactive insights:**
- Voice support (Telegram voice messages)
- Proactive insights ("Tom's differential paid off!")
- Visual responses (charts, tables)

---

## **Troubleshooting**

**"Failed to chat with agent" or 404 errors**
- Verify endpoint: Should be `/api/agent_builder/converse` (not `/conversations` or `/messages`)
- Check `ELASTICSEARCH_URL` points to Kibana endpoint
- Verify API key has permissions for Agent Builder
- Ensure `kbn-xsrf: true` header is set
- Check agent_id matches what you set in Kibana (e.g., "elastic-ai-agent")
- Verify field names: Use `input` (not `message`) and `agent_id` (not `connector_id`)

**"No response from agent" or empty responses**
- Test agent in Kibana first
- Check agent has access to correct index
- Verify index contains data for the query

**Agent gives wrong answers**
- Refine system prompt in Kibana
- Add more field descriptions
- Provide example queries in prompt

**Slow responses (>10s)**
- Check ES query performance
- Consider adding index to frequently queried fields
- Optimize agent prompt (be more specific)

**API errors**
- Check Kibana logs for details
- Verify connector ID is correct
- Test with simple query first

---

## **Summary**

This approach gives you:
- ✅ **Fast implementation:** 1-2 days vs 2-3 days
- ✅ **Lower cost:** No OpenAI fees
- ✅ **Simpler code:** No tool orchestration needed
- ✅ **Native integration:** Built for ES queries
- ✅ **Correct API:** Uses proper field names per official Elastic docs
- ⚠️ **Trade-off:** Requires pre-indexed data

**Critical implementation details (per official Elastic documentation):**
1. ✅ Use `input` field (NOT `message`)
2. ✅ Use `agent_id` field (NOT `connector_id`)  
3. ✅ Endpoint: `/api/agent_builder/converse`
4. ✅ Optional: `conversation_id` for multi-turn chat
5. ✅ For streaming: Use `/api/agent_builder/converse/async`

**Perfect for:** Post-gameweek analysis of league data  
**Consider custom agent if:** You need auto-indexing or complex FPL API fallbacks

---

## **Design Philosophy Summary**

This implementation follows a **"trust the agent"** philosophy:

**What the agent handles (intelligently):**
- ✅ Parsing natural language queries
- ✅ Extracting league IDs, gameweeks, manager names from questions
- ✅ Querying single or multiple gameweeks/leagues
- ✅ Aggregating data (totals, averages, comparisons)
- ✅ Making reasonable assumptions when queries are ambiguous

**What we handle (minimally):**
- ✅ Routing requests to agent API
- ✅ Managing conversation IDs for multi-turn chats (optional)
- ✅ That's it! Single `/chat` page, no page context to infer

**Benefits of this approach:**
1. **Simplicity**: Our code is a thin wrapper around agent API
2. **Flexibility**: Agent handles any query structure without code changes
3. **Future-proof**: New features (e.g., player analysis) work automatically
4. **Maintainable**: Prompt updates > code changes for improvements

**Example of flexibility:**
```typescript
// These all work without changing our code:
"Who captained Salah in GW25 in league 1305804?"
"Show me bench points across all gameweeks for league 1305804"
"Compare leagues 1305804 and 999999 in December"
"What was the most common chip used in GW20-25 in league 1305804?"
"Who took the most hits in league 1305804?"
```

The agent figures it out! Users just need to mention league IDs in their questions. 🚀

---

## **Key Implementation Details (Per Official Docs)**

Based on [Elastic's Agent Builder Kibana API](https://www.elastic.co/docs/explore-analyze/ai-features/agent-builder/kibana-api#chat-and-conversations):

**Correct endpoint:** `/api/agent_builder/converse` (NOT `/api/observability_ai_assistant/...`)

**Conversation ID lifecycle:**
1. First call: Omit `conversation_id` → Elastic creates one and returns it
2. Your app: Store the returned `conversation_id` (in session, DB, etc.)
3. Subsequent calls: Include stored `conversation_id` → Agent remembers context
4. Each conversation is isolated: Different IDs = different chat threads

**Request structure:**
```json
{
  "input": "Who captained Salah?",
  "agent_id": "elastic-ai-agent",
  "conversation_id": "optional-for-continuing-chat"
}
```

**Response includes:** Agent's answer + conversation_id to reuse

**For stateless mode (MVP):** Just omit conversation_id on every call  
**For multi-turn chat:** Store and reuse conversation_id per user/session

**Additional Elastic APIs available (not needed for MVP):**
- `GET /api/agent_builder/conversations` - List all conversations
- `GET /api/agent_builder/conversations/{id}` - Get conversation details
- `DELETE /api/agent_builder/conversations/{id}` - Delete conversation
- See [Elastic docs](https://www.elastic.co/docs/explore-analyze/ai-features/agent-builder/kibana-api#chat-and-conversations) for full API reference
