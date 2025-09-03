import fetch from 'node-fetch';

async function testTool() {
  const sessionId = 'test-tool-' + Date.now();
  
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

  // Call the get_test_templates tool
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
        name: 'get_test_templates',
        arguments: {
          dashboardCategory: 'performance'
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
        console.log('\nTool response:', JSON.stringify(data, null, 2));
      } catch (e) {
        // Skip non-JSON lines
      }
    }
  }
}

testTool().catch(console.error);