import fetch from 'node-fetch';

async function testStartTool() {
  const sessionId = 'test-start-tool-' + Date.now();
  
  // Initialize session
  const initResponse = await fetch('http://localhost:8080/mcp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'Mcp-Session-Id': sessionId
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'initialize',
      params: {
        protocolVersion: '0.1.0',
        capabilities: {},
        clientInfo: {
          name: 'test-client',
          version: '1.0.0'
        }
      },
      id: 1
    })
  });

  console.log('Initialize response status:', initResponse.status);

  // Call the start_test tool
  const toolResponse = await fetch('http://localhost:8080/mcp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'Mcp-Session-Id': sessionId
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'start_test',
        arguments: {
          apiCollectionId: 1755537354,
          selectedTests: ['CSRF_LOGIN_ATTACK', 'ADD_JKU_TO_JWT'],
          testName: 'juice_shop_demo_NO_AUTH',
          dashboardCategory: 'mcp'
        }
      },
      id: 2
    })
  });

  console.log('\nTool call response status:', toolResponse.status);
  const toolText = await toolResponse.text();
  
  // Parse the event stream
  const lines = toolText.split('\n');
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      try {
        const data = JSON.parse(line.substring(6));
        console.log('\nStartTest Tool Response:');
        if (data.result && data.result.content && data.result.content[0]) {
          const content = JSON.parse(data.result.content[0].text);
          console.log(JSON.stringify(content, null, 2));
        } else {
          console.log(JSON.stringify(data, null, 2));
        }
      } catch (e) {
        // Skip non-JSON lines
      }
    }
  }
}

testStartTool().catch(console.error);