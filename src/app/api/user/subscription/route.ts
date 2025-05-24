import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'

const dynamoDbTableName = process.env.DYNAMODB_USERS_TABLE || 'TenantArmor-Users'
const awsRegion = process.env.AWS_REGION || 'us-east-1'

let ddbClient: DynamoDBClient

if (process.env.NODE_ENV === 'development' && process.env.USE_LOCAL_DYNAMODB === 'true') {
  ddbClient = new DynamoDBClient({
    region: awsRegion,
    endpoint: process.env.LOCAL_DYNAMODB_ENDPOINT || 'http://localhost:8000',
    credentials: {
      accessKeyId: 'fakeMyKeyId',
      secretAccessKey: 'fakeSecretAccessKey'
    }
  })
} else {
  ddbClient = new DynamoDBClient({
    region: awsRegion,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID_NEXTJS_APP || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_NEXTJS_APP || '',
    }
  })
}

export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Try to get user subscription from DynamoDB
    try {
      const result = await ddbClient.send(new GetItemCommand({
        TableName: dynamoDbTableName,
        Key: { userId: { S: userId } }
      }))

      if (result.Item) {
        const user = unmarshall(result.Item)
        let plan = 'free'
        
        // Determine plan based on subscription status
        if (user.subscriptionStatus === 'active') {
          // With new pricing, all active subscriptions are "totally_secure"
          plan = 'totally_secure'
        }
        
        return NextResponse.json({
          subscriptionStatus: user.subscriptionStatus || 'free',
          stripeCustomerId: user.stripeCustomerId,
          stripeSubscriptionId: user.stripeSubscriptionId,
          plan: plan,
          usageCount: user.usageCount || { 
            leaseAnalyses: 0, 
            evictionAnalyses: 0, 
            aiConsultations: 0,
            totalAnalyses: 0 // Track combined for free tier
          },
          // New fields for purchase tracking
          purchasedServices: user.purchasedServices || [],
          purchasedAnalyses: user.purchasedAnalyses || [],
          aiConsultationCredits: user.aiConsultationCredits || 0,
          purchases: user.purchases || [],
          usageLimits: {
            free: { 
              totalAnalyses: -1, // Free users can initiate unlimited analyses (get previews)
              leaseAnalyses: -1, 
              evictionAnalyses: -1, 
              aiConsultations: 0  // No AI consultations on free
            },
            totally_secure: { 
              totalAnalyses: -1, // Unlimited
              leaseAnalyses: -1, 
              evictionAnalyses: -1, 
              aiConsultations: -1 // All unlimited
            }
          }
        })
      } else {
        // User not found in subscription table, default to free
        return NextResponse.json({
          subscriptionStatus: 'free',
          plan: 'free',
          usageCount: { 
            leaseAnalyses: 0, 
            evictionAnalyses: 0, 
            aiConsultations: 0,
            totalAnalyses: 0
          },
          // New fields for purchase tracking
          purchasedServices: [],
          purchasedAnalyses: [],
          aiConsultationCredits: 0,
          purchases: [],
          usageLimits: {
            free: { 
              totalAnalyses: -1, // Free users can initiate unlimited analyses (get previews)
              leaseAnalyses: -1, 
              evictionAnalyses: -1, 
              aiConsultations: 0  // No AI consultations on free
            },
            totally_secure: { 
              totalAnalyses: -1, // Unlimited
              leaseAnalyses: -1, 
              evictionAnalyses: -1, 
              aiConsultations: -1 
            }
          }
        })
      }
    } catch (dbError) {
      console.error('Database error:', dbError)
      // Default to free plan on database error
      return NextResponse.json({
        subscriptionStatus: 'free',
        plan: 'free',
        usageCount: { 
          leaseAnalyses: 0, 
          evictionAnalyses: 0, 
          aiConsultations: 0,
          totalAnalyses: 0
        },
        // New fields for purchase tracking
        purchasedServices: [],
        purchasedAnalyses: [],
        aiConsultationCredits: 0,
        purchases: [],
        usageLimits: {
          free: { 
            totalAnalyses: -1, // Free users can initiate unlimited analyses (get previews)
            leaseAnalyses: -1, 
            evictionAnalyses: -1, 
            aiConsultations: 0  // No AI consultations on free
          },
          totally_secure: { 
            totalAnalyses: -1, // Unlimited
            leaseAnalyses: -1, 
            evictionAnalyses: -1, 
            aiConsultations: -1 
          }
        }
      })
    }
  } catch (error) {
    console.error('Error checking subscription:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
} 