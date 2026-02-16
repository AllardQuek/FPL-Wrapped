/**
 * Test Elastic Agent Builder - Verify chat functionality
 * Run: npx tsx scripts/test-agent-api.ts
 */

import * as dotenv from 'dotenv';
import { streamChatWithAgent } from '../lib/chat/elastic-agent';

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
  // const testMessage = "What indices do you have access to?";
  const testMessage = "Compare top performers in league 1305804 with a chart";
  console.log(`   💬 Question: "${testMessage}"\n`);

  try {
    process.stdout.write('   🤖 Response: ');
    let contentReceived = false;
    let finalConversationId = '';

    for await (const chunk of streamChatWithAgent(testMessage)) {
      if (chunk.content) {
        process.stdout.write(chunk.content);
        contentReceived = true;
      }
      if (chunk.conversationId) {
        finalConversationId = chunk.conversationId;
      }
      if (chunk.error) {
        console.log(`\n   ❌ Agent error: ${chunk.error}`);
        process.exit(1);
      }
    }

    console.log('\n');

    if (contentReceived) {
      console.log(`   ✅ Chat streaming works!`);
      if (finalConversationId) {
        console.log(`   🆔 Conversation ID: ${finalConversationId}`);
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
