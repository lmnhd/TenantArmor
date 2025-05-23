import { NextResponse } from 'next/server';
import {
    DynamoDBClient,
    GetItemCommand,
} from '@aws-sdk/client-dynamodb';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { unmarshall } from '@aws-sdk/util-dynamodb';

const awsRegion = process.env.AWS_REGION || 'us-east-1';
const dynamoDbTableName = process.env.DYNAMODB_LEASE_ANALYSES_TABLE;

let ddbClient: DynamoDBClient;
let s3Client: S3Client;

if (process.env.NODE_ENV === 'development' && process.env.USE_LOCAL_DYNAMODB === 'true') {
    console.log('(API GetDownloadUrl) Using local DynamoDB & S3 endpoints');
    ddbClient = new DynamoDBClient({
        region: awsRegion,
        endpoint: process.env.LOCAL_DYNAMODB_ENDPOINT || 'http://localhost:8000',
        credentials: {
            accessKeyId: 'fakeMyKeyId',
            secretAccessKey: 'fakeSecretAccessKey'
        }
    });
    s3Client = new S3Client({
        region: awsRegion,
        endpoint: process.env.LOCAL_S3_ENDPOINT || 'http://localhost:9000', // Assuming local S3 runs on 9000 for MinIO/LocalStack
        forcePathStyle: true, // Required for LocalStack/MinIO
        credentials: {
            accessKeyId: 'fakeMyKeyId', // Or your LocalStack/MinIO specific keys
            secretAccessKey: 'fakeSecretAccessKey'
        }
    });
} else {
    if (!process.env.AWS_ACCESS_KEY_ID_NEXTJS_APP || !process.env.AWS_SECRET_ACCESS_KEY_NEXTJS_APP) {
        console.warn('(API GetDownloadUrl) AWS credentials for Next.js app are not set. Operations may fail.');
    }
    ddbClient = new DynamoDBClient({
        region: awsRegion,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID_NEXTJS_APP || '',
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_NEXTJS_APP || '',
        },
    });
    s3Client = new S3Client({
        region: awsRegion,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID_NEXTJS_APP || '', // Use the same credentials as DDB for S3
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_NEXTJS_APP || '',
        },
    });
}

export async function GET(request: Request) {
    console.log('(API GetDownloadUrl) Get Download URL API route hit');
    try {
        if (!dynamoDbTableName) {
            console.error('(API GetDownloadUrl) DYNAMODB_LEASE_ANALYSES_TABLE env var not set.');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const { searchParams } = new URL(request.url);
        const analysisId = searchParams.get('id');

        if (!analysisId) {
            console.warn('(API GetDownloadUrl) Missing analysisId query parameter.');
            return NextResponse.json({ error: 'Missing analysisId query parameter' }, { status: 400 });
        }

        console.log(`(API GetDownloadUrl) Fetching S3 details for analysisId: ${analysisId}`);

        const getItemParams = {
            TableName: dynamoDbTableName,
            Key: { analysisId: { S: analysisId } },
        };

        const { Item } = await ddbClient.send(new GetItemCommand(getItemParams));

        if (!Item) {
            console.warn(`(API GetDownloadUrl) No analysis found with id: ${analysisId}`);
            return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
        }

        const analysisDetails = unmarshall(Item);

        if (!analysisDetails.s3Bucket || !analysisDetails.s3Key) {
            console.error(`(API GetDownloadUrl) S3 bucket or key not found for analysisId: ${analysisId}`, analysisDetails);
            return NextResponse.json({ error: 'S3 information missing for this analysis' }, { status: 500 });
        }

        const s3Params = {
            Bucket: analysisDetails.s3Bucket,
            Key: analysisDetails.s3Key,
            // ResponseContentDisposition: `attachment; filename="${analysisDetails.fileName || 'lease-document.pdf'}"` // Optional: suggests filename to browser
        };

        const command = new GetObjectCommand(s3Params);
        // Generate a pre-signed URL valid for 1 hour (3600 seconds)
        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

        console.log(`(API GetDownloadUrl) Successfully generated pre-signed URL for analysisId: ${analysisId}`);
        return NextResponse.json({ downloadUrl: signedUrl, fileName: analysisDetails.fileName }, { status: 200 });

    } catch (error) {
        console.error('(API GetDownloadUrl) Error generating download URL:', error);
        const errorMsg = error instanceof Error ? error.message : 'Unknown server error.';
        return NextResponse.json({ error: 'Failed to generate download URL', details: errorMsg }, { status: 500 });
    }
} 