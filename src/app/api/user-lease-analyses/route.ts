import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

// Initialize AWS DynamoDB Client
const awsRegion = process.env.AWS_REGION || 'us-east-1';
const dynamoDbTableName = process.env.DYNAMODB_LEASE_ANALYSES_TABLE;

interface AnalysisItem {
  analysisId: string;
  fileName: string;
  uploadTimestamp: string;
  lastUpdatedTimestamp: string;
  status: string;
  overallSeverity?: string;
  summary?: string;
  userSelectedState: string;
  fileType: string;
  fileSizeBytes: number;
}

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

    let result;
    let analyses: AnalysisItem[] = [];

    // TODO: Add GSI 'userId-uploadTimestamp-index' to DynamoDB table for better performance
    // Currently using scan operation because the required GSI doesn't exist on the table.
    // GSI should have: Partition key: userId (String), Sort key: uploadTimestamp (String)
    // Once GSI is added, replace scan with QueryCommand using the GSI for more efficient queries.
    
    // Skip GSI query since the index doesn't exist, go straight to scan
    console.log('Using scan operation (GSI not available)');
    const scanCommand = new ScanCommand({
      TableName: dynamoDbTableName,
      FilterExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': { S: userId }
      },
      Limit: 20
    });

    console.log('Executing DynamoDB scan for user:', userId);
    result = await ddbClient.send(scanCommand);
    console.log(`DynamoDB scan returned ${result.Items?.length || 0} items`);

    if (result?.Items) {
      analyses = result.Items.map(item => {
        const unmarshalled = unmarshall(item);
        
        // Extract relevant data for the frontend
        return {
          analysisId: unmarshalled.analysisId,
          fileName: unmarshalled.fileName || unmarshalled.originalFileName || unmarshalled.s3Key?.split('/').pop() || 'Unknown File',
          uploadTimestamp: unmarshalled.uploadTimestamp,
          lastUpdatedTimestamp: unmarshalled.lastUpdatedTimestamp,
          status: unmarshalled.status,
          overallSeverity: unmarshalled.analysisResults?.overallSeverity,
          summary: unmarshalled.analysisResults?.summary,
          userSelectedState: unmarshalled.userSelectedState,
          fileType: unmarshalled.fileType,
          fileSizeBytes: unmarshalled.fileSizeBytes
        };
      });

      // Sort by upload timestamp (most recent first)
      analyses.sort((a, b) => new Date(b.uploadTimestamp).getTime() - new Date(a.uploadTimestamp).getTime());
    }

    console.log(`Successfully processed ${analyses.length} lease analyses for user ${userId}`);

    return NextResponse.json({ 
      analyses,
      count: analyses.length 
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching user lease analyses:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json({ 
      error: 'Failed to fetch lease analyses', 
      details: errorMessage 
    }, { status: 500 });
  }
}