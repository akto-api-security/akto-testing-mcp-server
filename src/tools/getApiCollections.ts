import { z } from "zod";
import { config } from "../utils/config.js";
import { logger } from "../utils/logger.js";

export const getApiCollectionsSchema = {
  dashboardCategory: z.string().describe("The dashboard category to retrieve API collections for")
};

export async function getApiCollectionsHandler({ dashboardCategory }: { dashboardCategory: string }) {
  try {
    logger.info(`Fetching API collections for dashboard category: ${dashboardCategory}`);
    
    // Disable SSL verification for localhost HTTPS (if needed)
    if (config.dashboard.apiUrl.startsWith('https://localhost')) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }
    
    const response = await fetch(`${config.dashboard.apiUrl}/api/getAllCollections`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.dashboard.apiKey,
        "x-context-source": dashboardCategory
      },
      body: JSON.stringify({ })
    });
    
    // Re-enable SSL verification
    if (config.dashboard.apiUrl.startsWith('https://localhost')) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1';
    }
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }
    
    const data: any = await response.json();
    
    // Extract only the apiCollections field from the response
    const apiCollections = data.apiCollections || {};
    
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify(apiCollections, null, 2)
      }]
    };
  } catch (error) {
    logger.error('Error fetching API collections:', error);
    
    return {
      content: [{
        type: "text" as const,
        text: `Error fetching API collections: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    };
  }
}