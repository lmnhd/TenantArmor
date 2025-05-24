import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import Stripe from 'stripe'

// Add fallback for build environments
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_for_build'

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-04-30.basil',
})

// Define our pricing structure
const PRICE_CONFIG = {
  // One-time purchases
  'price_1RS6S4GExpJS4KTY0N3QCPt8': { // Emergency Eviction Response - $39
    type: 'payment',
    service: 'eviction_response'
  },
  'price_1RS6UXGExpJS4KTYR8qNqdDZ': { // Complete Lease Analysis - $19
    type: 'payment', 
    service: 'lease_analysis'
  },
  'price_1RS6WLGExpJS4KTYWqEqvWUN': { // AI Consultation Session - $9.99
    type: 'payment',
    service: 'ai_consultation'
  },
  // Subscription
  'price_1RS73sGExpJS4KTYPyUnLykF': { // Totally Secure - $169/year
    type: 'subscription',
    service: 'totally_secure'
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check if we have actual Stripe keys before proceeding
    if (stripeSecretKey === 'sk_test_placeholder_for_build') {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { priceId, analysisId } = await req.json()

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID is required' }, { status: 400 })
    }

    // Get price configuration
    const priceConfig = PRICE_CONFIG[priceId as keyof typeof PRICE_CONFIG]
    if (!priceConfig) {
      return NextResponse.json({ error: 'Invalid price ID' }, { status: 400 })
    }

    // Prepare metadata for tracking purchases
    const metadata: Record<string, string> = {
      userId,
      service: priceConfig.service,
      purchaseType: priceConfig.type
    }

    // Add analysis ID for lease analysis purchases
    if (priceConfig.service === 'lease_analysis' && analysisId) {
      metadata.analysisId = analysisId
    }

    // Create checkout session with proper mode
    const session = await stripe.checkout.sessions.create({
      mode: priceConfig.type === 'subscription' ? 'subscription' : 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pricing?canceled=true`,
      metadata,
      client_reference_id: userId,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
} 