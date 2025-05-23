# TenantArmor Local Mock Polling Setup

This document describes the local mock setup for testing the eviction response polling architecture without requiring AWS infrastructure.

## Overview

The mock setup simulates the complete production workflow:
- **Frontend**: Upload → Processing → Results (same as production)
- **Backend**: Job queue → Background processing → Status polling
- **Database**: In-memory job tracking with realistic timing

## Quick Start

```bash
# From tenantarmor directory
npm run dev

# Visit http://localhost:3000/dashboard/eviction-response
# Upload any PDF/image file and select a state
# Watch real-time polling in action!
```

## Architecture

### Local Mock Components

1. **Mock Database** (`src/lib/mock-database.ts`)
   - In-memory job storage using Map
   - Background processor simulating Lambda
   - Realistic processing steps with delays

2. **Enhanced API Routes**
   - `/api/eviction-response/analyze` - Creates job, returns jobId
   - `/api/eviction-response/status/[jobId]` - Polling endpoint
   - `/api/debug/jobs` - Debug endpoint (dev only)

3. **Smart Frontend**
   - Detects polling vs immediate response mode
   - Real-time progress updates via polling
   - Visual job ID display

## How It Works

### 1. Job Creation
```javascript
// POST /api/eviction-response/analyze
{
  "success": true,
  "jobId": "job_1234567890_abc123def",
  "message": "Analysis job created successfully",
  "polling": {
    "statusUrl": "/api/eviction-response/status/job_1234567890_abc123def",
    "pollInterval": 2000
  }
}
```

### 2. Background Processing
- Simulates 6 processing steps with realistic timing
- Updates job status: `pending` → `processing` → `completed`
- Generates state-specific legal responses
- Includes actual uploaded file name in results

### 3. Frontend Polling
```javascript
// Every 2 seconds:
// GET /api/eviction-response/status/job_1234567890_abc123def
{
  "jobId": "job_1234567890_abc123def",
  "status": "processing",
  "progress": 45,
  "currentStep": "Analyzing legal content with AI",
  "createdAt": 1640995200000,
  "updatedAt": 1640995245000
}
```

### 4. Completion
```javascript
// Final poll response:
{
  "jobId": "job_1234567890_abc123def", 
  "status": "completed",
  "progress": 100,
  "currentStep": "Analysis complete",
  "results": {
    "noticeType": "Non-Payment of Rent",
    "responseText": "...",
    // ... full legal response
  }
}
```

## Testing Features

### Debug Monitoring
Visit: `http://localhost:3000/api/debug/jobs`
```json
{
  "totalJobs": 3,
  "jobs": [
    {
      "id": "job_1234567890_abc123def",
      "status": "completed",
      "progress": 100,
      "currentStep": "Analysis complete",
      "state": "CA",
      "fileName": "eviction-notice.pdf",
      "createdAt": "2024-01-01T12:00:00.000Z",
      "hasResults": true
    }
  ]
}
```

### Console Logging
```
[MockDB] Created job job_1234567890_abc123def for state CA
[MockDB] Updated job job_1234567890_abc123def: Document upload confirmed
[MockDB] Updated job job_1234567890_abc123def: Extracting text with OCR
[POLLING MODE] Starting job polling for: job_1234567890_abc123def
```

## Configuration

### Environment Detection
- **Local Mock Mode**: `NODE_ENV=development` OR no AWS keys
- **Production Mode**: `NODE_ENV=production` AND AWS keys present

### Timing Configuration
Edit `src/lib/config.ts`:
```javascript
mockTiming: {
  uploadConfirm: 2000,     // 2s
  ocrProcessing: 3000,     // 3s
  aiAnalysis: 4000,        // 4s
  templateLoading: 2000,   // 2s
  responseGeneration: 3000, // 3s
  finalReview: 1000        // 1s
}
```

### Polling Settings
```javascript
polling: {
  intervalMs: 2000,    // Poll every 2 seconds
  maxAttempts: 60,     // 2 minutes total
  timeoutMs: 120000    // 2 minute timeout
}
```

## Mock Data Quality

### State-Specific Responses
- Uses actual state names and codes
- References real legal statutes (format)
- Includes uploaded file name in response
- Generates appropriate legal aid contacts

### Realistic Legal Content
- Professional legal letter formatting
- Certificate of service
- State-specific court instructions
- Deadline calculations
- Multiple defense strategies

## Switching to Production

### Method 1: Environment Variables
```bash
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret
export AWS_REGION=us-west-2
export SQS_QUEUE_URL=your_queue_url
npm run dev
```

### Method 2: Configuration Override
Edit `src/lib/config.ts`:
```javascript
useLocalMock: false, // Force production mode
```

## Benefits

1. **Fast Development**: No AWS setup required
2. **Realistic Testing**: Actual polling behavior
3. **Visual Debugging**: See jobs in browser console
4. **Easy Switching**: Toggle between mock/real with env vars
5. **MVP Ready**: Same UI/UX as production

## Production Readiness

The mock setup prepares for production by:
- ✅ Implementing exact polling API contract
- ✅ Handling async job processing
- ✅ Supporting state-specific responses
- ✅ Providing error handling and timeouts
- ✅ Maintaining job persistence (during session)
- ✅ Real-time UI updates

When you're ready to connect to AWS Lambda/SQS/DynamoDB, simply add the environment variables and the frontend will seamlessly switch to production mode! 