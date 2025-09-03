export const config = {
  dashboard: {
    apiUrl: process.env.DASHBOARD_API_URL || "http://localhost:9090",
    apiKey: process.env.DASHBOARD_API_KEY || ""
  },
  server: {
    port: process.env.PORT || 8080,
    name: "dashboard-testing-mcp-server",
    version: "1.0.0"
  },
  session: {
    maxAge: 30 * 60 * 1000, // 30 minutes
    cleanupInterval: 5 * 60 * 1000 // 5 minutes
  }
};