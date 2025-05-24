import { NextResponse } from 'next/server';
import { DynamoDBClient, ScanCommand, DeleteItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

// Initialize AWS DynamoDB Client
const awsRegion = process.env.AWS_REGION || 'us-east-1';
const dynamoDbTableName = process.env.DYNAMODB_LEASE_ANALYSES_TABLE;

let ddbClient: DynamoDBClient;

if (process.env.NODE_ENV === 'development' && process.env.USE_LOCAL_DYNAMODB === 'true') {
  console.log('Using local DynamoDB endpoint for cleanup');
  ddbClient = new DynamoDBClient({
    region: awsRegion,
    endpoint: process.env.LOCAL_DYNAMODB_ENDPOINT || 'http://localhost:8000',
    credentials: {
      accessKeyId: 'fakeMyKeyId',
      secretAccessKey: 'fakeSecretAccessKey'
    }
  });
} else {
  console.log('Initializing DynamoDB client for production cleanup');
  ddbClient = new DynamoDBClient({
    region: awsRegion,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID_NEXTJS_APP || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_NEXTJS_APP || '',
    }
  });
}

export async function POST(request: Request) {
  try {
    // Basic security check - only allow in development or with admin key
    const { searchParams } = new URL(request.url);
    const adminKey = searchParams.get('adminKey');
    
    if (process.env.NODE_ENV === 'production' && adminKey !== process.env.ADMIN_CLEANUP_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!dynamoDbTableName) {
      return NextResponse.json({ error: 'Server configuration error: Missing DynamoDB table name' }, { status: 500 });
    }

    const body = await request.json();
    const { dryRun = true } = body;

    console.log(`Starting cleanup of analyses without userIDs (dryRun: ${dryRun})`);

    // Scan for items without userId
    const scanCommand = new ScanCommand({
      TableName: dynamoDbTableName,
      FilterExpression: 'attribute_not_exists(userId) OR userId = :emptyUserId',
      ExpressionAttributeValues: {
        ':emptyUserId': { S: '' }
      }
    });

    const result = await ddbClient.send(scanCommand);
    const itemsToCleanup = result.Items || [];

    console.log(`Found ${itemsToCleanup.length} items without userIDs`);

    if (dryRun) {
      const itemsSummary = itemsToCleanup.map(item => {
        const unmarshalled = unmarshall(item);
        return {
          analysisId: unmarshalled.analysisId,
          fileName: unmarshalled.fileName || unmarshalled.originalFileName || 'Unknown',
          uploadTimestamp: unmarshalled.uploadTimestamp,
          status: unmarshalled.status
        };
      });

      return NextResponse.json({
        message: 'Dry run completed',
        itemsFound: itemsToCleanup.length,
        items: itemsSummary
      });
    }

    // Actually delete the items
    let deletedCount = 0;
    const errors = [];

    for (const item of itemsToCleanup) {
      try {
        const unmarshalled = unmarshall(item);
        
        const deleteCommand = new DeleteItemCommand({
          TableName: dynamoDbTableName,
          Key: {
            analysisId: { S: unmarshalled.analysisId }
          }
        });

        await ddbClient.send(deleteCommand);
        deletedCount++;
        console.log(`Deleted analysis: ${unmarshalled.analysisId}`);
      } catch (deleteError) {
        console.error(`Error deleting analysis:`, deleteError);
        errors.push({
          analysisId: unmarshall(item).analysisId,
          error: deleteError instanceof Error ? deleteError.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      message: 'Cleanup completed',
      itemsFound: itemsToCleanup.length,
      deletedCount,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error during cleanup:', error);
    return NextResponse.json({ 
      error: 'Cleanup failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Cleanup endpoint. Use POST with { "dryRun": true } to preview items to cleanup, or { "dryRun": false } to actually delete them.',
    note: 'In production, requires adminKey query parameter.'
  });
} 