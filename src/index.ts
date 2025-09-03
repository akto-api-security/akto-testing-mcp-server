import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import express from "express";
import cors from "cors";
import { registerTools } from "./tools/index.js";
import { 
  generateSessionId, 
  getOrCreateServerForSession, 
  cleanupSession, 
  cleanupInactiveSessions,
  cleanupAllSessions,
  getActiveSessionCount 
} from "./server/sessionManager.js";
import { config } from "./utils/config.js";
import { logger } from "./utils/logger.js";

// Create Express app
const app = express();

// Configure middleware
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-api-key", "Mcp-Session-Id"],
  exposedHeaders: ["Content-Type", "Authorization", "x-api-key", "Mcp-Session-Id"]
}));

app.use(express.json({ limit: "4mb" }));

// Create main MCP server instance
const mcpServer = new McpServer({
  name: config.server.name,
  version: config.server.version
});

// Register tools on main server
registerTools(mcpServer);

// Main MCP endpoint
app.all("/mcp", async (req, res) => {
  try {
    let sessionId: string;
    
    // Handle session management
    if (req.method === "POST") {
      sessionId = req.headers['mcp-session-id'] as string || generateSessionId();
    } else {
      sessionId = generateSessionId();
    }

    // Get or create server instance for this session
    const { transport } = await getOrCreateServerForSession(sessionId);
    
    // Set session ID header for client
    res.setHeader("Mcp-Session-Id", sessionId);

    // Handle the request
    await transport.handleRequest(req, res, req.body);

  } catch (error) {
    logger.error("Error handling MCP request:", error);
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
app.get("/health", (_req, res) => {
  res.json({ 
    status: "healthy", 
    server: config.server.name,
    version: config.server.version,
    transport: "Streamable HTTP",
    tools: ["get_test_templates", "start_test"],
    activeSessions: getActiveSessionCount()
  });
});

// Root endpoint with server info
app.get("/", (_req, res) => {
  res.json({
    name: "Dashboard Testing MCP Server",
    version: config.server.version,
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
        description: "Start a test run on an API collection with selected tests",
        parameters: ["apiCollectionId", "selectedTests", "testName", "dashboardCategory"]
      }
    ],
    workflow: [
      "1. User types: 'please run security tests on API collection 1755537354'",
      "2. Claude calls get_test_templates with dashboardCategory='mcp'",
      "3. Claude calls start_test with apiCollectionId=1755537354, selectedTests=['CSRF_LOGIN_ATTACK'], testName='security_test', dashboardCategory='mcp'"
    ],
    transport: "Streamable HTTP (latest MCP specification)",
    usage: {
      connect: "POST /mcp",
      inspector: "Use MCP Inspector to test tools interactively"
    }
  });
});

// Session cleanup endpoint (for development)
app.delete("/sessions/:sessionId", (req, res) => {
  const sessionId = req.params.sessionId;
  
  if (cleanupSession(sessionId)) {
    res.json({ 
      message: `Session ${sessionId} cleaned up successfully`,
      remainingSessions: getActiveSessionCount()
    });
  } else {
    res.status(404).json({ 
      error: `Session ${sessionId} not found` 
    });
  }
});

// Cleanup inactive sessions periodically
setInterval(() => {
  cleanupInactiveSessions();
}, config.session.cleanupInterval);

// Start server
async function startServer() {
  try {
    logger.info("🚀 Starting Dashboard Testing MCP Server...");
    logger.info("📋 Using the latest MCP specification (Streamable HTTP transport)");
    
    app.listen(config.server.port, () => {
      logger.info(`🌐 Server running on port ${config.server.port}`);
      logger.info(`🔗 MCP endpoint: http://localhost:${config.server.port}/mcp`);
      logger.info(`💡 Health check: http://localhost:${config.server.port}/health`);
      logger.info(`📖 Server info: http://localhost:${config.server.port}/`);
      logger.info("");
      logger.info("🔧 Available tools:");
      logger.info("  • get_test_templates - Retrieve test templates by dashboard category");
      logger.info("  • start_test - Start a test run using a template on a collection");
      logger.info("");
      logger.info("✅ Server ready to accept MCP connections!");
    });
    
  } catch (error) {
    logger.error("❌ Failed to start MCP server:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('\n🛑 Shutting down MCP server...');
  await cleanupAllSessions();
  logger.info('✅ Cleanup completed');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('\n🛑 Shutting down MCP server...');
  await cleanupAllSessions();
  process.exit(0);
});

// Start the server
startServer();