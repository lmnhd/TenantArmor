import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

// Initialize AWS DynamoDB Client
const awsRegion = process.env.AWS_REGION || 'us-east-1';
const dynamoDbTableName = process.env.DYNAMODB_LEASE_ANALYSES_TABLE;

let ddbClient: DynamoDBClient;

if (process.env.NODE_ENV === 'development' && process.env.USE_LOCAL_DYNAMODB === 'true') {
  console.log('Using local DynamoDB endpoint for user lease analyses');
  ddbClient = new DynamoDBClient({
    region: awsRegion,
    endpoint: process.env.LOCAL_DYNAMODB_ENDPOINT || 'http://localhost:8000',
    credentials: {
      accessKeyId: 'fakeMyKeyId',
      secretAccessKey: 'fakeSecretAccessKey'
    }
  });
} else {
  console.log('Initializing DynamoDB client for production (user lease analyses)');
  ddbClient = new DynamoDBClient({
    region: awsRegion,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID_NEXTJS_APP || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_NEXTJS_APP || '',
    }
  });
}

export async function GET() {
  try {
    // Authenticate user with Clerk
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in to view lease analyses.' }, { status: 401 });
    }

    if (!dynamoDbTableName) {
      console.error('DYNAMODB_LEASE_ANALYSES_TABLE environment variable is not set.');
      return NextResponse.json({ error: 'Server configuration error: Missing DynamoDB table name' }, { status: 500 });
    }

    console.log(`Fetching lease analyses for user: ${userId}`);

    // Query DynamoDB for user's lease analyses
    // Note: This assumes there's a GSI on userId for efficient querying
    const queryCommand = new QueryCommand({
      TableName: dynamoDbTableName,
      IndexName: 'userId-uploadTimestamp-index', // GSI for querying by userId
      KeyConditionExpression: 'userId = :userId',
      FilterExpression: 'documentType = :docType AND (#status = :completedStatus OR #status = :partialStatus)',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':userId': { S: userId },
        ':docType': { S: 'LEASE' },
        ':completedStatus': { S: 'ANALYSIS_COMPLETE' },
        ':partialStatus': { S: 'PARTIAL_ANALYSIS_INSIGHTS_FAILED' }
      },
      ScanIndexForward: false, // Most recent first
      Limit: 10 // Limit to last 10 analyses
    });

    const result = await ddbClient.send(queryCommand);
    
    const analyses = result.Items?.map(item => {
      const unmarshalled = unmarshall(item);
      
      // Extract relevant data for the frontend
      return {
        analysisId: unmarshalled.analysisId,
        fileName: unmarshalled.originalFileName || unmarshalled.s3Key?.split('/').pop() || 'Unknown File',
        uploadTimestamp: unmarshalled.uploadTimestamp,
        status: unmarshalled.status,
        overallSeverity: unmarshalled.analysisResults?.overallSeverity,
        summary: unmarshalled.analysisResults?.summary
      };
    }) || [];

    console.log(`Found ${analyses.length} lease analyses for user ${userId}`);

    return NextResponse.json({ 
      analyses,
      count: analyses.length 
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching user lease analyses:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ 
      error: 'Failed to fetch lease analyses', 
      details: errorMessage 
    }, { status: 500 });
  }
} 