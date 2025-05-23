// Corresponds to the AI's output for an issue
export interface Issue {
  // id: string; // Not present in AI schema
  description: string;
  severity: "High" | "Medium" | "Low";
  recommendation: string;
}

// Corresponds to the AI's output for a clause
export interface Clause {
  // id: string; // Not present in AI schema
  title: string;
  text: string;
  issues: Issue[];
}

// --- New types for AI results and actionable insights ---
// Matches the 'initialAnalysisResults' part from the AI
interface InitialAnalysisResults {
  summary: string;
  overallSeverity: "High" | "Medium" | "Low";
  clauses: Clause[];
  criticalIssues?: Issue[];
}

export interface NextStep {
  step: string;
  importance: "High" | "Medium" | "Consider";
  details?: string;
}

// Matches the 'actionableInsightsData' part from the AI
interface ActionableInsightsData {
  actionableInsights: {
    overallRecommendation: string;
    nextSteps: NextStep[];
  };
}

// Represents the combined 'analysisResults' field in DynamoDB
// This will hold the full output from the AI processing
export type AIAnalysisResults = InitialAnalysisResults & ActionableInsightsData;


// Represents the overall structure of an item in the DYNAMODB_LEASE_ANALYSES_TABLE
export interface LeaseAnalysis {
  analysisId: string; // Partition Key
  userId: string; // Sort Key or GSI SK
  
  fileName: string; 
  fileType?: string; // e.g., 'application/pdf'
  fileSize?: number; // in bytes
  userSelectedState: string; // e.g., "NY", "CA"

  status: 
    | "UPLOAD_PENDING"          // Initial status before S3 upload URL is generated
    | "UPLOAD_URL_GENERATED"    // Presigned URL generated, awaiting client upload
    | "UPLOAD_COMPLETED_PENDING_PROCESSING" // Client confirmed upload, Lambda not yet invoked
    | "TEXT_EXTRACTION_IN_PROGRESS" // Lambda started, PDF to text
    | "TEXT_EXTRACTION_FAILED"
    | "TEXT_EXTRACTION_COMPLETE"  // Text extracted, AI analysis pending
    | "AI_PROCESSING_IN_PROGRESS" // AI analysis started (internal step if needed)
    | "PARTIAL_ANALYSIS_INSIGHTS_FAILED" // Initial analysis done, insights failed
    | "ANALYSIS_COMPLETE"       // AI analysis successfully completed
    | "AI_PROCESSING_FAILED"    // AI analysis failed (initial part)
    | "FAILED";                 // General failure state

  uploadTimestamp: string;      // ISO 8601 timestamp
  lastUpdatedTimestamp: string; // ISO 8601 timestamp
  
  extractedText?: string;       // Full extracted text from the document (can be large)
  analysisResults?: AIAnalysisResults; // Parsed JSON from AI, stored as a map
  errorDetails?: string;        // If status is FAILED or an error occurred
  
  // Optional fields that might be added later
  s3Bucket?: string;
  s3Key?: string;
  presignedUrl?: string;
  urlExpiryTimestamp?: string;
}

// Old LeaseAnalysis type for reference (can be removed once page.tsx is updated)
/*
export interface LeaseAnalysis {
  id: string;
  documentName: string;
  uploadDate: string;
  summary: string;
  clauses: Clause[];
  overallSeverity: \'High\' | \'Medium\' | \'Low\';
} 
*/ 