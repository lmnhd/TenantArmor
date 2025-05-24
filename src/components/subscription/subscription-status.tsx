"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Crown, Shield } from 'lucide-react'

interface SubscriptionData {
  subscriptionStatus: string
  plan: string
  usageCount: {
    leaseAnalyses: number
    evictionAnalyses: number
    aiConsultations: number
    totalAnalyses: number
  }
  usageLimits: {
    free: { totalAnalyses: number; leaseAnalyses: number; evictionAnalyses: number; aiConsultations: number }
    totally_secure: { totalAnalyses: number; leaseAnalyses: number; evictionAnalyses: number; aiConsultations: number }
  }
  purchasedServices?: string[]
  purchasedAnalyses?: string[]
  aiConsultationCredits?: number
  purchases?: any[]
}

export function SubscriptionStatus() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSubscriptionStatus()
  }, [])

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch('/api/user/subscription')
      if (response.ok) {
        const data = await response.json()
        setSubscription(data)
      }
    } catch (error) {
      console.error('Error fetching subscription:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Protection Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Protection Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Unable to load protection status</p>
        </CardContent>
      </Card>
    )
  }

  const getBadgeVariant = () => {
    switch (subscription.plan) {
      case 'totally_secure': return 'default'
      default: return 'outline'
    }
  }

  const getPlanDisplay = () => {
    switch (subscription.plan) {
      case 'totally_secure': return 'Totally Secure ($169/year)'
      default: return 'Free Preview'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            {subscription.plan === 'totally_secure' ? (
              <Crown className="h-5 w-5 mr-2 text-primary" />
            ) : (
              <Shield className="h-5 w-5 mr-2 text-muted-foreground" />
            )}
            Protection Status
          </div>
          <Badge variant={getBadgeVariant()}>
            {subscription.plan === 'totally_secure' ? 'TOTALLY SECURE' : 'FREE PREVIEW'}
          </Badge>
        </CardTitle>
        <CardDescription>
          {getPlanDisplay()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {subscription.plan === 'free' && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">Preview Mode</h4>
            <p className="text-sm text-blue-600 dark:text-blue-400">
              You can see analysis previews, but need to purchase for full protection reports and AI consultations.
            </p>
            {subscription.aiConsultationCredits && subscription.aiConsultationCredits > 0 && (
              <div className="mt-2 p-2 bg-green-100 dark:bg-green-900/20 rounded text-sm">
                <strong>🎉 You have {subscription.aiConsultationCredits} AI consultation credit{subscription.aiConsultationCredits > 1 ? 's' : ''} available!</strong>
              </div>
            )}
            {subscription.purchasedAnalyses && subscription.purchasedAnalyses.length > 0 && (
              <div className="mt-2 p-2 bg-green-100 dark:bg-green-900/20 rounded text-sm">
                <strong>📋 You have purchased {subscription.purchasedAnalyses.length} lease analysis{subscription.purchasedAnalyses.length > 1 ? 'es' : ''}</strong>
              </div>
            )}
            {subscription.purchasedServices && subscription.purchasedServices.includes('eviction_response') && (
              <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/20 rounded text-sm">
                <strong>🚨 Emergency Eviction Response purchased</strong>
              </div>
            )}
          </div>
        )}

        {subscription.plan === 'totally_secure' && (
          <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <h4 className="font-semibold text-green-700 dark:text-green-300 mb-2 flex items-center">
              <Crown className="h-4 w-4 mr-2" />
              Complete Protection Active
            </h4>
            <p className="text-sm text-green-600 dark:text-green-400">
              🛡️ You have unlimited access to all lease analyses, eviction responses, and AI consultations!
            </p>
          </div>
        )}

        <div className="pt-4 border-t">
          {subscription.plan === 'free' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-3 text-center">Get Protection When You Need It</h4>
                <div className="space-y-2">
                  <Link href="/pricing">
                    <Button size="sm" className="w-full">
                      📋 Complete Lease Analysis - $19
                    </Button>
                  </Link>
                  <Link href="/pricing">
                    <Button size="sm" variant="destructive" className="w-full">
                      🚨 Emergency Eviction Response - $39
                    </Button>
                  </Link>
                  <Link href="/pricing">
                    <Button size="sm" variant="outline" className="w-full">
                      💬 AI Consultation Session - $9.99
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Or get year-round protection:</p>
                <Link href="/pricing">
                  <Button variant="default" size="sm" className="w-full">
                    <Crown className="h-4 w-4 mr-2" />
                    Totally Secure - $169/year
                  </Button>
                </Link>
                <p className="text-xs text-muted-foreground mt-1">Only $14/month when paid yearly</p>
              </div>
            </div>
          )}
          
          {subscription.plan === 'totally_secure' && (
            <div className="text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                🎉 You're fully protected! Need help with something specific right now?
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Link href="/dashboard/lease-analysis">
                  <Button size="sm" variant="outline" className="w-full">
                    Analyze Lease
                  </Button>
                </Link>
                <Link href="/dashboard/eviction-response">
                  <Button size="sm" variant="outline" className="w-full">
                    Eviction Help
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 