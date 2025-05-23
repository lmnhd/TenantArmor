// Configuration for TenantArmor environment settings

export const config = {
  // Environment detection
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  
  // Mock vs Real AWS detection
  useLocalMock: process.env.NODE_ENV === 'development' || !process.env.AWS_ACCESS_KEY_ID,
  
  // AWS Configuration
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sqsQueueUrl: process.env.SQS_QUEUE_URL,
    dynamoTableName: process.env.DYNAMO_TABLE_NAME || 'TenantArmor-Templates',
  },
  
  // Polling configuration
  polling: {
    intervalMs: 2000, // 2 seconds
    maxAttempts: 60,  // 2 minutes total (60 * 2s)
    timeoutMs: 120000 // 2 minutes
  },
  
  // Mock processing timing (for local development)
  mockTiming: {
    uploadConfirm: 2000,   // 2s
    ocrProcessing: 3000,   // 3s
    aiAnalysis: 4000,      // 4s
    templateLoading: 2000, // 2s
    responseGeneration: 3000, // 3s
    finalReview: 1000      // 1s
  },
  
  // API endpoints
  api: {
    evictionAnalyze: '/api/eviction-response/analyze',
    evictionStatus: (jobId: string) => `/api/eviction-response/status/${jobId}`,
    debugJobs: '/api/debug/jobs'
  },
  
  // Feature flags
  features: {
    enablePolling: true,
    enableMockProcessor: process.env.NODE_ENV === 'development',
    enableDebugEndpoints: process.env.NODE_ENV === 'development',
    enableRealTimeUpdates: true
  },
  
  // Legal disclaimer settings
  legal: {
    showDisclaimer: true,
    requireAcknowledgment: false // Could be enabled for production
  }
};

// Helper functions
export const isLocalMode = () => config.useLocalMock;
export const isPollingEnabled = () => config.features.enablePolling;
export const getPollingInterval = () => config.polling.intervalMs;

// Environment info for debugging
export const getEnvironmentInfo = () => ({
  nodeEnv: process.env.NODE_ENV,
  useLocalMock: config.useLocalMock,
  hasAWSKeys: !!(config.aws.accessKeyId && config.aws.secretAccessKey),
  pollingEnabled: config.features.enablePolling,
  debugEnabled: config.features.enableDebugEndpoints
});

// Log environment on startup (only in development)
if (config.isDevelopment) {
  console.log('[CONFIG] Environment Info:', getEnvironmentInfo());
} 