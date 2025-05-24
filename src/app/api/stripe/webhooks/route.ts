import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { DynamoDBClient, UpdateItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb'
import { marshall } from '@aws-sdk/util-dynamodb'

// Add fallback for build environments
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_for_build'

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-04-30.basil',
})

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const headersList = headers()
    const sig = headersList.get('stripe-signature')

    if (!sig) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)

    console.log('Stripe webhook event:', event.type)

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break

      case 'customer.subscription.updated':
        const updatedSubscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(updatedSubscription)
        break

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(deletedSubscription)
        break

      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentSucceeded(invoice)
        break

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(failedInvoice)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    )
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.client_reference_id || session.metadata?.userId
  
  if (!userId) {
    console.error('No user ID found in checkout session')
    return
  }

  try {
    const purchaseType = session.metadata?.purchaseType
    const service = session.metadata?.service

    if (purchaseType === 'subscription') {
      // Handle subscription purchase
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
      
      await ddbClient.send(new UpdateItemCommand({
        TableName: dynamoDbTableName,
        Key: { userId: { S: userId } },
        UpdateExpression: 'SET subscriptionStatus = :status, subscriptionType = :type, stripeCustomerId = :customerId, stripeSubscriptionId = :subscriptionId, lastUpdated = :timestamp',
        ExpressionAttributeValues: {
          ':status': { S: 'active' },
          ':type': { S: 'yearly' }, // All active subscriptions are now "totally_secure"
          ':customerId': { S: session.customer as string },
          ':subscriptionId': { S: session.subscription as string },
          ':timestamp': { S: new Date().toISOString() }
        }
      }))

      console.log(`Subscription activated for user ${userId} - Totally Secure plan`)
    } else if (purchaseType === 'payment') {
      // Handle one-time purchase
      if (service) {
        await handleOneTimePurchase(userId, service, session)
      } else {
        console.error('No service specified for one-time purchase')
      }
    }
  } catch (error) {
    console.error('Error handling checkout completion:', error)
  }
}

async function handleOneTimePurchase(userId: string, service: string, session: Stripe.Checkout.Session) {
  try {
    // Get current user data or create new record
    let currentUser: any = {}
    try {
      const result = await ddbClient.send(new GetItemCommand({
        TableName: dynamoDbTableName,
        Key: { userId: { S: userId } }
      }))
      if (result.Item) {
        // Parse existing user data
        const rawUser = result.Item
        currentUser = {
          purchasedServices: rawUser.purchasedServices?.L ? rawUser.purchasedServices.L.map((item: any) => item.S) : [],
          purchasedAnalyses: rawUser.purchasedAnalyses?.SS ? rawUser.purchasedAnalyses.SS : [],
          aiConsultationCredits: rawUser.aiConsultationCredits?.N ? parseInt(rawUser.aiConsultationCredits.N) : 0
        }
      }
    } catch (getError) {
      console.log('User not found, creating new record')
    }

    // Prepare updates based on service type
    const updateExpression: string[] = []
    const expressionAttributeValues: any = {
      ':timestamp': { S: new Date().toISOString() },
      ':customerId': { S: session.customer as string },
      ':sessionId': { S: session.id }
    }

    switch (service) {
      case 'lease_analysis':
        // Grant access to specific analysis
        const analysisId = session.metadata?.analysisId
        if (analysisId) {
          const purchasedAnalyses = [...(currentUser.purchasedAnalyses || []), analysisId]
          updateExpression.push('purchasedAnalyses = :purchasedAnalyses')
          expressionAttributeValues[':purchasedAnalyses'] = { SS: purchasedAnalyses }
        }
        // Also add 1 AI consultation credit
        const leaseConsultationCredits = (currentUser.aiConsultationCredits || 0) + 1
        updateExpression.push('aiConsultationCredits = :aiConsultationCredits')
        expressionAttributeValues[':aiConsultationCredits'] = { N: leaseConsultationCredits.toString() }
        break

      case 'eviction_response':
        // Add eviction response service access
        const evictionServices = [...(currentUser.purchasedServices || []), 'eviction_response']
        updateExpression.push('purchasedServices = :purchasedServices')
        expressionAttributeValues[':purchasedServices'] = { L: evictionServices.map(s => ({ S: s })) }
        // Also add 2 AI consultation credits
        const evictionConsultationCredits = (currentUser.aiConsultationCredits || 0) + 2
        updateExpression.push('aiConsultationCredits = :aiConsultationCredits')
        expressionAttributeValues[':aiConsultationCredits'] = { N: evictionConsultationCredits.toString() }
        break

      case 'ai_consultation':
        // Add AI consultation credits (2 days worth)
        const consultationCredits = (currentUser.aiConsultationCredits || 0) + 1
        updateExpression.push('aiConsultationCredits = :aiConsultationCredits')
        expressionAttributeValues[':aiConsultationCredits'] = { N: consultationCredits.toString() }
        break
    }

    updateExpression.push('lastUpdated = :timestamp')
    updateExpression.push('stripeCustomerId = :customerId')
    
    // Add purchase record
    const purchaseRecord = {
      service,
      sessionId: session.id,
      amount: session.amount_total,
      timestamp: new Date().toISOString(),
      analysisId: session.metadata?.analysisId || null
    }
    
    const purchases = currentUser.purchases || []
    purchases.push(purchaseRecord)
    updateExpression.push('purchases = :purchases')
    expressionAttributeValues[':purchases'] = { L: purchases.map((p: any) => ({ M: marshall(p) })) }

    await ddbClient.send(new UpdateItemCommand({
      TableName: dynamoDbTableName,
      Key: { userId: { S: userId } },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues
    }))

    console.log(`One-time purchase completed for user ${userId}: ${service}`)
  } catch (error) {
    console.error('Error handling one-time purchase:', error)
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId
  
  if (!userId) {
    console.error('No user ID found in subscription metadata')
    return
  }

  try {
    await ddbClient.send(new UpdateItemCommand({
      TableName: dynamoDbTableName,
      Key: { userId: { S: userId } },
      UpdateExpression: 'SET subscriptionStatus = :status, lastUpdated = :timestamp',
      ExpressionAttributeValues: {
        ':status': { S: subscription.status },
        ':timestamp': { S: new Date().toISOString() }
      }
    }))

    console.log(`Subscription updated for user ${userId}: ${subscription.status}`)
  } catch (error) {
    console.error('Error updating subscription:', error)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId
  
  if (!userId) {
    console.error('No user ID found in subscription metadata')
    return
  }

  try {
    await ddbClient.send(new UpdateItemCommand({
      TableName: dynamoDbTableName,
      Key: { userId: { S: userId } },
      UpdateExpression: 'SET subscriptionStatus = :status, lastUpdated = :timestamp',
      ExpressionAttributeValues: {
        ':status': { S: 'canceled' },
        ':timestamp': { S: new Date().toISOString() }
      }
    }))

    console.log(`Subscription canceled for user ${userId}`)
  } catch (error) {
    console.error('Error canceling subscription:', error)
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  // Handle successful payment - could update usage credits, send confirmation email, etc.
  console.log(`Payment succeeded for invoice ${invoice.id}`)
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // Handle failed payment - could notify user, update subscription status, etc.
  console.log(`Payment failed for invoice ${invoice.id}`)
} 