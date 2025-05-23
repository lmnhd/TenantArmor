import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { Pinecone } from '@pinecone-database/pinecone';
import type { LeaseAnalysis, AIAnalysisResults } from '@/lib/types'; // Assuming types are defined
import { streamText, embed } from 'ai';
import { openai as vercelOpenAIProvider } from '@ai-sdk/openai';
import type { CoreMessage } from 'ai';

const awsRegion = process.env.AWS_REGION || 'us-east-1';
const dynamoDbTableName = process.env.DYNAMODB_LEASE_ANALYSES_TABLE;

// Allow streaming responses up to 30 seconds (Next.js Edge runtime specific)
// For Vercel Serverless Functions, the default is 15s, max is 60s (Pro) or 300s (Enterprise)
// For self-hosted Node.js, this is not directly applicable in the same way.
export const maxDuration = 30; 

// --- Initialize OpenAI Client (using Vercel AI SDK) ---
if (!process.env.OPENAI_API_KEY) {
  console.warn('(API Chat) OPENAI_API_KEY is not set. OpenAI API calls will fail.');
}
// The Vercel SDK's OpenAI provider doesn't need explicit instantiation here if configured globally or via env vars.
// We'll use vercelOpenAIProvider('gpt-4o') directly in streamText.
// For embeddings, we will use the embed function from the 'ai' package.
const openaiEmbeddingModel = vercelOpenAIProvider.embedding('text-embedding-ada-002');

// --- Initialize Pinecone Client ---
let pinecone: Pinecone | null = null;
if (process.env.PINECONE_API_KEY && process.env.PINECONE_INDEX_NAME) {
  pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
  });
} else {
  console.warn('(API Chat) Pinecone environment variables (API_KEY, INDEX_NAME) are not fully set. Pinecone operations will be skipped.');
}
const pineconeIndexName = process.env.PINECONE_INDEX_NAME;

// --- Initialize DynamoDB Client ---
let ddbClient: DynamoDBClient;
if (process.env.NODE_ENV === 'development' && process.env.USE_LOCAL_DYNAMODB === 'true') {
  console.log('(API Chat) Using local DynamoDB endpoint');
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
    console.warn('(API Chat) AWS credentials for Next.js app are not set. DynamoDB operations may fail.');
  }
  ddbClient = new DynamoDBClient({
    region: awsRegion,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID_NEXTJS_APP || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_NEXTJS_APP || '',
    },
  });
}

interface ChatRequest {
  analysisId: string;
  messages: CoreMessage[]; // Use CoreMessage from 'ai' package
}

const MAX_CONTEXT_TEXT_LENGTH = 4000; // Max characters for combined context texts

