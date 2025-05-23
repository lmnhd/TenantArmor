// Local mock database for simulating the polling architecture
interface AnalysisJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  currentStep: string;
  file: {
    name: string;
    size: number;
    type: string;
  };
  state: string;
  formData: Record<string, any>;
  results?: any;
  error?: string;
  createdAt: number;
  updatedAt: number;
  estimatedCompletion?: number;
}

class MockDatabase {
  private jobs: Map<string, AnalysisJob> = new Map();
  private processingQueue: string[] = [];
  private isProcessing = false;

  constructor() {
    // Start the background processor
    this.startProcessor();
  }

  // Create a new analysis job
  createJob(file: File, state: string, formData: Record<string, any>): string {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const job: AnalysisJob = {
      id: jobId,
      status: 'pending',
      progress: 0,
      currentStep: 'Queued for processing',
      file: {
        name: file.name,
        size: file.size,
        type: file.type
      },
      state,
      formData,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      estimatedCompletion: Date.now() + (2 * 60 * 1000) // 2 minutes from now
    };

    this.jobs.set(jobId, job);
    this.processingQueue.push(jobId);
    
    console.log(`[MockDB] Created job ${jobId} for state ${state}`);
    return jobId;
  }

  // Get job status
  getJob(jobId: string): AnalysisJob | null {
    return this.jobs.get(jobId) || null;
  }

  // Update job status
  private updateJob(jobId: string, updates: Partial<AnalysisJob>) {
    const job = this.jobs.get(jobId);
    if (job) {
      const updatedJob = { ...job, ...updates, updatedAt: Date.now() };
      this.jobs.set(jobId, updatedJob);
      console.log(`[MockDB] Updated job ${jobId}: ${updates.currentStep || 'status update'}`);
    }
  }

  // Background processor that simulates AWS Lambda + SQS
  private async startProcessor() {
    setInterval(async () => {
      if (this.isProcessing || this.processingQueue.length === 0) {
        return;
      }

      const jobId = this.processingQueue.shift();
      if (!jobId) return;

      this.isProcessing = true;
      await this.processJob(jobId);
      this.isProcessing = false;
    }, 1000); // Check every second
  }

