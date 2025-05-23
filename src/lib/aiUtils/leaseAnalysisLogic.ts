import OpenAI from 'openai';

// --- TypeScript Interfaces for AI Schemas ---
export interface Issue {
  description: string;
  severity: "High" | "Medium" | "Low";
  recommendation: string;
}

export interface Clause {
  title: string;
  text: string;
  issues: Issue[];
}

export interface InitialAnalysisResults {
  summary: string;
  overallSeverity: "High" | "Medium" | "Low";
  clauses: Clause[];
}

export interface NextStep {
  step: string;
  importance: "High" | "Medium" | "Consider";
  details?: string; // Optional property
}

export interface ActionableInsightsData {
  actionableInsights: {
    overallRecommendation: string;
    nextSteps: NextStep[];
  };
}

// Custom error interface for attaching partial results
interface AIServiceError extends Error {
  partialResults?: InitialAnalysisResults;
}

// --- Schema for the first AI call (Initial Analysis) ---
const initialAnalysisJsonSchema = {
  type: "object",
  properties: {
    summary: { 
      type: "string", 
      description: "A concise overall summary of the lease agreement, highlighting its main purpose and any immediate standout observations."
    },
    overallSeverity: {
      type: "string",
      description: "An overall risk assessment for the lease, categorized as 'High', 'Medium', or 'Low'. This should be based on the number and severity of identified issues.",
      enum: ["High", "Medium", "Low"]
    },
    clauses: {
      type: "array",
      description: "An array of important clauses extracted from the lease document.",
      items: {
        type: "object",
        properties: {
          title: { 
            type: "string", 
            description: "A clear, concise title for the clause (e.g., 'Rent Payment Terms', 'Subletting Restrictions', 'Maintenance Responsibilities')."
          },
          text: { 
            type: "string", 
            description: "The verbatim text of the clause as it appears in the lease document."
          },
          issues: {
            type: "array",
            description: "A list of potential issues, concerns, or points of attention identified within this specific clause.",
            items: {
              type: "object",
              properties: {
                description: { 
                  type: "string", 
                  description: "A clear description of the potential issue or concern."
                },
                severity: {
                  type: "string",
                  description: "The severity of this specific issue, categorized as 'High', 'Medium', or 'Low'.",
                  enum: ["High", "Medium", "Low"]
                },
                recommendation: {
                  type: "string",
                  description: "A practical recommendation or action the user might consider regarding this issue (e.g., 'Seek clarification from landlord', 'Consult a legal professional', 'Be aware of this implication')."
                }
              },
              required: ["description", "severity", "recommendation"]
            }
          }
        },
        required: ["title", "text", "issues"]
      }
    }
  },
  required: ["summary", "overallSeverity", "clauses"]
};

// --- Schema for the second AI call (Actionable Insights) ---
const actionableInsightsJsonSchema = {
  type: "object",
  properties: {
    actionableInsights: {
      type: "object",
      description: "Provides smart advice and actionable next steps for the user based on the overall analysis.",
      properties: {
        overallRecommendation: {
          type: "string",
          description: "A brief overall recommendation or takeaway message for the user based on the lease analysis."
        },
        nextSteps: {
          type: "array",
          description: "A list of 2-4 concrete, actionable next steps the user should consider.",
          items: {
            type: "object",
            properties: {
              step: { type: "string", description: "A single actionable step." },
              importance: { 
                type: "string", 
                description: "Indicates the importance or urgency (e.g., 'High', 'Medium', 'Consider').",
                enum: ["High", "Medium", "Consider"]
              },
              details: { type: "string", description: "(Optional) Further details or rationale for this step, if necessary." }
            },
            required: ["step", "importance"]
          }
        }
      },
      required: ["overallRecommendation", "nextSteps"]
    }
  },
  required: ["actionableInsights"]
};

