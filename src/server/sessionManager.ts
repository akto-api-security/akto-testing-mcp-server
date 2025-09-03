import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { registerTools } from "../tools/index.js";
import { config } from "../utils/config.js";
import { logger } from "../utils/logger.js";

// Store for managing server instances per session
const servers = new Map<string, McpServer>();
const transports = new Map<string, StreamableHTTPServerTransport>();

// Generate session ID
export function generateSessionId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// Create a new server instance
export function createServerInstance(): McpServer {
  const server = new McpServer({
    name: config.server.name,
    version: config.server.version
  });

  // Register all tools on the new instance
  registerTools(server);

  return server;
}

// Get or create server for session
export async function getOrCreateServerForSession(sessionId: string) {
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
  }

  return { server, transport };
}

// Cleanup session
export function cleanupSession(sessionId: string): boolean {
  const server = servers.get(sessionId);
  const transport = transports.get(sessionId);
  
  if (server && transport) {
    server.close();
    transport.close();
    servers.delete(sessionId);
    transports.delete(sessionId);
    return true;
  }
  
  return false;
}

// Cleanup inactive sessions
export function cleanupInactiveSessions() {
  const now = Date.now();
  
  for (const [sessionId, transport] of transports.entries()) {
    if (transport && typeof (transport as any).lastActivity === 'number') {
      if (now - (transport as any).lastActivity > config.session.maxAge) {
        const server = servers.get(sessionId);
        if (server) {
          server.close();
          servers.delete(sessionId);
        }
        transport.close();
        transports.delete(sessionId);
        logger.info(`Cleaned up inactive session: ${sessionId}`);
      }
    }
  }
}

// Cleanup all sessions
export async function cleanupAllSessions() {
  for (const [sessionId, server] of servers.entries()) {
    logger.debug(`Closing session: ${sessionId}`);
    await server.close();
  }
  
  for (const [, transport] of transports.entries()) {
    transport.close();
  }
  
  servers.clear();
  transports.clear();
}

// Get active session count
export function getActiveSessionCount(): number {
  return servers.size;
}