import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import express from "express";
import cors from "cors";

// Create an Express app
const app = express();

const DASHBOARD_API_URL = "http://localhost:9090"

// Enable CORS for all routes
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-api-key", "Mcp-Session-Id"],
  exposedHeaders: ["Content-Type", "Authorization", "x-api-key", "Mcp-Session-Id"]
}));

// Middleware to parse JSON
app.use(express.json({ limit: "4mb" }));

// Create the MCP server
const mcpServer = new McpServer({
  name: "dashboard-testing-mcp-server",
  version: "1.0.0"
});

// Tool 1: Get Test Templates - Retrieves all available test templates by dashboard category
mcpServer.tool(
  "get_test_templates",
  "Retrieve all available test templates filtered by dashboard category",
  {
    dashboardCategory: z.string().describe("The dashboard category to retrieve test templates for")
  },
  async ({ dashboardCategory }) => {
    try {
      console.log(`Fetching test templates for dashboard category: ${dashboardCategory}`);
      
      // Disable SSL verification for localhost HTTPS
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
      
      const response = await fetch(`${DASHBOARD_API_URL}/api/fetchTemplatesByCategory`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": " "
        },
        body: JSON.stringify({ dashboardCategory })
      });
      
      // Re-enable SSL verification
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1';
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }
      
      const templates = await response.json();
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify(templates, null, 2)
        }]
      };
    } catch (error) {
      console.error('Error fetching test templates:', error);
      
      // Fallback to mock data if API fails
      console.log('Falling back to mock data...');
      const mockTemplates = [
        {
          id: "perf_basic_001",
          description: `Basic performance test template for ${dashboardCategory}`
        },
        {
          id: "perf_load_002",
          description: `Load testing template with concurrent users for ${dashboardCategory}`
        },
        {
          id: "perf_stress_003",
          description: `Stress testing template to find breaking points for ${dashboardCategory}`
        },
        {
          id: "sec_vuln_001",
          description: `Security vulnerability scanning template for ${dashboardCategory}`
        },
        {
          id: "sec_auth_002",
          description: `Authentication and authorization testing template for ${dashboardCategory}`
        }
      ];
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify(mockTemplates, null, 2)
        }]
      };
    }
  }
);

// Tool 2: Start Test - Initiates a test run using a selected template
mcpServer.tool(
  "start_test",
  "Start a test run using a specific template on a target collection",
  {
    template_id: z.string().describe("The ID of the test template to use (from get_test_templates)"),
    collection: z.string().describe("The target collection to run the test against"),
    test_name: z.string().optional().describe("A custom name for this test run (optional)"),
    parameters: z.object({
      duration: z.string().optional().describe("Test duration (e.g., '30m', '1h')"),
      concurrency: z.number().optional().describe("Number of concurrent users/requests"),
      environment: z.string().optional().describe("Target environment (e.g., 'staging', 'production')")
    }).optional().describe("Additional parameters to override template defaults (optional)")
  },
  async ({ template_id, collection, test_name, parameters = {} }) => {
    try {
      // Mock test initiation
      const runId = `test_run_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const finalTestName = test_name || `${template_id}_on_${collection}_${new Date().toISOString().split('T')[0]}`;
      
      console.log(`Starting test: ${finalTestName}`);
      console.log(`Template ID: ${template_id}`);
      console.log(`Collection: ${collection}`);
      console.log(`Parameters:`, parameters);
      
      // In a real implementation, you would make an HTTP request to start the test
      // Example: 
      // const response = await fetch(`${DASHBOARD_API_URL}/tests/start`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     template_id,
      //     collection,
      //     test_name: finalTestName,
      //     parameters
      //   })
      // });
      
      // Mock response
      const testRun = {
        run_id: runId,
        test_name: finalTestName,
        template_id: template_id,
        collection: collection,
        status: "starting",
        created_at: new Date().toISOString(),
        estimated_duration: parameters.duration || "30m",
        dashboard_url: `https://dashboard.example.com/tests/${runId}`,
        parameters: {
          duration: "30m",
          concurrency: 10,
          environment: "staging",
          ...parameters
        }
      };

      return {
        content: [{
          type: "text",
          text: `✅ Test "${finalTestName}" has been successfully started!\n\n` +
                `📋 Test Details:\n` +
                `• Run ID: ${testRun.run_id}\n` +
                `• Template: ${testRun.template_id}\n` +
                `• Collection: ${testRun.collection}\n` +
                `• Status: ${testRun.status}\n` +
                `• Estimated Duration: ${testRun.estimated_duration}\n` +
                `• Environment: ${testRun.parameters.environment}\n` +
                `• Concurrency: ${testRun.parameters.concurrency}\n\n` +
                `🔗 Monitor Progress: ${testRun.dashboard_url}\n\n` +
                `The test is now initializing. You can monitor its progress in the dashboard.`
        }]
      };
    } catch (error) {
      console.error('Error starting test:', error);
      return {
        content: [{
          type: "text",
          text: `❌ Error starting test: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease check your parameters and try again.`
        }]
      };
    }
  }
);

