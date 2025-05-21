import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1', // Ensure AWS_REGION is set in your environment
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID_NEXTJS_APP || '', // Ensure these are set
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_NEXTJS_APP || '',
  },
});

const BUCKET_NAME = process.env.S3_UPLOAD_BUCKET_NAME || 'tenantarmorstack-tenantarmoruploadsbuckete004fe66-mcf7amlrudwc'; // Replace with your actual bucket name or use env var

export async function POST(request: Request) {
  try {
    const { fileName, fileType } = await request.json();

    if (!fileName || !fileType) {
      return NextResponse.json({ error: 'fileName and fileType are required' }, { status: 400 });
    }

    // Generate a unique key for the S3 object, perhaps prepending a user ID or session ID in a real app
    const uniqueKey = `${uuidv4()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: uniqueKey,
      ContentType: fileType,
      // ACL: 'public-read', // Uncomment if you want the uploaded files to be publicly readable
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // URL expires in 1 hour
    });

    return NextResponse.json({ signedUrl, key: uniqueKey }, { status: 200 });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: 'Error generating signed URL', details: errorMessage }, { status: 500 });
  }
}

// Optional: Add a GET handler or other methods if needed
export async function GET() {
  return NextResponse.json({ message: 'This endpoint is for POST requests to generate S3 signed URLs.' }, { status: 200 });
} 