// Helper to truncate text by characters
function truncateText(text: string | undefined, maxLength: number): string {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

export async function POST(request: Request) {
  console.log('(API Chat) Chat API route hit');
  try {
    if (!dynamoDbTableName) {
      // Return a standard Response object for errors when streaming
      return new Response(JSON.stringify({ error: 'Server configuration error: DDB_TABLE_NAME missing' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
    if (!process.env.OPENAI_API_KEY) {
        return new Response(JSON.stringify({ error: 'Server configuration error: OPENAI_API_KEY missing' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const { analysisId, messages }: ChatRequest = await request.json();

    if (!analysisId || !messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid request: analysisId and messages are required.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const currentUserMessageContent = messages[messages.length - 1]?.content;
    if (typeof currentUserMessageContent !== 'string') {
        return new Response(JSON.stringify({ error: 'Invalid request: Last message content must be a string.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // 1. Fetch Lease-Specific Context from DynamoDB
    let leaseAnalysis: LeaseAnalysis | null = null;
    let leaseContextText = 'No specific lease analysis data found for this ID.';
    let userSelectedState: string | undefined = undefined;

    try {
      const { Item } = await ddbClient.send(new GetItemCommand({ TableName: dynamoDbTableName, Key: marshall({ analysisId }) }));
      if (Item) {
        leaseAnalysis = unmarshall(Item) as LeaseAnalysis;
        userSelectedState = leaseAnalysis.userSelectedState;
        const analysisResults = leaseAnalysis.analysisResults as AIAnalysisResults | undefined;
        leaseContextText = `Lease Analysis Summary for document \\'${leaseAnalysis.fileName}\\':\\nOverall Severity: ${analysisResults?.overallSeverity || 'N/A'}\\nSummary: ${truncateText(analysisResults?.summary, 500)}\\nActionable Insights: ${truncateText(analysisResults?.actionableInsights?.overallRecommendation, 300)}\\nKey Clauses/Issues mentioned in analysis: ${analysisResults?.clauses?.map(c => c.title + (c.issues.length > 0 ? ' (Issues: ' + c.issues.map(i => i.description.substring(0,50) + '...').join('; ') + ')' : '') ).slice(0,5).join(', ') || 'None specified'}`;
      } else {
        console.warn(`(API Chat) No lease analysis item found for analysisId: ${analysisId}`);
      }
    } catch (dbError) {
      console.error(`(API Chat) Error fetching lease analysis from DDB for ${analysisId}:`, dbError);
      leaseContextText = 'Error retrieving lease analysis data.';
      // Non-fatal, will proceed without lease-specific context or with an error message in context
    }

    // 2. Fetch General Legal Context from Pinecone
    let pineconeContextText = 'No general legal information retrieved.';
    if (pinecone && pineconeIndexName && userSelectedState) {
      try {
        console.log(`(API Chat) Creating embedding for query: \"${currentUserMessageContent.substring(0,100)}...\"`);
        
        // Use the Vercel AI SDK's embed function
        const { embedding } = await embed({
            model: openaiEmbeddingModel, // Use the correctly initialized embedding model
            value: currentUserMessageContent,
        });

        if (embedding) {
          const pineconeIndex = pinecone.Index(pineconeIndexName);
          console.log(`(API Chat) Querying Pinecone index '${pineconeIndexName}' for state '${userSelectedState}'`);
          const queryResponse = await pineconeIndex.query({
            vector: embedding,
            topK: 3, // Get top 3 relevant documents
            filter: { state: { $eq: userSelectedState } }, // Filter by state
            includeMetadata: true,
          });

          if (queryResponse.matches && queryResponse.matches.length > 0) {
            pineconeContextText = 'Relevant general legal information:\\n' +
              queryResponse.matches.map((match, index) => 
                `Document ${index + 1} (Similarity: ${(match.score || 0).toFixed(2)}):\\n${truncateText(match.metadata?.text as string, 500)}`
              ).join('\\n\\n');
            console.log(`(API Chat) Retrieved ${queryResponse.matches.length} matches from Pinecone.`);
          } else {
            pineconeContextText = 'No relevant general legal documents found for your query in the selected state.';
            console.log('(API Chat) No matches from Pinecone for the query.');
          }
        } else {
            console.warn('(API Chat) Failed to generate query embedding.');
            pineconeContextText = "Could not process query for legal information search.";
        }
      } catch (pcError) {
        console.error('(API Chat) Error querying Pinecone:', pcError);
        pineconeContextText = 'Error searching general legal knowledge base.';
      }
    } else if (!userSelectedState && pinecone && pineconeIndexName) {
        pineconeContextText = "Cannot search general legal knowledge base: User's state not identified from lease analysis.";
    } else if (!pinecone || !pineconeIndexName){
        pineconeContextText = "General legal knowledge base is currently unavailable (Pinecone not configured).";
    }

    // 3. Augment Prompt for LLM
    // Token management for history for Vercel AI SDK:
    // The SDK and underlying providers often handle token limits for history,
    // but it's good practice to still have some control if very long histories are possible.
    // For now, we'll pass the messages as is, assuming the `streamText` or model will handle truncation if needed.
    // If precise control is needed, `buildPrompt` from `ai` can be used.
    // The `messages` prop in `streamText` expects `CoreMessage[]` which includes `user`, `assistant`, `system`, `tool` roles.
    
    // The user's current message is already the last one in the `messages` array.
    // The Vercel SDK expects the system prompt to be passed separately.

    const systemPrompt = `You are TenantArmor AI, a specialized legal assistant. Your goal is to help users understand their lease agreement and related tenant rights based on the provided context.
Current User's State (derived from their lease): ${userSelectedState || 'Unknown'}
Analysis Document Name: ${leaseAnalysis?.fileName || 'N/A'}

IMPORTANT INSTRUCTIONS:
1.  Prioritize information directly from the user's Lease Analysis Context when available.
2.  Use the General Legal Context for broader questions or when the lease analysis doesn't cover a specific topic for the user's state.
3.  If the user's state is known, and general legal context is provided for that state, clearly indicate that the information pertains to that state.
4.  If a user asks a question that cannot be answered by either the lease-specific context or the general legal context, state that you don't have that specific information.
5.  DO NOT provide financial advice or opinions beyond what is directly stated in the provided context.
6.  ALWAYS remind the user that you are an AI assistant and this is NOT legal advice. For definitive legal guidance, they must consult a qualified attorney.
7.  Be conversational and helpful. Keep answers concise where possible.
8.  If no specific lease or general legal context seems relevant, acknowledge the query and state your limitations for that specific question.

Lease Analysis Context:
${truncateText(leaseContextText, MAX_CONTEXT_TEXT_LENGTH / 2)}

General Legal Context from Knowledge Base (for ${userSelectedState || 'the relevant jurisdiction'}):
${truncateText(pineconeContextText, MAX_CONTEXT_TEXT_LENGTH / 2)}
`;
    
    // 4. Call OpenAI LLM via Vercel AI SDK
    console.log('(API Chat) Calling OpenAI via Vercel AI SDK streamText...');
    try {
      const result = await streamText({
        model: vercelOpenAIProvider('gpt-4o'), 
        messages: messages, // Pass the full message history (CoreMessage[])
        system: systemPrompt,
        temperature: 0.5,
        // max_tokens: 500, // Optional, can be set here
        // Events (onStart, onToken, onCompletion, onFinal, etc.) can be handled here if needed server-side
      });

      // Respond with the stream
      return result.toDataStreamResponse();

    } catch (openaiError) {
      console.error('(API Chat) Error calling OpenAI via Vercel AI SDK:', openaiError);
      // Return a standard Response object for errors
      const errorMessage = openaiError instanceof Error ? openaiError.message : String(openaiError);
      return new Response(JSON.stringify({ error: 'Failed to get response from AI assistant', details: errorMessage }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

  } catch (error: unknown) {
    console.error("Critical error in chat API handler:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected critical error occurred.";
    return new Response(JSON.stringify({ error: `Server error: ${errorMessage}` }), { status: 500 });
  }
} 