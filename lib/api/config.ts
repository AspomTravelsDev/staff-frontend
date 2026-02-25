// Configuration for Mock vs Real API
// Set to true to use Mock Data, false to use Real API
export const API_CONFIG = {
    useMockRequests: true,
    useMockEmployees: false,
    useMockVisa: false,
    useMockActivity: true,
    useMockLeave: true,
    useMockInventory: false,
    useMockPerformance: true,
    useMockCompliance: true,
    useMockAwards: false,
    useMockDashboard: true,
} as const;

// Helper to check if a specific module should use mocks
export const shouldMock = (key: keyof typeof API_CONFIG) => API_CONFIG[key];