  // Simulate the complete analysis process
  private async processJob(jobId: string) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    try {
      // Step 1: Start processing
      this.updateJob(jobId, {
        status: 'processing',
        progress: 10,
        currentStep: 'Document upload confirmed'
      });
      await this.delay(2000);

      // Step 2: OCR Processing
      this.updateJob(jobId, {
        progress: 25,
        currentStep: 'Extracting text with OCR'
      });
      await this.delay(3000);

      // Step 3: AI Analysis
      this.updateJob(jobId, {
        progress: 50,
        currentStep: 'Analyzing legal content with AI'
      });
      await this.delay(4000);

      // Step 4: Template Loading
      this.updateJob(jobId, {
        progress: 70,
        currentStep: `Loading ${this.getStateName(job.state)} legal templates`
      });
      await this.delay(2000);

      // Step 5: Response Generation
      this.updateJob(jobId, {
        progress: 85,
        currentStep: 'Generating personalized response'
      });
      await this.delay(3000);

      // Step 6: Complete
      const results = this.generateMockResults(job);
      this.updateJob(jobId, {
        status: 'completed',
        progress: 100,
        currentStep: 'Analysis complete',
        results
      });

    } catch (error) {
      console.error(`[MockDB] Error processing job ${jobId}:`, error);
      this.updateJob(jobId, {
        status: 'failed',
        currentStep: 'Processing failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Generate realistic mock results
  private generateMockResults(job: AnalysisJob) {
    const stateName = this.getStateName(job.state);
    
    return {
      jobId: job.id,
      noticeType: 'Non-Payment of Rent',
      deadline: '2024-02-15',
      amountDue: '$1,250.00',
      propertyAddress: '123 Main Street, Apt 4B, Los Angeles, CA 90210',
      landlordName: 'ABC Property Management',
      violations: [
        `Notice period may be insufficient under ${job.state} state law`,
        'Missing required tenant rights information',
        'Improper service method documented'
      ],
      defenses: [
        'Habitability issues affecting rental value',
        'Landlord failed to provide required notices',
        'Partial payment was accepted after notice period',
        'Retaliatory eviction (recent repair requests)',
        'Discrimination based on protected class'
      ],
      urgency: 'high' as const,
      confidence: 0.87,
      responseText: `[Date]

ABC Property Management
[Landlord Address]

RE: Response to Three-Day Notice to Pay Rent or Quit
Property Address: ${job.file.name} - Property Analysis

Dear ABC Property Management,

I am writing in response to the eviction notice regarding the above-referenced property. Based on AI analysis of the uploaded document (${job.file.name}), I dispute the claims and assert the following defenses under ${stateName} law.

FACTUAL DISPUTES:
The notice states $1,250.00 is owed, however, this amount may be incorrect due to documented issues with the property and payment history.

LEGAL DEFENSES:
1. HABITABILITY ISSUES: The premises has substantial problems affecting rental value under ${stateName} habitability laws.
2. IMPROPER NOTICE: The notice may not comply with ${stateName} legal requirements.
3. RETALIATORY EVICTION: This action appears retaliatory in nature.

I request that you withdraw this notice and work with me to resolve these matters in good faith.

Sincerely,
[Tenant Name]
[Date]

Generated by TenantArmor AI Analysis System`,
      courtInstructions: `FILING INSTRUCTIONS FOR ${stateName.toUpperCase()}:

1. FILE YOUR RESPONSE: You must file within the deadline specified in your notice.
2. COURT LOCATION: Contact your local courthouse for specific filing requirements.
3. REQUIRED FORMS: Obtain state-specific forms for eviction responses.
4. LEGAL ASSISTANCE: Contact local legal aid organizations.

This response was generated based on uploaded file: ${job.file.name}`,
      legalAidContacts: [
        {
          name: `${stateName} Legal Aid Foundation`,
          phone: "(555) 123-4567",
          website: "https://example-legal-aid.org",
          address: `123 Legal Ave, ${stateName}`
        }
      ],
      state: job.state,
      stateLaws: [
        `${stateName} Civil Code Section 1946 - Notice Requirements`,
        `${stateName} Civil Code Section 1942.4 - Habitability`,
        `${stateName} Civil Code Section 1942.5 - Retaliatory Eviction`
      ],
      deadlineType: 'Response to Notice',
      keyDates: [
        {
          date: '2024-02-15',
          description: 'Deadline to respond to eviction notice',
          type: 'deadline' as const
        },
        {
          date: '2024-02-20',
          description: 'Potential court filing date if not resolved',
          type: 'court' as const
        }
      ],
      processedAt: new Date().toISOString(),
      processingTimeMs: Date.now() - job.createdAt
    };
  }

  private getStateName(stateCode: string): string {
    const states: Record<string, string> = {
      'CA': 'California',
      'NY': 'New York',
      'TX': 'Texas',
      'FL': 'Florida',
      'IL': 'Illinois',
      'PA': 'Pennsylvania',
      'OH': 'Ohio',
      'GA': 'Georgia',
      'NC': 'North Carolina',
      'MI': 'Michigan'
    };
    return states[stateCode] || stateCode;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Clean up old jobs (optional)
  cleanup() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    for (const [jobId, job] of this.jobs.entries()) {
      if (job.createdAt < oneHourAgo) {
        this.jobs.delete(jobId);
        console.log(`[MockDB] Cleaned up old job ${jobId}`);
      }
    }
  }

  // Get all jobs (for debugging)
  getAllJobs(): AnalysisJob[] {
    return Array.from(this.jobs.values());
  }
}

// Singleton instance
export const mockDatabase = new MockDatabase();

// Clean up old jobs every hour
setInterval(() => {
  mockDatabase.cleanup();
}, 60 * 60 * 1000);

export type { AnalysisJob }; 