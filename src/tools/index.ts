import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getTestTemplatesSchema, getTestTemplatesHandler } from "./getTestTemplates.js";
import { startTestSchema, startTestHandler } from "./startTest.js";

export function registerTools(server: McpServer) {
  // Register get_test_templates tool
  server.tool(
    "get_test_templates",
    "Retrieve all available test templates filtered by dashboard category",
    getTestTemplatesSchema,
    async (args) => getTestTemplatesHandler(args)
  );

  // Register start_test tool
  server.tool(
    "start_test",
    "Start a test run using a specific template on a target collection",
    startTestSchema,
    async (args) => startTestHandler(args)
  );
}