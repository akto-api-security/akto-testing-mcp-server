import { z } from "zod";
import { config } from "../utils/config.js";
import { logger } from "../utils/logger.js";

export const getTestTemplatesSchema = {
  dashboardCategory: z.string().describe("The dashboard category to retrieve test templates for")
};

export async function getTestTemplatesHandler({ dashboardCategory }: { dashboardCategory: string }) {
  try {
    logger.info(`Fetching test templates for dashboard category: ${dashboardCategory}`);
    
    // Disable SSL verification for localhost HTTPS (if needed)
    if (config.dashboard.apiUrl.startsWith('https://localhost')) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }
    
    const response = await fetch(`${config.dashboard.apiUrl}/api/fetchTemplatesByCategory`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.dashboard.apiKey,
        "x-context-source": dashboardCategory
      },
      body: JSON.stringify({ dashboardCategory })
    });
    
    // Re-enable SSL verification
    if (config.dashboard.apiUrl.startsWith('https://localhost')) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1';
    }
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }
    
    const templates = await response.json();
    
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify(templates, null, 2)
      }]
    };
  } catch (error) {
    logger.error('Error fetching test templates:', error);
    
    return {
      content: [{
        type: "text" as const,
        text: `Error fetching test templates: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    };
  }
}