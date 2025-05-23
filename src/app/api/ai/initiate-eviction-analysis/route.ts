import { NextResponse } from 'next/server';
import { DynamoDBClient, UpdateItemCommand, AttributeValue } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { auth } from '@clerk/nextjs/server';

// Initialize AWS Clients
const awsRegion = process.env.AWS_REGION || 'us-east-1';
const dynamoDbTableName = process.env.DYNAMODB_LEASE_ANALYSES_TABLE; // Reusing same table
const aiProcessingQueueUrl = process.env.AI_PROCESSING_QUEUE_URL; // Reusing same queue

let ddbClient: DynamoDBClient;
let sqsClient: SQSClient;

if (process.env.NODE_ENV === 'development' && process.env.USE_LOCAL_DYNAMODB === 'true') {
  console.log('Using local DynamoDB endpoint for eviction analysis');
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
  }
}

export async function POST(request: Request) {
  console.log('API /api/ai/initiate-eviction-analysis POST request received.');

  // Authenticate user with Clerk
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in to analyze eviction notices.' }, { status: 401 });
    }
  } catch (authError) {
    console.error('Authentication error:', authError);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }

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
    isImageUpload?: boolean;
    userFormData?: Record<string, any>;
  } | null = null;
  const clonedRequest = request.clone();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rawRequestBody: any;

  try {
    rawRequestBody = await request.json();

    // Validate the structure of the request body for eviction analysis
    if (rawRequestBody && 
        typeof rawRequestBody.analysisId === 'string' && 
        typeof rawRequestBody.extractedText === 'string' && 
        typeof rawRequestBody.userSelectedState === 'string') {
      validatedRequestBody = rawRequestBody;
    } else {
      console.warn('Missing or invalid required fields in eviction analysis request body:', rawRequestBody);
      const potentialAnalysisId = rawRequestBody?.analysisId;
      if (typeof potentialAnalysisId === 'string' && potentialAnalysisId) {
        try {
            await updateDynamoDBStatus(potentialAnalysisId, 'AI_PROCESSING_FAILED', undefined, `API Error: Invalid request body structure. Required: analysisId, extractedText, userSelectedState.`);
        } catch (dbError) { 
            console.error('Failed to update DB for malformed eviction analysis request with potential analysisId', dbError); 
        }
      }
      return NextResponse.json({ error: 'Invalid request body. Required fields: analysisId (string), extractedText (string), userSelectedState (string).' }, { status: 400 });
    }

    if (!validatedRequestBody) {
      console.error("validatedRequestBody is null before destructuring. This indicates an unexpected internal state.");
      const potentialAnalysisId = rawRequestBody?.analysisId;
      if (typeof potentialAnalysisId === 'string' && potentialAnalysisId) {
        try {
            await updateDynamoDBStatus(potentialAnalysisId, 'AI_PROCESSING_FAILED', undefined, `API Error: Internal server error, request body unexpectedly null after validation.`);
        } catch (dbError) { 
            console.error('Failed to update DB for unexpected null body with potential analysisId', dbError); 
        }
      }
      return NextResponse.json({ error: 'Internal server error processing request body after validation.' }, { status: 500 });
    }

    const { 
      analysisId, 
      extractedText, 
      userSelectedState, 
      s3Key, 
      s3Bucket, 
      originalFileName, 
      userId: requestUserId,
      isImageUpload,
      userFormData
    } = validatedRequestBody;

    if (!aiProcessingQueueUrl) {
        console.error('AI Processing Queue URL is not defined in environment variables.');
        return NextResponse.json({ error: "Server configuration error: Queue URL missing." }, { status: 500 });
    }

    console.log(`Processing eviction analysis request for analysisId: ${analysisId}, userSelectedState: ${userSelectedState}`);
    console.log(`Extracted text length: ${extractedText.length}, S3 Key: ${s3Key}, isImageUpload: ${isImageUpload}`);
    console.log(`User form data provided: ${userFormData ? Object.keys(userFormData).join(', ') : 'none'}`);

    // Update DynamoDB status to AI_PROCESSING_QUEUED
    await updateDynamoDBStatus(analysisId, 'AI_PROCESSING_QUEUED');
    console.log(`Status updated to AI_PROCESSING_QUEUED for eviction analysisId: ${analysisId}`);

    // Prepare message for SQS with eviction-specific fields
    const sqsMessagePayload = {
      analysisId,
      extractedText,
      userSelectedState,
      s3Key, 
      s3Bucket,
      originalFileName,
      userId: requestUserId,
      documentType: 'EVICTION_NOTICE', // Key field to route to eviction processing
      isImageUpload: isImageUpload || false,
      userFormData: userFormData || {}
    };

    // Send message to SQS
    const sendMessageCommand = new SendMessageCommand({
      QueueUrl: aiProcessingQueueUrl,
      MessageBody: JSON.stringify(sqsMessagePayload),
      MessageAttributes: {
        analysisId: { DataType: "String", StringValue: analysisId },
        userId: { DataType: "String", StringValue: requestUserId || "unknown" },
        documentType: { DataType: "String", StringValue: "EVICTION_NOTICE" }
      }
    });

    await sqsClient.send(sendMessageCommand);
    console.log(`Eviction analysis message successfully sent to SQS for analysisId: ${analysisId}`);

    return NextResponse.json({ 
      message: "Eviction notice analysis task accepted and queued.", 
      analysisId: analysisId,
      documentType: "EVICTION_NOTICE",
      status: "AI_PROCESSING_QUEUED"
    }, { status: 202 });

  } catch (error: unknown) {
    console.error('Error in /api/ai/initiate-eviction-analysis POST handler:', error);
    let analysisIdFromError: string | undefined;

    if (rawRequestBody && typeof rawRequestBody.analysisId === 'string') {
        analysisIdFromError = rawRequestBody.analysisId;
    } else if (validatedRequestBody && validatedRequestBody.analysisId) {
        analysisIdFromError = validatedRequestBody.analysisId;
    } else {
        try {
            const errorBody = await clonedRequest.json();
            analysisIdFromError = errorBody.analysisId;
        } catch (parseError) {
            console.warn("Could not parse analysisId from request in error handler:", parseError);
        }
    }
    
    if (analysisIdFromError) {
      try {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error during eviction analysis SQS queuing or processing.';
        await updateDynamoDBStatus(analysisIdFromError, 'AI_PROCESSING_FAILED', undefined, `API Error: ${errorMessage}`);
      } catch (dbError) {
        console.error(`Failed to update DynamoDB status to FAILED for ${analysisIdFromError} after catching error:`, dbError);
      }
    }
    
    const generalErrorMessage = error instanceof Error ? error.message : 'An unexpected error occurred during eviction analysis processing.';
    return NextResponse.json({ error: `Internal Server Error: ${generalErrorMessage}` }, { status: 500 });
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: Request) {
  console.log('API /api/ai/initiate-eviction-analysis GET request received.');
  return NextResponse.json({ 
    message: "This endpoint is for initiating eviction notice analysis tasks via POST. Use GET /api/get-analysis-details?id={analysisId} to check status." 
  });
} 