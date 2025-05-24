import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

// Initialize AWS Clients
const awsRegion = process.env.AWS_REGION || 'us-east-1';
const dynamoDbTableName = process.env.DYNAMODB_USERS_TABLE || 'TenantArmor-Users';

let ddbClient: DynamoDBClient;

if (process.env.NODE_ENV === 'development' && process.env.USE_LOCAL_DYNAMODB === 'true') {
  ddbClient = new DynamoDBClient({
    region: awsRegion,
    endpoint: process.env.LOCAL_DYNAMODB_ENDPOINT || 'http://localhost:8000',
    credentials: {
        accessKeyId: 'fakeMyKeyId', 
        secretAccessKey: 'fakeSecretAccessKey'
    }
  });
} else {
  ddbClient = new DynamoDBClient({ 
    region: awsRegion,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID_NEXTJS_APP || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_NEXTJS_APP || '',
    }
  });
}

async function checkAIConsultationAccess(userId: string): Promise<{ 
  canProceed: boolean; 
  plan: string; 
  aiConsultationCredits: number 
}> {
  try {
    const result = await ddbClient.send(new GetItemCommand({
      TableName: dynamoDbTableName,
      Key: { userId: { S: userId } }
    }));

    if (result.Item) {
      const user = unmarshall(result.Item);
      let plan = 'free'
      
      // Determine plan based on subscription status
      if (user.subscriptionStatus === 'active') {
        plan = 'totally_secure'
      }

      const aiConsultationCredits = user.aiConsultationCredits || 0

      // Check access
      if (plan === 'totally_secure') {
        // Unlimited access for totally secure users
        return { canProceed: true, plan, aiConsultationCredits: -1 }
      } else if (aiConsultationCredits > 0) {
        // Free users with purchased credits
        return { canProceed: true, plan, aiConsultationCredits }
      } else {
        // Free users without credits
        return { canProceed: false, plan, aiConsultationCredits: 0 }
      }
    } else {
      // New user, no access
      return { canProceed: false, plan: 'free', aiConsultationCredits: 0 }
    }
  } catch (error) {
    console.error('Error checking AI consultation access:', error)
    // Default to no access on error
    return { canProceed: false, plan: 'free', aiConsultationCredits: 0 }
  }
}

async function deductAIConsultationCredit(userId: string) {
  try {
    await ddbClient.send(new UpdateItemCommand({
      TableName: dynamoDbTableName,
      Key: { userId: { S: userId } },
      UpdateExpression: 'SET aiConsultationCredits = aiConsultationCredits - :one',
      ConditionExpression: 'aiConsultationCredits > :zero',
      ExpressionAttributeValues: {
        ':one': { N: '1' },
        ':zero': { N: '0' }
      }
    }))
    console.log(`AI consultation credit deducted for user ${userId}`)
  } catch (error) {
    console.error('Error deducting AI consultation credit:', error)
    // Don't throw - allow consultation to proceed even if deduction fails
  }
}

async function processAIConsultation(message: string, conversationId?: string): Promise<string> {
  // TODO: Implement actual AI consultation logic
  // This could use OpenAI, Claude, or your preferred AI service
  // For now, return a placeholder response
  
  return `Thank you for your tenant rights question: "${message}". This is a placeholder response. In the full implementation, this would provide expert legal guidance based on your specific tenant situation and location.`;
}

export async function POST(request: Request) {
  try {
    // 1. Authenticate user with Clerk
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in to use AI consultations.' }, { status: 401 });
    }

    // 2. Get request body
    const { message, conversationId } = await request.json();
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // 3. Check user's AI consultation access
    const accessCheck = await checkAIConsultationAccess(userId);
    if (!accessCheck.canProceed) {
      return NextResponse.json({ 
        error: 'AI consultation access required. Please purchase consultation credits or upgrade your plan.',
        plan: accessCheck.plan,
        aiConsultationCredits: accessCheck.aiConsultationCredits
      }, { status: 403 });
    }

    // 4. Deduct AI consultation credit if user is on free plan with purchased credits
    if (accessCheck.plan === 'free' && accessCheck.aiConsultationCredits > 0) {
      await deductAIConsultationCredit(userId);
    }

    // 5. Process AI consultation (placeholder - implement actual AI logic)
    const aiResponse = await processAIConsultation(message, conversationId);

    return NextResponse.json({
      message: aiResponse,
      conversationId: conversationId || `conv_${Date.now()}`,
      creditsRemaining: accessCheck.plan === 'free' ? Math.max(0, accessCheck.aiConsultationCredits - 1) : -1
    });

  } catch (error) {
    console.error('Error in AI consultation:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: "AI Consultation API. Use POST to submit consultation requests." 
  });
} 