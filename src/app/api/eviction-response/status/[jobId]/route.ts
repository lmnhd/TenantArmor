import { NextRequest, NextResponse } from 'next/server';
import { mockDatabase } from '@/lib/mock-database';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Get job from mock database
    const job = mockDatabase.getJob(jobId);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Return job status
    const response = {
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      currentStep: job.currentStep,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      estimatedCompletion: job.estimatedCompletion
    };

    // If completed, include results
    if (job.status === 'completed' && job.results) {
      return NextResponse.json({
        ...response,
        results: job.results
      });
    }

    // If failed, include error
    if (job.status === 'failed' && job.error) {
      return NextResponse.json({
        ...response,
        error: job.error
      });
    }

    // Still processing or pending
    return NextResponse.json(response);

  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 