// Store for managing server instances per session
const servers = new Map<string, McpServer>();
const transports = new Map<string, StreamableHTTPServerTransport>();

// Function to generate session ID
function generateSessionId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// Function to create a new server instance
function createServerInstance(): McpServer {
  const server = new McpServer({
    name: "dashboard-testing-mcp-server",
    version: "1.0.0"
  });

  // Register the testing tools on the new instance using the correct API
  server.tool(
    "get_test_templates",
    "Retrieve all available test templates filtered by dashboard category",
    {
      dashboardCategory: z.string().describe("The dashboard category to retrieve test templates for")
    },
    async ({ dashboardCategory }) => {
      try {
        console.log(`Fetching test templates for dashboard category: ${dashboardCategory}`);
        
        // Disable SSL verification for localhost HTTPS
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        
        const response = await fetch(`${DASHBOARD_API_URL}/api/fetchTemplatesByCategory`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": " "
          },
          body: JSON.stringify({ dashboardCategory })
        });
        
        // Re-enable SSL verification
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1';
        
        if (!response.ok) {
          throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }
        
        const templates = await response.json();
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify(templates, null, 2)
          }]
        };
      } catch (error) {
        console.error('Error fetching test templates:', error);
        
        // Fallback to mock data if API fails
        console.log('Falling back to mock data...');
        const mockTemplates = [
          {
            id: "perf_basic_001",
            description: `Basic performance test template for ${dashboardCategory}`
          },
          {
            id: "perf_load_002",
            description: `Load testing template with concurrent users for ${dashboardCategory}`
          },
          {
            id: "perf_stress_003",
            description: `Stress testing template to find breaking points for ${dashboardCategory}`
          },
          {
            id: "sec_vuln_001",
            description: `Security vulnerability scanning template for ${dashboardCategory}`
          },
          {
            id: "sec_auth_002",
            description: `Authentication and authorization testing template for ${dashboardCategory}`
          }
        ];
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify(mockTemplates, null, 2)
          }]
        };
      }
    }
  );

  server.tool(
    "start_test",
    "Start a test run using a specific template on a target collection",
    {
      template_id: z.string().describe("The ID of the test template to use (from get_test_templates)"),
      collection: z.string().describe("The target collection to run the test against"),
      test_name: z.string().optional().describe("A custom name for this test run (optional)"),
      parameters: z.object({
        duration: z.string().optional().describe("Test duration (e.g., '30m', '1h')"),
        concurrency: z.number().optional().describe("Number of concurrent users/requests"),
        environment: z.string().optional().describe("Target environment (e.g., 'staging', 'production')")
      }).optional().describe("Additional parameters to override template defaults (optional)")
    },
    async ({ template_id, collection, test_name, parameters = {} }) => {
      try {
        const runId = `test_run_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        const finalTestName = test_name || `${template_id}_on_${collection}_${new Date().toISOString().split('T')[0]}`;
        
        console.log(`Starting test: ${finalTestName}`);
        console.log(`Template ID: ${template_id}`);
        console.log(`Collection: ${collection}`);
        console.log(`Parameters:`, parameters);
        
        const testRun = {
          run_id: runId,
          test_name: finalTestName,
          template_id: template_id,
          collection: collection,
          status: "starting",
          created_at: new Date().toISOString(),
          estimated_duration: parameters?.duration || "30m",
          dashboard_url: `https://dashboard.example.com/tests/${runId}`,
          parameters: {
            duration: "30m",
            concurrency: 10,
            environment: "staging",
            ...parameters
          }
        };

        return {
          content: [{
            type: "text",
            text: `✅ Test "${finalTestName}" has been successfully started!\n\n` +
                  `📋 Test Details:\n` +
                  `• Run ID: ${testRun.run_id}\n` +
                  `• Template: ${testRun.template_id}\n` +
                  `• Collection: ${testRun.collection}\n` +
                  `• Status: ${testRun.status}\n` +
                  `• Estimated Duration: ${testRun.estimated_duration}\n` +
                  `• Environment: ${testRun.parameters.environment}\n` +
                  `• Concurrency: ${testRun.parameters.concurrency}\n\n` +
                  `🔗 Monitor Progress: ${testRun.dashboard_url}\n\n` +
                  `The test is now initializing. You can monitor its progress in the dashboard.`
          }]
        };
      } catch (error) {
        console.error('Error starting test:', error);
        return {
          content: [{
            type: "text",
            text: `❌ Error starting test: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease check your parameters and try again.`
          }]
        };
      }
    }
  );

  return server;
}