// --- Core AI Processing Function ---
export async function performAiLeaseAnalysis(
  extractedText: string,
  userSelectedState: string,
  openaiClient: OpenAI // Expecting the initialized OpenAI client to be passed in
): Promise<{ initialAnalysisResults: InitialAnalysisResults; actionableInsightsData: ActionableInsightsData }> {
  let initialAnalysisResults: InitialAnalysisResults;
  let actionableInsightsData: ActionableInsightsData;

  // === PHASE 1: Initial Lease Analysis ===
  try {
    const systemMessageInitial = `You are a legal assistant specializing in ${userSelectedState} lease agreements. Analyze the lease text. Respond ONLY with a valid JSON object adhering to this schema: ${JSON.stringify(initialAnalysisJsonSchema, null, 2)}`;
    const userMessageInitial = `Lease text: ${extractedText}`;
    
    console.log('(leaseAnalysisLogic) Calling OpenAI for initial analysis...');
    const responseInitial = await openaiClient.chat.completions.create({
      model: "gpt-4.1", 
      messages: [{ role: "system", content: systemMessageInitial }, { role: "user", content: userMessageInitial }],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const rawContentInitial = responseInitial.choices[0]?.message?.content;
    if (!rawContentInitial) throw new Error('Initial analysis: No content from AI.');
    initialAnalysisResults = JSON.parse(rawContentInitial) as InitialAnalysisResults;
    console.log('(leaseAnalysisLogic) Initial analysis successful.');

  } catch (catchedError: unknown) {
    console.error('(leaseAnalysisLogic) Error during initial AI analysis:', catchedError);
    const errorMessage = catchedError instanceof Error ? catchedError.message : "An unknown error occurred during AI processing.";
    throw new Error(`Initial AI Analysis Failed: ${errorMessage}`);
  }

  // === PHASE 2: Generate Actionable Insights ===
  try {
    let contextForInsights = `Summary: ${initialAnalysisResults.summary}. Overall Severity: ${initialAnalysisResults.overallSeverity}.`;
    const highSeverityIssues = initialAnalysisResults.clauses
      .flatMap((c: Clause) => c.issues)
      .filter((i: Issue) => i.severity === 'High')
      .map((i: Issue) => i.description);
    if (highSeverityIssues.length > 0) {
      contextForInsights += ` Key high-severity issues include: ${highSeverityIssues.join('; ')}`;
    }

    const systemMessageInsights = `Based on the following lease analysis context, provide actionable next steps for the user. Respond ONLY with a valid JSON object adhering to this schema: ${JSON.stringify(actionableInsightsJsonSchema, null, 2)}`;
    const userMessageInsights = `Context: ${contextForInsights.substring(0, 3500)} Please provide actionable insights.`;

    console.log('(leaseAnalysisLogic) Calling OpenAI for actionable insights...');
    const responseInsights = await openaiClient.chat.completions.create({
      model: "gpt-4.1", 
      messages: [{ role: "system", content: systemMessageInsights }, { role: "user", content: userMessageInsights }],
      response_format: { type: "json_object" },
      temperature: 0.5,
    });

    const rawContentInsights = responseInsights.choices[0]?.message?.content;
    if (!rawContentInsights) throw new Error('Actionable insights: No content from AI.');
    actionableInsightsData = JSON.parse(rawContentInsights) as ActionableInsightsData;
    console.log('(leaseAnalysisLogic) Actionable insights generation successful.');

  } catch (catchedError: unknown) {
    console.error('(leaseAnalysisLogic) Error during actionable insights generation:', catchedError);
    const errorMessage = catchedError instanceof Error ? catchedError.message : "An unknown error occurred during AI processing.";
    const errorToThrow = new Error(`Actionable Insights Generation Failed: ${errorMessage}`) as AIServiceError;
    errorToThrow.partialResults = initialAnalysisResults; // Attach partial results for the caller to handle
    throw errorToThrow;
  }

  return { initialAnalysisResults, actionableInsightsData };
} 