import { NextResponse } from 'next/server';
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

const awsRegion = process.env.AWS_REGION || 'us-east-1';
const dynamoDbTableName = process.env.DYNAMODB_LEASE_ANALYSES_TABLE;

let ddbClient: DynamoDBClient;
// Configure DynamoDB client (similar to other API routes)
if (process.env.NODE_ENV === 'development' && process.env.USE_LOCAL_DYNAMODB === 'true') {
  console.log('(API GetDetails) Using local DynamoDB endpoint');
  ddbClient = new DynamoDBClient({
    region: awsRegion,
    endpoint: process.env.LOCAL_DYNAMODB_ENDPOINT || 'http://localhost:8000',
    credentials: {
      accessKeyId: 'fakeMyKeyId',
      secretAccessKey: 'fakeSecretAccessKey'
    }
  });
} else {
  if (!process.env.AWS_ACCESS_KEY_ID_NEXTJS_APP || !process.env.AWS_SECRET_ACCESS_KEY_NEXTJS_APP) {
    console.warn('(API GetDetails) AWS credentials for Next.js app are not set. DynamoDB operations may fail.');
  }
  ddbClient = new DynamoDBClient({
    region: awsRegion,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID_NEXTJS_APP || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_NEXTJS_APP || '',
    },
  });
}

export async function GET(request: Request) {
  console.log('(API GetDetails) Get Analysis Details API route hit');
  try {
    if (!dynamoDbTableName) {
      console.error('(API GetDetails) DYNAMODB_LEASE_ANALYSES_TABLE environment variable is not set.');
      return NextResponse.json({ error: 'Server configuration error: Missing DynamoDB table name' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const analysisId = searchParams.get('id');

    if (!analysisId) {
      console.warn('(API GetDetails) Missing analysisId query parameter.');
      return NextResponse.json({ error: 'Missing analysisId query parameter' }, { status: 400 });
    }

    console.log(`(API GetDetails) Fetching details for analysisId: ${analysisId}`);

    const params = {
      TableName: dynamoDbTableName,
      Key: { analysisId: { S: analysisId } }, // analysisId is a string (S)
    };

    const { Item } = await ddbClient.send(new GetItemCommand(params));

    if (!Item) {
      console.warn(`(API GetDetails) No analysis found with id: ${analysisId}`);
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    const analysisDetails = unmarshall(Item);
    console.log(`(API GetDetails) Successfully fetched details for analysisId: ${analysisId}`);
    
    return NextResponse.json(analysisDetails, { status: 200 });

  } catch (error) {
    console.error('(API GetDetails) Error fetching analysis details:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown server error.';
    return NextResponse.json({ error: 'Failed to fetch analysis details', details: errorMsg }, { status: 500 });
  }
} 