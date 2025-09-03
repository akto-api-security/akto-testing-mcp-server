import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getTestTemplatesSchema, getTestTemplatesHandler } from "./getTestTemplates.js";
import { startTestSchema, startTestHandler } from "./startTest.js";
import { getApiCollectionsSchema, getApiCollectionsHandler } from "./getApiCollections.js";

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

  // Register get_api_collections tool
  server.tool(
    "get_api_collections",
    "Retrieve all API collections with their IDs and names for a specific dashboard category",
    getApiCollectionsSchema,
    async (args) => getApiCollectionsHandler(args)
  );
}