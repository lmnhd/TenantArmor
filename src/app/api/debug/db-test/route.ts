import { NextResponse } from 'next/server';
import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';

// Initialize AWS DynamoDB Client
const awsRegion = process.env.AWS_REGION || 'us-east-1';
const dynamoDbTableName = process.env.DYNAMODB_LEASE_ANALYSES_TABLE;

let ddbClient: DynamoDBClient;

if (process.env.NODE_ENV === 'development' && process.env.USE_LOCAL_DYNAMODB === 'true') {
  console.log('Using local DynamoDB endpoint for debug test');
  ddbClient = new DynamoDBClient({
    region: awsRegion,
    endpoint: process.env.LOCAL_DYNAMODB_ENDPOINT || 'http://localhost:8000',
    credentials: {
      accessKeyId: 'fakeMyKeyId',
      secretAccessKey: 'fakeSecretAccessKey'
    }
  });
} else {
  console.log('Initializing DynamoDB client for production debug test');
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
    console.log('=== DB Debug Test ===');
    console.log('Environment variables:');
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    console.log('- USE_LOCAL_DYNAMODB:', process.env.USE_LOCAL_DYNAMODB);
    console.log('- AWS_REGION:', process.env.AWS_REGION);
    console.log('- DYNAMODB_LEASE_ANALYSES_TABLE:', process.env.DYNAMODB_LEASE_ANALYSES_TABLE);
    console.log('- LOCAL_DYNAMODB_ENDPOINT:', process.env.LOCAL_DYNAMODB_ENDPOINT);
    console.log('- AWS_ACCESS_KEY_ID_NEXTJS_APP exists:', !!process.env.AWS_ACCESS_KEY_ID_NEXTJS_APP);
    console.log('- AWS_SECRET_ACCESS_KEY_NEXTJS_APP exists:', !!process.env.AWS_SECRET_ACCESS_KEY_NEXTJS_APP);

    if (!dynamoDbTableName) {
      return NextResponse.json({ 
        error: 'DYNAMODB_LEASE_ANALYSES_TABLE environment variable is not set',
        envVars: {
          NODE_ENV: process.env.NODE_ENV,
          USE_LOCAL_DYNAMODB: process.env.USE_LOCAL_DYNAMODB,
          AWS_REGION: process.env.AWS_REGION,
          TABLE_NAME: dynamoDbTableName
        }
      }, { status: 500 });
    }

    // Try to describe the table to test connectivity
    const describeCommand = new DescribeTableCommand({
      TableName: dynamoDbTableName
    });

    console.log('Attempting to describe table:', dynamoDbTableName);
    const result = await ddbClient.send(describeCommand);
    
    console.log('Table description successful. Table status:', result.Table?.TableStatus);
    
    // Check for the required GSI
    const gsiName = 'userId-uploadTimestamp-index';
    const gsi = result.Table?.GlobalSecondaryIndexes?.find(index => index.IndexName === gsiName);
    
    console.log('Available GSIs:', result.Table?.GlobalSecondaryIndexes?.map(i => i.IndexName));
    console.log(`Required GSI '${gsiName}' exists:`, !!gsi);

    return NextResponse.json({
      message: 'Database connection successful',
      tableName: dynamoDbTableName,
      tableStatus: result.Table?.TableStatus,
      environment: process.env.NODE_ENV,
      usingLocalDynamoDB: process.env.USE_LOCAL_DYNAMODB === 'true',
      globalSecondaryIndexes: result.Table?.GlobalSecondaryIndexes?.map(index => ({
        name: index.IndexName,
        status: index.IndexStatus,
        keys: index.KeySchema
      })),
      requiredGSIExists: !!gsi,
      requiredGSIName: gsiName
    });

  } catch (error) {
    console.error('Database test error:', error);
    
    return NextResponse.json({
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      tableName: dynamoDbTableName,
      environment: process.env.NODE_ENV,
      usingLocalDynamoDB: process.env.USE_LOCAL_DYNAMODB === 'true'
    }, { status: 500 });
  }
} 