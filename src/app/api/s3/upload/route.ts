import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

// Ensure your AWS credentials and region are set in environment variables
// Also, S3_UPLOAD_BUCKET_NAME should be set.
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1', // Default to us-east-1 if not set
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const S3_BUCKET_NAME = process.env.S3_UPLOAD_BUCKET_NAME;

export async function POST(request: NextRequest) {
  if (!S3_BUCKET_NAME) {
    return NextResponse.json(
      { error: 'S3 bucket name is not configured.' },
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
    const body = await request.json();
    const {
        filename, 
        contentType, 
        userId, 
        userSelectedState, 
        documentType 
    } = body;

    if (!filename || !contentType || !userId || !userSelectedState || !documentType) {
      return NextResponse.json(
        { error: 'filename, contentType, userId, userSelectedState, and documentType are required.' },
        { status: 400 }
      );
    }

    const uniqueSuffix = uuidv4();
    const fileExtension = filename.split('.').pop();
    const baseFilename = filename.substring(0, filename.lastIndexOf('.') > -1 ? filename.lastIndexOf('.') : filename.length);
    const sanitizedBaseFilename = baseFilename.replace(/[^a-zA-Z0-9_.-]/g, '_');
    
    let objectKey: string;
    if (fileExtension) {
      objectKey = `uploads/${sanitizedBaseFilename}-${uniqueSuffix}.${fileExtension}`;
    } else {
      objectKey = `uploads/${sanitizedBaseFilename}-${uniqueSuffix}`;
    }
    
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: objectKey,
      ContentType: contentType,
      Metadata: {
        'user-id': userId,
        'original-filename': filename,
        'user-selected-state': userSelectedState,
        'document-type': documentType
      }
    });

    const expiresIn = 3600; // URL expires in 1 hour
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });

    return NextResponse.json({
      uploadUrl,
      key: objectKey,
    });

  } catch (error) {
    console.error('Error generating presigned URL:', error);
    let errorMessage = 'Failed to generate presigned URL.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json(
        { error: 'Failed to generate presigned URL.', details: errorMessage },
        { status: 500 }
    );
  }
}
