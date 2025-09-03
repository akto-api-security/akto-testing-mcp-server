import fetch from 'node-fetch';

async function testMCP() {
  const sessionId = 'test-session-' + Date.now();
  
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
  const initText = await initResponse.text();
  console.log('Initialize response:', initText);

  // List tools
  const toolsResponse = await fetch('http://localhost:8080/mcp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'Mcp-Session-Id': sessionId
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'tools/list',
      params: {},
      id: 2
    })
  });

  console.log('\nTools response status:', toolsResponse.status);
  const toolsText = await toolsResponse.text();
  console.log('Tools response:', toolsText);
  
  // Try to parse the event stream
  const lines = toolsText.split('\n');
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      try {
        const data = JSON.parse(line.substring(6));
        console.log('\nParsed tool data:', JSON.stringify(data, null, 2));
      } catch (e) {
        // Skip non-JSON lines
      }
    }
  }
}

testMCP().catch(console.error);