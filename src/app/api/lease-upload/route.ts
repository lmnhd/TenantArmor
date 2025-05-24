import { NextResponse } from 'next/server';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { v4 as uuidv4 } from 'uuid'; // For generating unique analysis IDs
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"; // Added S3 client
import { auth } from '@clerk/nextjs/server'; // Add Clerk authentication

// Initialize AWS Clients
const awsRegion = process.env.AWS_REGION || 'us-east-1';
const dynamoDbTableName = process.env.DYNAMODB_LEASE_ANALYSES_TABLE;
const s3LeaseUploadsBucket = process.env.S3_LEASE_UPLOADS_BUCKET;

let ddbClient: DynamoDBClient;
let s3Client: S3Client; // Added S3 client variable

// Configure DynamoDB client (similar to initiate-lease-analysis endpoint)
if (process.env.NODE_ENV === 'development' && process.env.USE_LOCAL_DYNAMODB === 'true') {
  console.log('Using local DynamoDB endpoint for lease-upload');
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
    console.warn('AWS credentials for Next.js app are not set. DynamoDB operations may fail.');
    // Potentially throw an error or handle this case as per your app's requirements
  }
  ddbClient = new DynamoDBClient({
    region: awsRegion,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID_NEXTJS_APP || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_NEXTJS_APP || '',
    },
  });
}

// Configure S3 client
if (process.env.NODE_ENV === 'development' && process.env.USE_LOCAL_S3 === 'true') {
  console.log('Using local S3 endpoint for lease-upload');
  if (!process.env.LOCAL_S3_ENDPOINT) {
    console.warn('LOCAL_S3_ENDPOINT is not set, but USE_LOCAL_S3 is true. S3 operations might fail or use AWS default.');
  }
  s3Client = new S3Client({
    region: awsRegion,
    endpoint: process.env.LOCAL_S3_ENDPOINT, // e.g., 'http://localhost:9000' for MinIO
    forcePathStyle: true, // Required for MinIO and some LocalStack setups
    credentials: {
      accessKeyId: process.env.LOCAL_S3_ACCESS_KEY_ID || 'fakeMyKeyId', // Or your local S3 credentials
      secretAccessKey: process.env.LOCAL_S3_SECRET_ACCESS_KEY || 'fakeSecretAccessKey'
    }
  });
} else {
    // Production S3 client setup
    if (!process.env.AWS_ACCESS_KEY_ID_NEXTJS_APP || !process.env.AWS_SECRET_ACCESS_KEY_NEXTJS_APP) {
        console.warn('AWS credentials for Next.js app are not set. S3 operations may fail.');
    }
    s3Client = new S3Client({
        region: awsRegion,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID_NEXTJS_APP || '',
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_NEXTJS_APP || '',
        },
    });
}


export async function POST(request: Request) {
  try {
    // 1. Authenticate user with Clerk
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in to upload lease documents.' }, { status: 401 });
    }

    if (!dynamoDbTableName) {
      console.error('DYNAMODB_LEASE_ANALYSES_TABLE environment variable is not set.');
      return NextResponse.json({ error: 'Server configuration error: Missing DynamoDB table name' }, { status: 500 });
    }
    if (!s3LeaseUploadsBucket) {
      console.error('S3_LEASE_UPLOADS_BUCKET environment variable is not set.');
      return NextResponse.json({ error: 'Server configuration error: Missing S3 bucket name' }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const userSelectedState = formData.get('userSelectedState') as string | null; // Retrieve if sent

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type and size if necessary (though frontend also does this)
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({ error: 'Invalid file type. Only PDF and image files (JPEG, PNG) are allowed.' }, { status: 400 });
    }
    // Max size: 10MB (example, consistent with frontend)
    if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'File is too large. Max 10MB allowed.' }, { status: 400 });
    }

    const analysisId = uuidv4();
    const originalFileName = file.name;
    const s3Key = `leases/${analysisId}/${originalFileName}`; // Example S3 key structure

    // Convert file to buffer for S3 upload
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Upload to S3
    console.log(`Uploading ${originalFileName} to S3 bucket ${s3LeaseUploadsBucket} with key ${s3Key}`);
    await s3Client.send(
      new PutObjectCommand({
        Bucket: s3LeaseUploadsBucket,
        Key: s3Key,
        Body: fileBuffer,
        ContentType: file.type,
        Metadata: { // Added S3 Object Metadata
          'analysis-id': analysisId, // The UUID generated by this endpoint
          'user-id': userId, // Use the real userId from Clerk
          'user-selected-state': userSelectedState || 'unknown_state', // Pass the state
          'original-filename': originalFileName // Pass the original filename
        }
      })
    );
    console.log('Successfully uploaded file to S3.');

    console.log(`Received file: ${originalFileName}, size: ${file.size}, type: ${file.type}`);
    console.log(`Generated Analysis ID: ${analysisId}`);
    console.log(`Target S3 Bucket: ${s3LeaseUploadsBucket}`);
    console.log(`Target S3 Key: ${s3Key}`);
    if (userSelectedState) {
        console.log(`User selected state: ${userSelectedState}`);
    }


    const itemToStore = {
      analysisId,
      userId: userId, // Use the real userId from Clerk
      fileName: originalFileName,
      fileSizeBytes: file.size,
      fileType: file.type,
      s3Bucket: s3LeaseUploadsBucket,
      s3Key,
      status: 'UPLOAD_COMPLETED_PENDING_PROCESSING', // Initial status
      uploadTimestamp: new Date().toISOString(),
      lastUpdatedTimestamp: new Date().toISOString(),
      ...(userSelectedState && { userSelectedState }), // Add if provided
      // TODO: Add any other initial metadata, like versioning, tags, etc.
    };

    await ddbClient.send(new PutItemCommand({
      TableName: dynamoDbTableName,
      Item: marshall(itemToStore, { removeUndefinedValues: true }),
    }));

    console.log('Successfully stored initial analysis metadata in DynamoDB:', analysisId);

    // The Lambda function (aws/lib/lambda/pdf-processor.ts) will be triggered by S3 event
    // or another mechanism. It will then call /api/ai/initiate-lease-analysis
    // with the analysisId, s3Bucket, s3Key, and extractedText.

    return NextResponse.json({ 
      message: 'File uploaded successfully. Analysis initiated.', 
      analysisId: analysisId,
      fileName: originalFileName,
      s3Key: s3Key 
    }, { status: 201 }); // 201 Created

  } catch (error) {
    console.error('Error in lease-upload POST handler:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown server error during upload processing.';
    // Check for specific error types if needed, e.g., from S3 or DDB
    return NextResponse.json({ error: 'Failed to process file upload', details: errorMsg }, { status: 500 });
  }
}

// Optional: Add a GET handler for testing or checking endpoint status
export async function GET() {
  return NextResponse.json({ message: 'This is the lease upload endpoint. Use POST to upload files.' }, { status: 200 });
} 