import { NextResponse } from 'next/server';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { auth } from '@clerk/nextjs/server';

// Initialize AWS Clients
const awsRegion = process.env.AWS_REGION || 'us-east-1';
const dynamoDbTableName = process.env.DYNAMODB_LEASE_ANALYSES_TABLE; // Reusing same table
const s3LeaseUploadsBucket = process.env.S3_LEASE_UPLOADS_BUCKET; // Reusing same bucket

let ddbClient: DynamoDBClient;
let s3Client: S3Client;

// Configure DynamoDB client
if (process.env.NODE_ENV === 'development' && process.env.USE_LOCAL_DYNAMODB === 'true') {
  console.log('Using local DynamoDB endpoint for eviction-upload');
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
  console.log('Using local S3 endpoint for eviction-upload');
  s3Client = new S3Client({
    region: awsRegion,
    endpoint: process.env.LOCAL_S3_ENDPOINT,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.LOCAL_S3_ACCESS_KEY_ID || 'fakeMyKeyId',
      secretAccessKey: process.env.LOCAL_S3_SECRET_ACCESS_KEY || 'fakeSecretAccessKey'
    }
  });
} else {
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
    // Authenticate user with Clerk
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in to upload eviction notices.' }, { status: 401 });
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
    const userSelectedState = formData.get('userSelectedState') as string | null;
    
    // Extract optional user form data for eviction processing
    const tenantName = formData.get('tenantName') as string | null;
    const landlordName = formData.get('landlordName') as string | null;
    const noticeDate = formData.get('noticeDate') as string | null;
    const deadlineDate = formData.get('deadlineDate') as string | null;
    const county = formData.get('county') as string | null;
    const evictionReason = formData.get('evictionReason') as string | null;
    const rentAmountDue = formData.get('rentAmountDue') as string | null;
    const paymentDate = formData.get('paymentDate') as string | null;
    const paymentMethod = formData.get('paymentMethod') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type - support both PDFs and images for eviction notices
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const isImageUpload = allowedImageTypes.includes(file.type);
    const isPdfUpload = file.type === 'application/pdf';

    if (!isImageUpload && !isPdfUpload) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only PDF files and images (JPEG, PNG, WebP) are allowed for eviction notices.' 
      }, { status: 400 });
    }

    // File size validation - more generous for images
    const maxSize = isImageUpload ? 15 * 1024 * 1024 : 10 * 1024 * 1024; // 15MB for images, 10MB for PDFs
    if (file.size > maxSize) {
      const maxSizeMB = isImageUpload ? '15MB' : '10MB';
      return NextResponse.json({ 
        error: `File is too large. Maximum ${maxSizeMB} allowed for ${isImageUpload ? 'images' : 'PDFs'}.` 
      }, { status: 400 });
    }

    const analysisId = uuidv4();
    const originalFileName = file.name;
    const s3Key = `eviction-notices/${analysisId}/${originalFileName}`; // Different S3 path for evictions

    // Convert file to buffer for S3 upload
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Upload to S3 with eviction-specific metadata
    console.log(`Uploading eviction notice ${originalFileName} to S3 bucket ${s3LeaseUploadsBucket} with key ${s3Key}`);
    await s3Client.send(
      new PutObjectCommand({
        Bucket: s3LeaseUploadsBucket,
        Key: s3Key,
        Body: fileBuffer,
        ContentType: file.type,
        Metadata: {
          'analysis-id': analysisId,
          'user-id': userId,
          'document-type': 'EVICTION_NOTICE',
          'is-image-upload': isImageUpload.toString(),
          'user-selected-state': userSelectedState || 'unknown_state',
          'original-filename': originalFileName,
          ...(tenantName && { 'tenant-name': tenantName }),
          ...(landlordName && { 'landlord-name': landlordName }),
          ...(county && { 'county': county }),
          ...(evictionReason && { 'eviction-reason': evictionReason })
        }
      })
    );
    console.log('Successfully uploaded eviction notice to S3.');

    console.log(`Received eviction notice: ${originalFileName}, size: ${file.size}, type: ${file.type}, isImage: ${isImageUpload}`);
    console.log(`Generated Analysis ID: ${analysisId}`);
    console.log(`User ID: ${userId}`);
    if (userSelectedState) {
      console.log(`User selected state: ${userSelectedState}`);
    }

    // Prepare user form data for Lambda processing
    const userFormData = {
      tenantName,
      landlordName,
      noticeDate,
      deadlineDate,
      state: userSelectedState,
      county,
      evictionReason,
      rentAmountDue,
      paymentDate,
      paymentMethod
    };

    // Remove undefined values
    const cleanedUserFormData = Object.fromEntries(
      Object.entries(userFormData).filter(([_, value]) => value !== null && value !== undefined && value !== '')
    );

    const itemToStore = {
      analysisId,
      userId,
      fileName: originalFileName,
      fileSizeBytes: file.size,
      fileType: file.type,
      documentType: 'EVICTION_NOTICE', // Mark as eviction notice
      isImageUpload,
      s3Bucket: s3LeaseUploadsBucket,
      s3Key,
      status: 'UPLOAD_COMPLETED_PENDING_PROCESSING',
      uploadTimestamp: new Date().toISOString(),
      lastUpdatedTimestamp: new Date().toISOString(),
      ...(userSelectedState && { userSelectedState }),
      ...(Object.keys(cleanedUserFormData).length > 0 && { userFormData: cleanedUserFormData }),
    };

    await ddbClient.send(new PutItemCommand({
      TableName: dynamoDbTableName,
      Item: marshall(itemToStore, { removeUndefinedValues: true }),
    }));

    console.log('Successfully stored initial eviction analysis metadata in DynamoDB:', analysisId);

    return NextResponse.json({ 
      message: 'Eviction notice uploaded successfully. Analysis will be initiated.', 
      analysisId: analysisId,
      fileName: originalFileName,
      s3Key: s3Key,
      documentType: 'EVICTION_NOTICE',
      isImageUpload
    }, { status: 201 });

  } catch (error) {
    console.error('Error in eviction-upload POST handler:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown server error during eviction notice upload processing.';
    return NextResponse.json({ error: 'Failed to process eviction notice upload', details: errorMsg }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'This is the eviction notice upload endpoint. Use POST to upload eviction notice files (PDF or images).' 
  }, { status: 200 });
} 