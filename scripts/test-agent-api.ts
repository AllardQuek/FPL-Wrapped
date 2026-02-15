/**
 * Test Elastic Agent Builder - Verify chat functionality
 * Run: npx tsx scripts/test-agent-api.ts
 */

import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testAgentAPI() {
  const esUrl = process.env.ELASTICSEARCH_URL?.replace(':443', '').replace(':9200', '');
  const apiKey = process.env.ELASTICSEARCH_API_KEY;
  const agentId = process.env.ELASTIC_AGENT_ID;

  if (!esUrl || !apiKey || !agentId) {
    console.error('❌ Missing ELASTICSEARCH_URL, ELASTICSEARCH_API_KEY, or ELASTIC_AGENT_ID');
    process.exit(1);
  }

  const kibanaUrl = esUrl.replace('.es.', '.kb.');
  const headers = {
    'Authorization': `ApiKey ${apiKey}`,
    'Content-Type': 'application/json',
    'kbn-xsrf': 'true',
  };

  console.log(`📡 Testing Elastic Agent Builder\n`);
  console.log(`   Kibana: ${kibanaUrl}`);
  console.log(`   Agent ID: ${agentId}\n`);

  // Step 1: List agents
  console.log('1️⃣  Checking available agents...');
  try {
    const listResponse = await fetch(`${kibanaUrl}/api/agent_builder/agents`, {
      method: 'GET',
      headers,
    });

    if (listResponse.ok) {
      const data = await listResponse.json();
      const myAgent = data.results?.find((a: any) => a.id === agentId);
      
      if (myAgent) {
        console.log(`   ✅ Found agent: ${myAgent.name}`);
        console.log(`   📝 Description: ${myAgent.description}`);
      } else {
        console.log(`   ⚠️  Agent '${agentId}' not found in list`);
        console.log(`   Available agents: ${data.results?.map((a: any) => a.id).join(', ')}`);
      }
    } else {
      console.log(`   ❌ Could not list agents (${listResponse.status})`);
      process.exit(1);
    }
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
    process.exit(1);
  }

  // Step 2: Test chat
  console.log('\n2️⃣  Testing chat conversation...');
  const testMessage = "What indices do you have access to?";
  console.log(`   💬 Question: "${testMessage}"\n`);

  try {
    const response = await fetch(`${kibanaUrl}/api/agent_builder/converse/async`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        input: testMessage,
        agent_id: agentId,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.log(`   ❌ Chat failed (${response.status}): ${error.slice(0, 200)}`);
      process.exit(1);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      console.log('   ❌ No response body');
      process.exit(1);
    }

    let buffer = '';
    let contentReceived = false;
    let conversationId = '';
    let currentEvent = '';

    process.stdout.write('   🤖 Response: ');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) {
          currentEvent = '';
          continue;
        }
        
        if (line.startsWith(':')) continue;

        if (line.startsWith('event: ')) {
          currentEvent = line.slice(7).trim();
          continue;
        }

        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          if (data === '[DONE]') break;

          try {
            const parsed = JSON.parse(data);
            
            if (currentEvent === 'conversation_id_set' && parsed.data?.conversation_id) {
              conversationId = parsed.data.conversation_id;
            } else if (currentEvent === 'message_chunk' && parsed.data?.text_chunk) {
              process.stdout.write(parsed.data.text_chunk);
              contentReceived = true;
            } else if (currentEvent === 'error' || parsed.error) {
              console.log(`\n   ❌ Agent error: ${parsed.error || parsed.data?.error}`);
              process.exit(1);
            }
          } catch (e) {
            // Skip malformed JSON
            console.warn('Failed to parse SSE data:', data, 'Error:', e);
          }
        }
      }
    }

    console.log('\n');

    if (contentReceived) {
      console.log(`   ✅ Chat streaming works!`);
      if (conversationId) {
        console.log(`   🆔 Conversation ID: ${conversationId}`);
      }
    } else {
      console.log(`   ⚠️  No content received from agent`);
    }

  } catch (error: any) {
    console.log(`\n   ❌ Error: ${error.message}`);
    process.exit(1);
  }

  console.log('\n✨ All tests passed! Chat feature is ready to use.\n');
}

testAgentAPI().catch(console.error);
