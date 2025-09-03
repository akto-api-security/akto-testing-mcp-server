import { z } from "zod";
import { logger } from "../utils/logger.js";
import { config } from "../utils/config.js";

export const startTestSchema = {
  apiCollectionId: z.number().describe("The API collection ID to run tests against"),
  selectedTests: z.array(z.string()).describe("Array of test IDs to run (e.g., ['CSRF_LOGIN_ATTACK', 'ADD_JKU_TO_JWT'])"),
  testName: z.string().describe("Name for this test run"),
  dashboardCategory: z.string().describe("The dashboard category context for this test")
};

interface StartTestParams {
  apiCollectionId: number;
  selectedTests: string[];
  testName: string;
  dashboardCategory: string;
}

export async function startTestHandler({ apiCollectionId, selectedTests, testName, dashboardCategory }: StartTestParams): Promise<any> {
  try {
    logger.info(`Starting test: ${testName} (Category: ${dashboardCategory})`);
    logger.debug(`API Collection ID: ${apiCollectionId}`);
    logger.debug(`Selected Tests: ${selectedTests.join(', ')}`);
    logger.debug(`Dashboard Category: ${dashboardCategory}`);
    
    // Build request payload with defaults for optional fields
    const payload = {
      apiCollectionId,
      type: "COLLECTION_WISE",
      startTimestamp: Math.floor(Date.now() / 1000),
      recurringDaily: false,
      recurringWeekly: false,
      recurringMonthly: false,
      selectedTests,
      testName,
      testRunTime: -1,
      maxConcurrentRequests: -1,
      overriddenTestAppUrl: "",
      testRoleId: "",
      continuousTesting: false,
      sendSlackAlert: false,
      sendMsTeamsAlert: false,
      testConfigsAdvancedSettings: [],
      cleanUpTestingResources: false,
      testSuiteIds: [],
      autoTicketingDetails: null
    };
    
    logger.debug(`Request payload: ${JSON.stringify(payload, null, 2)}`);
    
    // Disable SSL verification for localhost HTTPS (if needed)
    if (config.dashboard.apiUrl.startsWith('https://localhost')) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }
    
    const response = await fetch(`${config.dashboard.apiUrl}/api/startTest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.dashboard.apiKey,
        "x-context-source": dashboardCategory
      },
      body: JSON.stringify(payload)
    });
    
    // Re-enable SSL verification
    if (config.dashboard.apiUrl.startsWith('https://localhost')) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1';
    }
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // Format the response
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({
          success: true,
          message: `Test "${testName}" has been successfully started!`,
          details: {
            apiCollectionId,
            selectedTests,
            testName,
            dashboardCategory,
            response: result
          }
        }, null, 2)
      }]
    };
  } catch (error) {
    logger.error('Error starting test:', error);
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({
          success: false,
          error: `Error starting test: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: {
            apiCollectionId,
            selectedTests,
            testName,
            dashboardCategory
          }
        }, null, 2)
      }]
    };
  }
}