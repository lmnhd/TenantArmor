"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Clock, AlertCircle, RefreshCw, Crown, ShoppingCart } from 'lucide-react';
import { useAuthenticatedRouting } from '@/lib/utils/auth-routing';

interface Analysis {
  analysisId: string;
  fileName: string;
  uploadTimestamp: string;
  status: string;
  overallSeverity?: string;
  summary?: string;
}

interface UserAnalysesResponse {
  analyses: Analysis[];
  count: number;
}

export default function LeaseAnalysisPage() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const { routeToUpgrade } = useAuthenticatedRouting();

  useEffect(() => {
    fetchAnalyses();
    fetchSubscription();
  }, []);

  const fetchAnalyses = async () => {
    try {
      setError(null);
      console.log('Starting fetchAnalyses...');
      const response = await fetch('/api/user-lease-analyses');
      
      console.log('API response status:', response.status);
      console.log('API response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API response error text:', errorText);
        
        if (response.status === 401) {
          throw new Error('Please sign in to view your analysis');
        }
        throw new Error(`Failed to fetch analysis: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const data: UserAnalysesResponse = await response.json();
      console.log('API response data:', data);
      setAnalyses(data.analyses);
    } catch (err) {
      console.error('Error fetching analysis:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analysis');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/user/subscription');
      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const hasFullAccess = (analysisId: string) => {
    return subscription?.plan === 'totally_secure' || 
           (subscription?.purchasedAnalyses && subscription.purchasedAnalyses.includes(analysisId));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ANALYSIS_COMPLETE':
        return 'text-green-600 dark:text-green-400';
      case 'PARTIAL_ANALYSIS_INSIGHTS_FAILED':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'AI_PROCESSING_IN_PROGRESS':
      case 'TEXT_EXTRACTION_IN_PROGRESS':
      case 'UPLOAD_COMPLETED_PENDING_PROCESSING':
        return 'text-blue-600 dark:text-blue-400';
      case 'FAILED':
      case 'AI_PROCESSING_FAILED':
      case 'TEXT_EXTRACTION_FAILED':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'ANALYSIS_COMPLETE':
        return 'Complete';
      case 'PARTIAL_ANALYSIS_INSIGHTS_FAILED':
        return 'Partial';
      case 'AI_PROCESSING_IN_PROGRESS':
        return 'Processing...';
      case 'TEXT_EXTRACTION_IN_PROGRESS':
        return 'Extracting Text...';
      case 'UPLOAD_COMPLETED_PENDING_PROCESSING':
        return 'Queued...';
      case 'FAILED':
      case 'AI_PROCESSING_FAILED':
      case 'TEXT_EXTRACTION_FAILED':
        return 'Failed';
      default:
        return status;
    }
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'High':
        return 'text-red-600 dark:text-red-400';
      case 'Medium':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'Low':
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const handlePurchaseAccess = (analysisId: string) => {
    const currentPath = `/dashboard/lease-analysis/${analysisId}`;
    routeToUpgrade(currentPath);
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Lease Analysis</h1>
          <Button asChild>
            <Link href="/dashboard/lease-analysis/upload">
              <Plus className="mr-2 h-4 w-4" />
              Upload New Lease
            </Link>
          </Button>
        </div>
        <div className="flex justify-center items-center py-10">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Loading your analysis...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Lease Analysis</h1>
          <Button asChild>
            <Link href="/dashboard/lease-analysis/upload">
              <Plus className="mr-2 h-4 w-4" />
              Upload New Lease
            </Link>
          </Button>
        </div>
        <div className="text-center py-10">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-1">Failed to load analysis</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchAnalyses}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Lease Analysis</h1>
        <Button asChild>
          <Link href="/dashboard/lease-analysis/upload">
            <Plus className="mr-2 h-4 w-4" />
            Upload New Lease
          </Link>
        </Button>
      </div>

      <div className="bg-muted/50 p-5 rounded-lg flex items-start space-x-4">
        <AlertCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="text-sm font-medium">How Lease Analysis Works</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Upload your lease agreement and our AI will analyze it for potentially problematic clauses, 
            unusual terms, and help you understand your rights and obligations as a tenant.
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Your Analysis History</h2>
        {analyses.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {analyses.map((analysis) => {
              const isCompleted = analysis.status === 'ANALYSIS_COMPLETE' || analysis.status === 'PARTIAL_ANALYSIS_INSIGHTS_FAILED';
              const hasAccess = hasFullAccess(analysis.analysisId);
              const isProcessing = !isCompleted && !analysis.status.includes('FAILED');
              
              return (
                <Card key={analysis.analysisId} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center justify-between">
                      <div className="flex items-center min-w-0">
                        <FileText className="mr-2 h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">{analysis.fileName}</span>
                      </div>
                      {hasAccess && (
                        <Crown className="h-4 w-4 text-primary flex-shrink-0" />
                      )}
                    </CardTitle>
                    <CardDescription className="flex items-center">
                      <Clock className="mr-1 h-4 w-4" />
                      {new Date(analysis.uploadTimestamp).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Status:</p>
                        <p className={`text-sm font-medium flex items-center ${getStatusColor(analysis.status)}`}>
                          {isProcessing && <RefreshCw className="h-3 w-3 animate-spin mr-1" />}
                          {getStatusDisplay(analysis.status)}
                        </p>
                      </div>
                      {isCompleted && analysis.overallSeverity && (
                        <div>
                          <p className="text-sm font-medium">Risk Level:</p>
                          <p className={`text-sm font-medium ${getSeverityColor(analysis.overallSeverity)}`}>
                            {analysis.overallSeverity}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {!hasAccess && isCompleted && (
                      <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded text-xs">
                        <Badge variant="outline" className="text-xs">
                          Preview Access Only
                        </Badge>
                        <p className="text-muted-foreground mt-1">
                          Purchase full access to see detailed analysis
                        </p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="bg-muted/50 pt-2 space-x-2">
                    {isCompleted ? (
                      <>
                        <Button asChild variant="default" className="flex-1">
                          <Link href={`/dashboard/lease-analysis/${analysis.analysisId}`}>
                            {hasAccess ? 'View Analysis' : 'View Preview'}
                          </Link>
                        </Button>
                        {!hasAccess && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handlePurchaseAccess(analysis.analysisId)}
                            className="flex-shrink-0"
                          >
                            <ShoppingCart className="h-3 w-3 mr-1" />
                            $19
                          </Button>
                        )}
                      </>
                    ) : analysis.status.includes('FAILED') ? (
                      <Button disabled className="w-full">
                        Analysis Failed
                      </Button>
                    ) : (
                      <Button disabled className="w-full">
                        {getStatusDisplay(analysis.status)}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 border-2 border-dashed rounded-lg">
            <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-1">No analyses yet</h3>
            <p className="text-muted-foreground mb-4">Upload your first lease for analysis</p>
            <Button asChild>
              <Link href="/dashboard/lease-analysis/upload">
                <Plus className="mr-2 h-4 w-4" />
                Upload Lease
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 