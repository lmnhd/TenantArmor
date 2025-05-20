import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient, ReturnValue } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

// Initialize AWS SDK clients
// Credentials and region should be picked up from environment variables
// (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION)
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});
const docClient = DynamoDBDocumentClient.from(client);

const LEASE_ANALYSES_TABLE_NAME = process.env.LEASE_ANALYSES_TABLE_NAME;

interface LambdaPayload {
  analysisId: string;
  s3Bucket: string;
  s3Key: string;
  extractedText?: string; // Assuming Lambda might send this
  // Add any other fields the Lambda will send
}

export async function POST(request: NextRequest) {
  if (!LEASE_ANALYSES_TABLE_NAME) {
    return NextResponse.json(
      { error: 'DynamoDB table name is not configured.' },
      { status: 500 }
    );
  }
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    return NextResponse.json(
      { error: 'AWS credentials are not configured.' },
      { status: 500 }
    );
  }

  try {
    const payload = (await request.json()) as LambdaPayload;
    const { analysisId, s3Bucket, s3Key, extractedText } = payload;

    if (!analysisId || !s3Bucket || !s3Key) {
      return NextResponse.json(
        { error: 'analysisId, s3Bucket, and s3Key are required from Lambda.' },
        { status: 400 }
      );
    }

    console.log(`Received request to initiate analysis for ID: ${analysisId}`);
    console.log(`S3 Bucket: ${s3Bucket}, S3 Key: ${s3Key}`);
    // console.log(`Extracted Text (first 100 chars): ${extractedText?.substring(0, 100)}`);

    // 1. Placeholder for more advanced AI processing using 'extractedText'
    //    For example, call OpenAI, Anthropic, or another model here.
    //    Let's assume this step produces some 'aiAnalysisResults'.
    const aiProcessingTimestamp = new Date().toISOString();
    const aiAnalysisResults = {
      summary: "This is a placeholder AI summary.",
      clauses: [{ name: "Rent Clause", details: "Rent is $1000/month." }],
      // ... more structured data
    };
    const newStatus = 'AI_ANALYSIS_COMPLETE';

    // 2. Update DynamoDB
    const updateParams = {
      TableName: LEASE_ANALYSES_TABLE_NAME,
      Key: {
        analysisId: analysisId, // Make sure this matches your table's partition key name
      },
      UpdateExpression: 
        'SET #status = :status, #aiAnalysis = :aiAnalysis, #aiProcessingTimestamp = :aiProcessingTimestamp, #extractedText = :extractedText',
      ExpressionAttributeNames: {
        '#status': 'status',
        '#aiAnalysis': 'aiAnalysis',
        '#aiProcessingTimestamp': 'aiProcessingTimestamp',
        '#extractedText': 'extractedText', // Add if not already set by Lambda, or to ensure it's there
      },
      ExpressionAttributeValues: {
        ':status': newStatus,
        ':aiAnalysis': aiAnalysisResults,
        ':aiProcessingTimestamp': aiProcessingTimestamp,
        ':extractedText': extractedText || "No text provided by Lambda", // Store extracted text
      },
      ReturnValues: ReturnValue.UPDATED_NEW,
    };

    await docClient.send(new UpdateCommand(updateParams));

    console.log(`Successfully updated DynamoDB for analysisId: ${analysisId}`);

    return NextResponse.json({
      message: 'AI analysis initiated and DynamoDB updated.',
      analysisId: analysisId,
      newStatus: newStatus,
    });

  } catch (error) {
    console.error('Error processing initiate-lease-analysis request:', error);
    let errorMessage = 'Failed to process request.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json(
      { error: 'Failed to process AI analysis initiation.', details: errorMessage },
      { status: 500 }
    );
  }
}
