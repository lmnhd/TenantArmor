"use client"

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, X, Zap, Shield, MessageCircle, Crown, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

const oneTimePurchases = [
  {
    name: 'Emergency Eviction Response',
    price: '$39',
    icon: AlertTriangle,
    description: 'Complete crisis response when facing eviction',
    features: [
      'Full eviction response strategy',
      'Legal timeline & deadline guidance',
      'State-specific tenant rights analysis',
      '2 AI consultation sessions (2 days each)',
      'Document download (PDF)',
      'Priority 24-hour processing',
      'Know your rights immediately'
    ],
    limitations: [],
    stripePriceId: 'price_1RS6S4GExpJS4KTY0N3QCPt8',
    urgent: true,
  },
  {
    name: 'Complete Lease Analysis',
    price: '$19',
    icon: Shield,
    description: 'Protect yourself before signing with full lease review',
    features: [
      'Complete executive summary',
      'All critical issues identified',
      'Detailed clause-by-clause breakdown',
      'Actionable insights & tenant protections',
      '1 AI consultation session (2 days)',
      'Document download (PDF)',
      'Know exactly what you\'re signing'
    ],
    limitations: [],
    stripePriceId: 'price_1RS6UXGExpJS4KTYR8qNqdDZ',
    popular: true,
  },
  {
    name: 'AI Consultation Session',
    price: '$9.99',
    icon: MessageCircle,
    description: 'Expert AI legal consultation for your tenant questions',
    features: [
      '2 days of AI consultation access',
      'Tenant rights guidance',
      'Document review assistance',
      'Follow-up strategy recommendations',
      'Personalized legal advice'
    ],
    limitations: [],
    stripePriceId: 'price_1RS6WLGExpJS4KTYWqEqvWUN',
    popular: false,
  },
]

const subscriptionPlans = [
  {
    name: 'Free Preview',
    price: '$0',
    period: 'forever',
    description: 'Try TenantArmor with limited tenant protection previews',
    features: [
      'Lease analysis preview (summary only)',
      'Eviction response preview (timeline only)',
      'Overall risk assessment',
      'Issues count (but not details)',
    ],
    limitations: [
      'No detailed clause breakdowns',
      'No actionable tenant protections',
      'No consultations',
      'No downloads',
    ],
    stripePriceId: null,
    popular: false,
  },
  {
    name: 'Totally Secure',
    price: '$169',
    period: 'year',
    description: 'Complete tenant protection for the entire year',
    features: [
      'Unlimited lease analyses',
      'Unlimited eviction response support',
      'Unlimited AI consultation sessions',
      'Priority processing (24-hour)',
      'Document downloads (PDF)',
      'Email support',
      'Complete tenant rights protection',
      'Year-round peace of mind'
    ],
    limitations: [],
    stripePriceId: 'price_1RS73sGExpJS4KTYPyUnLykF',
    popular: true,
    yearlyDiscount: true,
  },
]

