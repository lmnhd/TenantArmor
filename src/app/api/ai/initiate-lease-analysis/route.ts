import { NextResponse } from 'next/server';
import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import OpenAI from 'openai';

// Initialize AWS Clients
const awsRegion = process.env.AWS_REGION || 'us-east-1';
const dynamoDbTableName = process.env.DYNAMODB_LEASE_ANALYSES_TABLE;

let ddbClient: DynamoDBClient;
if (process.env.NODE_ENV === 'development' && process.env.USE_LOCAL_DYNAMODB === 'true') {
  console.log('Using local DynamoDB endpoint');
  ddbClient = new DynamoDBClient({
    region: awsRegion,
    endpoint: process.env.LOCAL_DYNAMODB_ENDPOINT || 'http://localhost:8000',
    credentials: {
        accessKeyId: 'fakeMyKeyId', // localstack/DynamoDB local defaults
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

// Initialize OpenAI Client
if (!process.env.OPENAI_API_KEY) {
  console.warn('OPENAI_API_KEY is not set. OpenAI API calls will fail.');
  // Depending on your error handling strategy, you might throw an error here
  // or allow the endpoint to load but fail gracefully when an AI call is made.
}
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

// This is the endpoint that the AWS Lambda function will call
// after processing the PDF.

export async function POST(request: Request) {
  try {
    if (!dynamoDbTableName) {
      console.error('DYNAMODB_LEASE_ANALYSES_TABLE environment variable is not set.');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY environment variable is not set.');
      return NextResponse.json({ error: 'Server configuration error: Missing OpenAI API Key' }, { status: 500 });
    }

    const body = await request.json();
    console.log('Received callback from Lambda:', JSON.stringify(body, null, 2));

    const { analysisId, s3Bucket, s3Key, extractedText } = body; // Match Lambda payload

    if (!analysisId || !s3Bucket || !s3Key || typeof extractedText !== 'string') {
      console.error('Invalid payload received from Lambda:', body);
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    console.log(`Starting analysis for ID: ${analysisId}`);

    // --- Retrieve context from DynamoDB (as before) --- 
    let userSelectedState = 'unknown_state';
    let userId = 'unknown_user';
    try {
      const { Item } = await ddbClient.send(new GetItemCommand({ TableName: dynamoDbTableName, Key: marshall({ analysisId }) }));
      if (Item) {
        const unmarshalledItem = unmarshall(Item);
        userSelectedState = unmarshalledItem.userSelectedState || userSelectedState;
        userId = unmarshalledItem.userId || userId;
        console.log(`Context: UserID=${userId}, State=${userSelectedState}`);
      }
    } catch (dbError) { console.error('Error retrieving context from DDB:', dbError); }

    // === PHASE 1: Initial Lease Analysis ===
    let initialAnalysisResults: any;
    try {
      const systemMessageInitial = `You are a legal assistant specializing in ${userSelectedState} lease agreements. Analyze the lease text. Respond ONLY with a valid JSON object adhering to this schema: ${JSON.stringify(initialAnalysisJsonSchema, null, 2)}`;
      const userMessageInitial = `Lease text: ${extractedText}`;
      
      console.log('Calling OpenAI for initial analysis...');
      const responseInitial = await openai.chat.completions.create({
        model: "gpt-4.1", 
        messages: [{ role: "system", content: systemMessageInitial }, { role: "user", content: userMessageInitial }],
        response_format: { type: "json_object" },
        temperature: 0.2,
      });

      const rawContentInitial = responseInitial.choices[0]?.message?.content;
      if (!rawContentInitial) throw new Error('Initial analysis: No content from AI.');
      initialAnalysisResults = JSON.parse(rawContentInitial);
      console.log('Initial analysis successful.');

    } catch (aiError) {
      console.error('Error during initial AI analysis:', aiError);
      // Update DDB with failure and return
      const errorMsg = aiError instanceof Error ? aiError.message : 'Unknown initial AI error';
      await ddbClient.send(new UpdateItemCommand({
          TableName: dynamoDbTableName, Key: marshall({ analysisId }),
          UpdateExpression: "SET #status = :s, #errorDetails = :e, #lastUpdated = :lu",
          ExpressionAttributeNames: { "#status": "status", "#errorDetails": "errorDetails", "#lastUpdated": "lastUpdatedTimestamp" },
          ExpressionAttributeValues: marshall({ ":s": "AI_PROCESSING_FAILED", ":e": `Initial: ${errorMsg}`, ":lu": new Date().toISOString() })
      }));
      return NextResponse.json({ error: 'Initial AI processing failed', details: errorMsg }, { status: 500 });
    }

    // === PHASE 2: Generate Actionable Insights ===
    let actionableInsightsData: any;
    try {
      // Prepare a concise summary of initial findings for the second prompt
      let contextForInsights = `Summary: ${initialAnalysisResults.summary}. Overall Severity: ${initialAnalysisResults.overallSeverity}.`;
      const highSeverityIssues = initialAnalysisResults.clauses
        .flatMap((c: any) => c.issues)
        .filter((i: any) => i.severity === 'High')
        .map((i: any) => i.description);
      if (highSeverityIssues.length > 0) {
        contextForInsights += ` Key high-severity issues include: ${highSeverityIssues.join('; ')}`;
      }

      const systemMessageInsights = `Based on the following lease analysis context, provide actionable next steps for the user. Respond ONLY with a valid JSON object adhering to this schema: ${JSON.stringify(actionableInsightsJsonSchema, null, 2)}`;
      const userMessageInsights = `Context: ${contextForInsights.substring(0, 3500)} Please provide actionable insights.`; // Truncate context if too long

      console.log('Calling OpenAI for actionable insights...');
      const responseInsights = await openai.chat.completions.create({
        model: "gpt-4.1", // Or a different model if preferred for advisory tasks
        messages: [{ role: "system", content: systemMessageInsights }, { role: "user", content: userMessageInsights }],
        response_format: { type: "json_object" },
        temperature: 0.5, // Slightly higher temperature for more varied advice
      });

      const rawContentInsights = responseInsights.choices[0]?.message?.content;
      if (!rawContentInsights) throw new Error('Actionable insights: No content from AI.');
      actionableInsightsData = JSON.parse(rawContentInsights);
      console.log('Actionable insights generation successful.');

    } catch (aiError) {
      console.error('Error during actionable insights generation:', aiError);
      // Update DDB with failure (but retain initial analysis if successful) and return
      const errorMsg = aiError instanceof Error ? aiError.message : 'Unknown insights AI error';
       await ddbClient.send(new UpdateItemCommand({
          TableName: dynamoDbTableName, Key: marshall({ analysisId }),
          UpdateExpression: "SET #status = :s, #errorDetails = :e, #analysisResults = :ar, #lastUpdated = :lu",
          ExpressionAttributeNames: { "#status": "status", "#errorDetails": "errorDetails", "#analysisResults": "analysisResults", "#lastUpdated": "lastUpdatedTimestamp" },
          ExpressionAttributeValues: marshall({ ":s": "PARTIAL_ANALYSIS_INSIGHTS_FAILED", ":e": `Insights: ${errorMsg}`, ":ar": initialAnalysisResults, ":lu": new Date().toISOString() })
      }));
      // Still return the initial results if the second phase failed, but with an error indication
      return NextResponse.json({ 
        message: 'Initial analysis complete, but actionable insights generation failed.', 
        analysisId: analysisId,
        results: initialAnalysisResults, // Return partial results
        errorDetailsInsights: errorMsg
      }, { status: 207 }); // Multi-Status or a custom success with error field
    }

    // === Combine and Store Final Results ===
    const finalResults = {
      ...initialAnalysisResults,
      ...actionableInsightsData, // This should nest actionableInsights under its key from the schema
    };

    try {
      await ddbClient.send(new UpdateItemCommand({
        TableName: dynamoDbTableName, Key: marshall({ analysisId }),
        UpdateExpression: "SET #status = :s, #analysisResults = :ar, #lastUpdated = :lu",
        ExpressionAttributeNames: { "#status": "status", "#analysisResults": "analysisResults", "#lastUpdated": "lastUpdatedTimestamp" },
        ExpressionAttributeValues: marshall({ ":s": "ANALYSIS_COMPLETE", ":ar": finalResults, ":lu": new Date().toISOString() })
      }));
      console.log('Full analysis with insights stored in DDB.');
    } catch (dbError) {
      console.error('Error storing final results in DDB:', dbError);
      // Data processed but not saved - critical
    }
    
    return NextResponse.json({ 
      message: 'AI analysis with actionable insights complete', 
      analysisId: analysisId,
      results: finalResults 
    }, { status: 200 });

  } catch (error) {
    console.error('Overall error in POST handler:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown server error';
    return NextResponse.json({ error: 'Error processing callback', details: errorMsg }, { status: 500 });
  }
}

// Optional: Add a GET handler if you want to be able to ping this endpoint
export async function GET() {
  return NextResponse.json({ message: 'This endpoint is for POST requests from the PDF processing Lambda.' }, { status: 200 });
} 