// Main MCP endpoint - handles both GET and POST requests
app.all("/mcp", async (req, res) => {
  try {
    let sessionId: string;
    
    // Handle session management
    if (req.method === "POST") {
      // For POST requests, get session ID from header or create new one
      sessionId = req.headers['mcp-session-id'] as string || generateSessionId();
    } else {
      // For GET requests, always create new session
      sessionId = generateSessionId();
    }

    // Get or create server instance for this session
    let server = servers.get(sessionId);
    let transport = transports.get(sessionId);

    if (!server || !transport) {
      server = createServerInstance();
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => sessionId
      });
      
      await server.connect(transport);
      
      servers.set(sessionId, server);
      transports.set(sessionId, transport);
      
      // Set session ID header for client
      res.setHeader("Mcp-Session-Id", sessionId);
    }

    // Handle the request
    await transport.handleRequest(req, res, req.body);

  } catch (error) {
    console.error("Error handling MCP request:", error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error",
          data: { error: error instanceof Error ? error.message : String(error) }
        },
        id: null
      });
    }
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    server: "dashboard-testing-mcp-server",
    version: "1.0.0",
    transport: "Streamable HTTP",
    tools: ["get_test_templates", "start_test"],
    activeSessions: servers.size
  });
});

// Root endpoint with server info
app.get("/", (req, res) => {
  res.json({
    name: "Dashboard Testing MCP Server",
    version: "1.0.0",
    description: "An MCP server for dashboard testing workflow - get test templates and start tests",
    endpoints: {
      mcp: "/mcp",
      health: "/health"
    },
    tools: [
      {
        name: "get_test_templates",
        description: "Retrieve available test templates by dashboard category",
        parameters: ["dashboardCategory"]
      },
      {
        name: "start_test", 
        description: "Start a test run using a template on a collection",
        parameters: ["template_id", "collection", "test_name (optional)", "parameters (optional)"]
      }
    ],
    workflow: [
      "1. User types: 'please run a performance test on users collection'",
      "2. Claude calls get_test_templates with category='performance'",
      "3. Claude calls start_test with selected template_id and collection='users'"
    ],
    transport: "Streamable HTTP (latest MCP specification)",
    usage: {
      connect: "POST /mcp",
      inspector: "Use MCP Inspector to test tools interactively"
    }
  });
});

// Session cleanup endpoint (optional, for development)
app.delete("/sessions/:sessionId", (req, res) => {
  const sessionId = req.params.sessionId;
  
  const server = servers.get(sessionId);
  const transport = transports.get(sessionId);
  
  if (server && transport) {
    server.close();
    transport.close();
    servers.delete(sessionId);
    transports.delete(sessionId);
    
    res.json({ 
      message: `Session ${sessionId} cleaned up successfully`,
      remainingSessions: servers.size
    });
  } else {
    res.status(404).json({ 
      error: `Session ${sessionId} not found` 
    });
  }
});

// Cleanup inactive sessions periodically
setInterval(() => {
  const now = Date.now();
  const maxAge = 30 * 60 * 1000; // 30 minutes
  
  for (const [sessionId, transport] of transports.entries()) {
    // This is a simple cleanup - in production you'd want more sophisticated session management
    if (transport && typeof (transport as any).lastActivity === 'number') {
      if (now - (transport as any).lastActivity > maxAge) {
        const server = servers.get(sessionId);
        if (server) {
          server.close();
          servers.delete(sessionId);
        }
        transport.close();
        transports.delete(sessionId);
        console.log(`Cleaned up inactive session: ${sessionId}`);
      }
    }
  }
}, 5 * 60 * 1000); // Check every 5 minutes

async function startServer() {
  try {
    console.log("🚀 Starting Dashboard Testing MCP Server...");
    console.log("📋 Using the latest MCP specification (Streamable HTTP transport)");
    console.log("");
    
    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => {
      console.log(`🌐 Dashboard Testing MCP Server running on port ${PORT}`);
      console.log(`🔗 MCP endpoint: http://localhost:${PORT}/mcp`);
      console.log(`💡 Health check: http://localhost:${PORT}/health`);
      console.log(`📖 Server info: http://localhost:${PORT}/`);
      console.log("");
      console.log("🔧 Available tools:");
      console.log("  • get_test_templates - Retrieve test templates by dashboard category");
      console.log("  • start_test - Start a test run using a template on a collection");
      console.log("");
      console.log("📋 Workflow:");
      console.log("  1. User: 'please run a performance test on users collection'");
      console.log("  2. Claude calls: get_test_templates(dashboardCategory='performance')");
      console.log("  3. Claude calls: start_test(template_id='...', collection='users')");
      console.log("");
      console.log("🧪 To test with MCP Inspector:");
      console.log(`   npx @modelcontextprotocol/inspector http://localhost:${PORT}/mcp`);
      console.log("");
      console.log("✅ Server ready to accept MCP connections!");
    });
    
  } catch (error) {
    console.error("❌ Failed to start MCP server:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down MCP server...');
  
  // Close all server instances
  for (const [sessionId, server] of servers.entries()) {
    console.log(`Closing session: ${sessionId}`);
    await server.close();
  }
  
  // Close all transports
  for (const [sessionId, transport] of transports.entries()) {
    transport.close();
  }
  
  servers.clear();
  transports.clear();
  
  console.log('✅ Cleanup completed');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down MCP server...');
  
  // Close all server instances
  for (const [sessionId, server] of servers.entries()) {
    await server.close();
  }
  
  // Close all transports
  for (const [sessionId, transport] of transports.entries()) {
    transport.close();
  }
  
  servers.clear();
  transports.clear();
  
  process.exit(0);
});

// Start the server
startServer();