export default function PricingPage() {
  const { isSignedIn } = useUser()
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const handlePurchase = async (priceId: string | null) => {
    if (!priceId) return // Free plan
    
    setIsLoading(priceId)
    
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      })
      
      const { url } = await response.json()
      
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">Protect Your Rights as a Tenant</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Get expert legal guidance when you need it most - before signing a lease or facing eviction
        </p>
        <div className="bg-primary/10 p-4 rounded-lg max-w-2xl mx-auto">
          <p className="text-sm text-muted-foreground">
            <strong>🛡️ Tenant-Focused:</strong> Every service designed to protect and empower renters with legal knowledge and actionable strategies
          </p>
        </div>
      </div>

      {/* One-Time Purchases Section */}
      <div className="mb-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">Get Help When You Need It</h2>
          <p className="text-muted-foreground">
            One-time purchases for immediate tenant protection and legal guidance
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {oneTimePurchases.map((item) => (
            <Card key={item.name} className={`relative ${item.popular ? 'border-primary shadow-lg scale-105' : ''} ${item.urgent ? 'border-red-500 shadow-lg' : ''}`}>
              {item.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-sm font-medium px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              
              {item.urgent && (
                <div className="absolute -top-3 right-4">
                  <span className="bg-red-500 text-white text-xs font-medium px-2 py-1 rounded-full flex items-center">
                    <Zap className="h-3 w-3 mr-1" />
                    Crisis
                  </span>
                </div>
              )}
              
              <CardHeader className="text-center">
                <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-4">
                  <item.icon className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">{item.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-3xl font-bold">{item.price}</span>
                  <span className="text-muted-foreground"> one-time</span>
                </div>
                <CardDescription className="mt-2">{item.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div>
                  <ul className="space-y-2">
                    {item.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <Check className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
              
              <CardFooter>
                {isSignedIn ? (
                  <Button 
                    className="w-full" 
                    variant={item.urgent ? 'destructive' : item.popular ? 'default' : 'outline'}
                    onClick={() => handlePurchase(item.stripePriceId)}
                    disabled={isLoading === item.stripePriceId}
                  >
                    {isLoading === item.stripePriceId ? 'Loading...' : `Get ${item.name}`}
                  </Button>
                ) : (
                  <Link href="/sign-up" className="w-full">
                    <Button className="w-full" variant={item.urgent ? 'destructive' : item.popular ? 'default' : 'outline'}>
                      Sign Up to Purchase
                    </Button>
                  </Link>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Subscription Plans Section */}
      <div className="mb-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">Year-Round Protection</h2>
          <p className="text-muted-foreground">
            Complete tenant protection subscription for ongoing peace of mind
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {subscriptionPlans.map((plan) => (
            <Card key={plan.name} className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-sm font-medium px-3 py-1 rounded-full flex items-center">
                    <Crown className="h-3 w-3 mr-1" />
                    Best Value
                  </span>
                </div>
              )}
              
              {plan.yearlyDiscount && (
                <div className="absolute -top-3 right-4">
                  <span className="bg-green-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                    Only $14/month!
                  </span>
                </div>
              )}
              
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">/{plan.period}</span>
                  {plan.yearlyDiscount && (
                    <div className="text-sm text-muted-foreground mt-1">
                      Only $14.08/month when paid yearly
                    </div>
                  )}
                </div>
                <CardDescription className="mt-2">{plan.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2 text-green-600">Included:</h4>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <Check className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {plan.limitations.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 text-muted-foreground">Limitations:</h4>
                    <ul className="space-y-2">
                      {plan.limitations.map((limitation, index) => (
                        <li key={index} className="flex items-center">
                          <X className="h-4 w-4 text-muted-foreground mr-2 flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">{limitation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
              
              <CardFooter>
                {plan.stripePriceId ? (
                  isSignedIn ? (
                    <Button 
                      className="w-full" 
                      variant={plan.popular ? 'default' : 'outline'}
                      onClick={() => handlePurchase(plan.stripePriceId)}
                      disabled={isLoading === plan.stripePriceId}
                    >
                      {isLoading === plan.stripePriceId ? 'Loading...' : `Get ${plan.name} Protection`}
                    </Button>
                  ) : (
                    <Link href="/sign-up" className="w-full">
                      <Button className="w-full" variant={plan.popular ? 'default' : 'outline'}>
                        Sign Up for Protection
                      </Button>
                    </Link>
                  )
                ) : (
                  isSignedIn ? (
                    <Link href="/dashboard" className="w-full">
                      <Button className="w-full" variant="outline">
                        Access Free Preview
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/sign-up" className="w-full">
                      <Button className="w-full" variant="outline">
                        Try Free Preview
                      </Button>
                    </Link>
                  )
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Value Comparison Section */}
      <div className="bg-muted/30 p-8 rounded-lg mb-16">
        <h3 className="text-2xl font-bold text-center mb-6">Why TenantArmor Saves You Money</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-red-500 mb-2">$2,000+</div>
            <p className="text-sm text-muted-foreground">Average cost of wrongful eviction</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-500 mb-2">$500+</div>
            <p className="text-sm text-muted-foreground">Average security deposit lost to bad leases</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-500 mb-2">$39-169</div>
            <p className="text-sm text-muted-foreground">TenantArmor protection cost</p>
          </div>
        </div>
        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            One consultation with a lawyer costs $300-500/hour. Get expert AI-powered legal guidance for a fraction of the cost.
          </p>
        </div>
      </div>

      <div className="text-center mt-16">
        <p className="text-muted-foreground mb-4">
          <strong>Facing eviction?</strong> Get Emergency Response. <strong>Signing a lease?</strong> Get Complete Analysis. <strong>Need ongoing protection?</strong> Get Totally Secure.
        </p>
        <p className="text-sm text-muted-foreground">
          Questions about tenant rights? <Link href="/contact" className="text-primary hover:underline">Contact us</Link>
        </p>
      </div>
    </div>
  )
} 