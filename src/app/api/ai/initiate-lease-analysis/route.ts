import { NextResponse } from 'next/server';
import { DynamoDBClient, UpdateItemCommand, AttributeValue } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
// import OpenAI from 'openai'; // Ensures this line is commented out or removed

// Initialize AWS Clients
const awsRegion = process.env.AWS_REGION || 'us-east-1';
const dynamoDbTableName = process.env.DYNAMODB_LEASE_ANALYSES_TABLE;
const aiProcessingQueueUrl = process.env.AI_PROCESSING_QUEUE_URL;

let ddbClient: DynamoDBClient;
let sqsClient: SQSClient;

if (process.env.NODE_ENV === 'development' && process.env.USE_LOCAL_DYNAMODB === 'true') {
  console.log('Using local DynamoDB endpoint');
  ddbClient = new DynamoDBClient({
    region: awsRegion,
    endpoint: process.env.LOCAL_DYNAMODB_ENDPOINT || 'http://localhost:8000',
    credentials: {
        accessKeyId: 'fakeMyKeyId', 
        secretAccessKey: 'fakeSecretAccessKey'
    }
  });
  console.log('Initializing SQS client for development (potentially local or AWS default)');
  sqsClient = new SQSClient({ 
    region: awsRegion,
  });
} else {
  console.log('Initializing DynamoDB and SQS clients for production (using static credentials)');
  ddbClient = new DynamoDBClient({ 
    region: awsRegion,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID_NEXTJS_APP || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_NEXTJS_APP || '',
    }
  });
  sqsClient = new SQSClient({ 
    region: awsRegion,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID_NEXTJS_APP || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_NEXTJS_APP || '',
    }
  });
}

// --- TypeScript Interfaces for AI Schemas ---
// Commenting out as they are marked unused by linter in this file. 
// They are defined in leaseAnalysisLogic.ts and types.ts
/*
interface Issue {
  description: string;
  severity: "High" | "Medium" | "Low";
  recommendation: string;
}

interface Clause {
  title: string;
  text: string;
  issues: Issue[];
}

interface InitialAnalysisResults { // Marked unused
  summary: string;
  overallSeverity: "High" | "Medium" | "Low";
  clauses: Clause[];
}

interface NextStep {
  step: string;
  importance: "High" | "Medium" | "Consider";
  details?: string; // Optional property
}

interface ActionableInsightsData { // Marked unused
  actionableInsights: {
    overallRecommendation: string;
    nextSteps: NextStep[];
  };
}
*/

// --- Schema for the first AI call (Initial Analysis) ---
// Kept for now - Oh, these were marked as unused too. Removing.
// const initialAnalysisJsonSchema = { /* ... */ };

// --- Schema for the second AI call (Actionable Insights) ---
// const actionableInsightsJsonSchema = { /* ... */ };

// --- Core AI Processing Function (performAiLeaseAnalysis) ---
// This function is defined in `tenantarmor/src/lib/aiUtils/leaseAnalysisLogic.ts`
// and is called by the Lambda, not this API route directly anymore. So, no definition here.

async function updateDynamoDBStatus(analysisId: string, status: string, results?: Record<string, unknown>, errorDetails?: string) {
  if (!ddbClient || !dynamoDbTableName) {
    console.error('DynamoDB client or table name not initialized for status update.');
    return;
  }
  
  const setUpdateExpressionParts: string[] = [
    "#status = :status",
    "lastUpdatedTimestamp = :lastUpdatedTimestamp"
  ];
  const expressionAttributeNames: { [key: string]: string } = { '#status': 'status' };
  const expressionAttributeValues: Record<string, AttributeValue> = {
    ':status': { S: status },
    ':lastUpdatedTimestamp': { S: new Date().toISOString() },
  };

  if (results) {
    setUpdateExpressionParts.push("analysisResults = :analysisResults");
    expressionAttributeValues[':analysisResults'] = { M: marshall(results, { convertEmptyValues: true, removeUndefinedValues: true }) };
  }
  
  let updateExpression = `SET ${setUpdateExpressionParts.join(", ")}`;
  
  if (errorDetails) {
    setUpdateExpressionParts.push("errorDetails = :errorDetails");
    expressionAttributeValues[':errorDetails'] = { S: errorDetails };
    updateExpression = `SET ${setUpdateExpressionParts.join(", ")}`;
  } else {
    updateExpression += " REMOVE errorDetails";
  }

  const command = new UpdateItemCommand({
    TableName: dynamoDbTableName!,
    Key: { analysisId: { S: analysisId } },
    UpdateExpression: updateExpression,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: "UPDATED_NEW", 
  });

  try {
    await ddbClient.send(command);
    console.log(`DynamoDB status updated for ${analysisId} to ${status}. Error details (if any) handled.`);
  } catch (dbError) {
    console.error(`Error updating DynamoDB for ${analysisId}:`, dbError);
    // Do not rethrow here to prevent masking the primary SQS operation status
    // The Lambda will also perform updates, this is an initial status update.
  }
}

