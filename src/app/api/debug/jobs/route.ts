import { NextResponse } from 'next/server';
import { mockDatabase } from '@/lib/mock-database';

export async function GET() {
  try {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'Debug endpoint only available in development' },
        { status: 403 }
      );
    }

    const jobs = mockDatabase.getAllJobs();
    
    return NextResponse.json({
      totalJobs: jobs.length,
      jobs: jobs.map(job => ({
        id: job.id,
        status: job.status,
        progress: job.progress,
        currentStep: job.currentStep,
        state: job.state,
        fileName: job.file.name,
        createdAt: new Date(job.createdAt).toISOString(),
        updatedAt: new Date(job.updatedAt).toISOString(),
        estimatedCompletion: job.estimatedCompletion ? new Date(job.estimatedCompletion).toISOString() : null,
        hasResults: !!job.results,
        error: job.error
      }))
    });
  } catch (error) {
    console.error('Debug jobs error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 