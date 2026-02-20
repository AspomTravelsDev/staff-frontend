// Configuration for Mock vs Real API
// Set to true to use Mock Data, false to use Real API
export const API_CONFIG = {
    useMockRequests: true,
    useMockCrm: false,
    useMockEmployees: false,
    useMockVisa: true,
    useMockActivity: true,
    useMockLeave: true,
    useMockInventory: true,
    useMockPerformance: true,
    useMockCompliance: true,
    useMockAwards: true,
    useMockDashboard: true,
} as const;

// Helper to check if a specific module should use mocks
export const shouldMock = (key: keyof typeof API_CONFIG) => API_CONFIG[key];