export async function POST(request: Request) {
  // console.log('API /api/ai/initiate-lease-analysis POST request received - TEST EDIT.'); // Removed test log
  console.log('API /api/ai/initiate-lease-analysis POST request received.');

  if (!ddbClient || !dynamoDbTableName) {
    console.error('DynamoDB client or table name not configured.');
    return NextResponse.json({ error: 'Server configuration error for database.' }, { status: 500 });
  }
  if (!sqsClient || !aiProcessingQueueUrl) {
    console.error('SQS client or queue URL not configured.');
    return NextResponse.json({ error: 'Server configuration error for messaging queue.' }, { status: 500 });
  }

  let validatedRequestBody: { 
    analysisId: string; 
    extractedText: string; 
    userSelectedState: string; 
    s3Key?: string; 
    s3Bucket?: string; 
    originalFileName?: string; 
    userId?: string; 
  } | null = null;
  const clonedRequest = request.clone();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rawRequestBody: any; // Reverted to any, with ESLint disable for this line

  try {
    rawRequestBody = await request.json();

    // Validate the structure of the request body
    if (rawRequestBody && 
        typeof rawRequestBody.analysisId === 'string' && 
        typeof rawRequestBody.extractedText === 'string' && 
        typeof rawRequestBody.userSelectedState === 'string') {
      validatedRequestBody = rawRequestBody; // Assign if valid
    } else {
      console.warn('Missing or invalid required fields in request body:', rawRequestBody);
      const potentialAnalysisId = rawRequestBody?.analysisId; // Kept as const
      // Try to update DynamoDB even if body is malformed, if analysisId is present
      if (typeof potentialAnalysisId === 'string' && potentialAnalysisId) {
        try {
            await updateDynamoDBStatus(potentialAnalysisId, 'AI_PROCESSING_FAILED', undefined, `API Error: Invalid request body structure. Required: analysisId, extractedText, userSelectedState.`);
        } catch (dbError) { 
            console.error('Failed to update DB for malformed request with potential analysisId', dbError); 
        }
      }
      return NextResponse.json({ error: 'Invalid request body. Required fields: analysisId (string), extractedText (string), userSelectedState (string).' }, { status: 400 });
    }

    // Add an explicit check to satisfy the linter, though theoretically unreachable if above logic is sound.
    if (!validatedRequestBody) {
      console.error("validatedRequestBody is null before destructuring. This indicates an unexpected internal state.");
      const potentialAnalysisId = rawRequestBody?.analysisId; // Kept as const
      if (typeof potentialAnalysisId === 'string' && potentialAnalysisId) {
        try {
            await updateDynamoDBStatus(potentialAnalysisId, 'AI_PROCESSING_FAILED', undefined, `API Error: Internal server error, request body unexpectedly null after validation.`);
        } catch (dbError) { 
            console.error('Failed to update DB for unexpected null body with potential analysisId', dbError); 
        }
      }
      return NextResponse.json({ error: 'Internal server error processing request body after validation.' }, { status: 500 });
    }

    // Now validatedRequestBody is guaranteed to be non-null and correctly typed
    const { analysisId, extractedText, userSelectedState, s3Key, s3Bucket, originalFileName, userId } = validatedRequestBody;

    if (!aiProcessingQueueUrl) { // This check was here, moving it after body validation and destructuring for clarity
        console.error('AI Processing Queue URL is not defined in environment variables.');
        return NextResponse.json({ error: "Server configuration error: Queue URL missing." }, { status: 500 });
    }

    console.log(`Processing request for analysisId: ${analysisId}, userSelectedState: ${userSelectedState}`);
    // Log a snippet of text for verification, not the whole potentially large text
    console.log(`Extracted text length: ${extractedText.length}, S3 Key: ${s3Key}`); 

    // 1. Update DynamoDB status to AI_PROCESSING_QUEUED
    // This update is optimistic. If SQS fails, the status might be misleading.
    // Consider updating status *after* successful SQS send, or have Lambda update it upon receipt.
    // For now, updating before to reflect intent to queue.
    await updateDynamoDBStatus(analysisId, 'AI_PROCESSING_QUEUED');
    console.log(`Status updated to AI_PROCESSING_QUEUED for analysisId: ${analysisId}`);

    // 2. Prepare message for SQS
    const sqsMessagePayload = {
      analysisId,
      extractedText, // Sending full text. Consider if Lambda should fetch from S3 if too large for SQS.
      userSelectedState,
      s3Key, 
      s3Bucket,
      originalFileName,
      userId // Pass userId if available and needed by Lambda
    };

    // 3. Send message to SQS
    const sendMessageCommand = new SendMessageCommand({
      QueueUrl: aiProcessingQueueUrl,
      MessageBody: JSON.stringify(sqsMessagePayload),
      // Standard SQS queues do not use MessageDeduplicationId or MessageGroupId
      // If using FIFO queue, these would be important:
      // MessageDeduplicationId: analysisId, 
      // MessageGroupId: "LeaseAnalysis", 
      MessageAttributes: { // Optional, but can be useful for filtering/routing in SQS or Lambda
        analysisId: { DataType: "String", StringValue: analysisId },
        userId: { DataType: "String", StringValue: userId || "unknown" }
      }
    });

    await sqsClient.send(sendMessageCommand);
    console.log(`Message successfully sent to SQS for analysisId: ${analysisId}`);

    return NextResponse.json({ 
      message: "Lease analysis task accepted and queued.", 
      analysisId: analysisId,
      status: "AI_PROCESSING_QUEUED"
    }, { status: 202 }); // HTTP 202 Accepted indicates the request is accepted for processing

  } catch (error: unknown) {
    console.error('Error in /api/ai/initiate-lease-analysis POST handler:', error);
    let analysisIdFromError: string | undefined;

    // Try to get analysisId from rawRequestBody if available (parsed before potential further errors)
    if (rawRequestBody && typeof rawRequestBody.analysisId === 'string') {
        analysisIdFromError = rawRequestBody.analysisId;
    } else if (validatedRequestBody && validatedRequestBody.analysisId) { // Or from validated body if it was set
        analysisIdFromError = validatedRequestBody.analysisId;
    }else {
        try {
            const errorBody = await clonedRequest.json();
            analysisIdFromError = errorBody.analysisId;
        } catch (parseError) {
            console.warn("Could not parse analysisId from request in error handler:", parseError);
        }
    }
    
    if (analysisIdFromError) {
      try {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error during SQS queuing or processing.';
        await updateDynamoDBStatus(analysisIdFromError, 'AI_PROCESSING_FAILED', undefined, `API Error: ${errorMessage}`);
      } catch (dbError) {
        console.error(`Failed to update DynamoDB status to FAILED for ${analysisIdFromError} after catching error:`, dbError);
      }
    }
    
    const generalErrorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return NextResponse.json({ error: `Internal Server Error: ${generalErrorMessage}` }, { status: 500 });
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: Request) {
  // console.log('API /api/ai/initiate-lease-analysis GET request received - TEST EDIT.'); // Removed test log
  console.log('API /api/ai/initiate-lease-analysis GET request received.');
  // This GET handler is a placeholder. 
  // If it were to return details of an analysis, it might need access to the DynamoDB table
  // and potentially unmarshall results, which might involve the interfaces/schemas defined above.
  // For now, keeping it simple.
  return NextResponse.json({ message: "This endpoint is for initiating lease analysis tasks via POST. Use GET /api/get-analysis-details?id={analysisId} to check status." });
}