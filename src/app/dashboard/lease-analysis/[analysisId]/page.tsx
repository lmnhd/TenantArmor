"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import ClauseCard from '../components/ClauseCard';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { LeaseAnalysis, AIAnalysisResults, Issue, NextStep, Clause } from '@/lib/types';
import Link from 'next/link';
import { ArrowLeft, Download, Printer, Flag, AlertTriangle, Info, CheckCircle2, RefreshCw, MessageCircle } from 'lucide-react';
import { ChatDrawer } from '../components/ChatDrawer';

const POLLING_INTERVAL = 5000; // 5 seconds
const MAX_POLLS = 360; // 5 seconds * 360 polls = 30 minutes

// Helper to determine badge color based on severity
const getSeverityBadgeClass = (severity: 'High' | 'Medium' | 'Low' | 'Consider' | undefined) => {
  if (!severity) return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200';
  switch (severity) {
    case 'High':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
    case 'Medium':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
    case 'Low':
    case 'Consider':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200';
  }
};

// Helper to determine status icon and color
const getStatusVisuals = (status: LeaseAnalysis['status'] | undefined) => {
  if (!status) return { Icon: AlertTriangle, color: 'text-gray-500', message: 'Status unknown' };
  switch (status) {
    case 'UPLOAD_PENDING':
    case 'UPLOAD_URL_GENERATED':
    case 'UPLOAD_COMPLETED_PENDING_PROCESSING':
    case 'TEXT_EXTRACTION_IN_PROGRESS':
    case 'TEXT_EXTRACTION_COMPLETE':
    case 'AI_PROCESSING_IN_PROGRESS':
      return { Icon: RefreshCw, color: 'text-blue-500 animate-spin', message: 'Analysis in progress...' };
    case 'ANALYSIS_COMPLETE':
      return { Icon: CheckCircle2, color: 'text-green-500', message: 'Analysis Complete' };
    case 'PARTIAL_ANALYSIS_INSIGHTS_FAILED':
      return { Icon: AlertTriangle, color: 'text-yellow-500', message: 'Partial Analysis: Insights Failed' };
    case 'TEXT_EXTRACTION_FAILED':
    case 'AI_PROCESSING_FAILED':
    case 'FAILED':
      return { Icon: AlertTriangle, color: 'text-red-500', message: 'Analysis Failed' };
    default:
      return { Icon: Info, color: 'text-gray-500', message: `Status: ${status}` };
  }
};

const processingStates: LeaseAnalysis['status'][] = [
    "UPLOAD_COMPLETED_PENDING_PROCESSING",
    "TEXT_EXTRACTION_IN_PROGRESS",
    "TEXT_EXTRACTION_COMPLETE",
    "AI_PROCESSING_IN_PROGRESS"
];

export default function LeaseAnalysisResultPage() {
  const params = useParams();
  const analysisId = Array.isArray(params.analysisId) ? params.analysisId[0] : params.analysisId;
  const [analysisData, setAnalysisData] = useState<LeaseAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pollingCount, setPollingCount] = useState(0);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const fetchDataRef = useCallback(async (isPolling: boolean = false) => {
    if (!analysisId) {
      setError("Analysis ID is missing.");
      setLoading(false);
      return;
    }

    if (!isPolling) {
        setLoading(true);
        setError(null);
        setPollingCount(0);
    }

    try {
      const response = await fetch(`/api/get-analysis-details?id=${analysisId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch analysis data: ${response.statusText}`);
      }
      const data: LeaseAnalysis = await response.json();
      setAnalysisData(data);
      
      if (processingStates.includes(data.status) && pollingCount < MAX_POLLS) {
        // setTimeout is handled by useEffect dependency change
      } else if (pollingCount >= MAX_POLLS && processingStates.includes(data.status)) {
        setError("Analysis is taking longer than expected. Please check back later or contact support.");
        setLoading(false);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error("Error fetching analysis data:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
      setAnalysisData(null);
      setLoading(false);
    }
  }, [analysisId, pollingCount]);

  useEffect(() => {
    fetchDataRef();
  }, [fetchDataRef]);

  useEffect(() => {
    let timerId: NodeJS.Timeout;
    if (analysisData) {
        if (processingStates.includes(analysisData.status) && pollingCount < MAX_POLLS) {
            timerId = setTimeout(() => {
                setPollingCount(prev => prev + 1);
                fetchDataRef(true); // Indicate it's a polling attempt
            }, POLLING_INTERVAL);
        }
    }
    return () => clearTimeout(timerId);
  }, [analysisData, pollingCount, fetchDataRef]);

  const handleRetry = () => {
    fetchDataRef();
  };

  const handleDownloadPdf = async () => {
    if (!analysisData || !analysisData.s3Bucket || !analysisData.s3Key) {
      setError("S3 information is missing, cannot download PDF.");
      return;
    }
    setDownloadingPdf(true);
    setError(null);
    try {
      const response = await fetch(`/api/get-download-url?id=${analysisId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to get download URL: ${response.statusText}`);
      }
      const { downloadUrl, fileName } = await response.json();

      if (downloadUrl) {
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', fileName || analysisData.fileName || 'lease-document.pdf');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        throw new Error("Download URL was not provided by the API.");
      }
    } catch (err) {
      console.error("Error downloading PDF:", err);
      setError(err instanceof Error ? err.message : "Could not download the PDF.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading && !analysisData) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <RefreshCw className="h-8 w-8 text-primary animate-spin" />
        <p className="ml-2 text-lg">Loading analysis results...</p>
      </div>
    );
  }

  if (error && !analysisData) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Error Loading Analysis</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={handleRetry}>
                Try Again
            </Button>
        </div>
    );
  }
  
  if (!analysisData) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center">
            <Info className="h-12 w-12 text-gray-500 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No Data Available</h2>
            <p className="text-muted-foreground mb-4">Could not retrieve analysis data. This might be a temporary issue.</p>
            <Button onClick={handleRetry}>Try Again</Button>
        </div>
    );
  }

  const { Icon: StatusIcon, color: statusColor, message: statusMessage } = getStatusVisuals(analysisData.status);
  const analysisResults = analysisData.analysisResults as AIAnalysisResults | undefined;
  const isProcessing = processingStates.includes(analysisData.status);
  const canDownload = !!(analysisData.s3Bucket && analysisData.s3Key);
  const showResults = (analysisData.status === 'ANALYSIS_COMPLETE' || analysisData.status === 'PARTIAL_ANALYSIS_INSIGHTS_FAILED') && analysisResults;

  return (
    <div className="space-y-8 print:space-y-4">
      <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:justify-between sm:items-start mb-6 print:hidden">
        <div>
          <Link
            href="/dashboard/lease-analysis"
            className="inline-flex items-center text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to all analyses
          </Link>
          <h1 className="text-3xl font-bold">{analysisData.fileName || 'Lease Analysis'}</h1>
          <p className="text-muted-foreground">
            Uploaded on {new Date(analysisData.uploadTimestamp).toLocaleDateString()}
            {analysisData.lastUpdatedTimestamp && ` | Last updated: ${new Date(analysisData.lastUpdatedTimestamp).toLocaleString()}`}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {showResults && !isProcessing && analysisId && (
             <ChatDrawer 
                analysisId={analysisId || ''} 
                analysisFileName={analysisData.fileName}
                triggerButton={
                    <Button variant="outline" size="sm">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Ask AI Assistant
                    </Button>
                }
            />
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDownloadPdf} 
            disabled={!canDownload || downloadingPdf || isProcessing}
          >
            {downloadingPdf ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
            <Download className="h-4 w-4 mr-2" />
            )}
            {downloadingPdf ? 'Downloading...' : 'Download PDF'}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handlePrint}
            disabled={isProcessing}
          >
            <Printer className="h-4 w-4 mr-2" />
            Print Results
          </Button>
        </div>
      </div>

      {/* Status and Progress Section */}
      <Card className="print:shadow-none print:border-none">
        <CardHeader>
          <CardTitle className="flex items-center">
            <StatusIcon className={`h-6 w-6 mr-2 ${statusColor}`} />
            Analysis Status
          </CardTitle>
          <CardDescription>{statusMessage}</CardDescription>
        </CardHeader>
        {isProcessing && (
          <CardContent>
            <div className="w-full bg-muted rounded-full h-2.5 mb-2">
              <div 
                className="bg-primary h-2.5 rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${(pollingCount / MAX_POLLS) * 100}%` }}
              ></div>
            </div>
            <p className="text-sm text-muted-foreground">
              Polling for updates... (Attempt {pollingCount} of {MAX_POLLS})
              Your analysis is underway. This page will automatically update.
            </p>
          </CardContent>
        )}
        {analysisData.status === 'FAILED' && analysisData.errorDetails && (
            <CardContent>
                <p className="text-red-600 dark:text-red-400 text-sm">
                    <strong>Error Details:</strong> {analysisData.errorDetails}
                </p>
            </CardContent>
        )}
         {analysisData.status === 'PARTIAL_ANALYSIS_INSIGHTS_FAILED' && analysisData.errorDetails && (
            <CardContent>
                <p className="text-yellow-600 dark:text-yellow-400 text-sm">
                    <strong>Issue:</strong> {analysisData.errorDetails}
                </p>
                 <p className="text-sm text-muted-foreground mt-1">
                    The initial lease breakdown was successful, but we encountered an issue generating actionable insights and next steps.
                    Key clauses and issues are still available.
                </p>
            </CardContent>
        )}
      </Card>

      {/* Conditionally render analysis results */}
      {showResults && analysisResults ? (
        <>
          {/* Summary Section */}
          {analysisResults.summary && (
            <Card className="print:shadow-none print:border-none">
              <CardHeader>
                <CardTitle>Executive Summary</CardTitle>
                {analysisResults.overallSeverity && (
                     <CardDescription>
                        Overall Document Sentiment: 
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityBadgeClass(analysisResults.overallSeverity)}`}>
                            {analysisResults.overallSeverity}
                        </span>
                    </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{analysisResults.summary}</p>
              </CardContent>
            </Card>
          )}

          {/* Critical Issues Section (if any from summary level) */}
          {analysisResults.criticalIssues && analysisResults.criticalIssues.length > 0 && (
            <Card className="print:shadow-none print:border-none border-l-4 border-red-500">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                  Critical Issues Identified
                </CardTitle>
                <CardDescription>
                  These are high-priority items that require immediate attention.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysisResults.criticalIssues.map((issue: Issue, index: number) => (
                  <div key={index} className="p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
                    <p className="font-semibold text-red-700 dark:text-red-300">{issue.description}</p>
                    {issue.recommendation && <p className="text-sm text-muted-foreground mt-1"><strong>Recommendation:</strong> {issue.recommendation}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          
          {/* Actionable Insights & Next Steps Section */}
          {analysisResults.actionableInsights && (
            <Card className="print:shadow-none print:border-none">
              <CardHeader>
                <CardTitle>Actionable Insights & Next Steps</CardTitle>
                {analysisResults.actionableInsights.overallRecommendation && (
                     <CardDescription>{analysisResults.actionableInsights.overallRecommendation}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {analysisResults.actionableInsights.nextSteps && analysisResults.actionableInsights.nextSteps.length > 0 ? (
                    analysisResults.actionableInsights.nextSteps.map((step: NextStep, index: number) => (
                    <div key={index} className="p-3 border rounded-md dark:border-gray-700">
                        <div className="flex justify-between items-start">
                            <h4 className="font-semibold">{step.step}</h4>
                            <span 
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityBadgeClass(step.importance)}`}
                            >
                                {step.importance}
                            </span>
                        </div>
                        {step.details && <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{step.details}</p>}
                    </div>
                    ))
                ) : (
                    <p className="text-muted-foreground">No specific next steps provided by the AI.</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Clause by Clause Breakdown Section */}
          {analysisResults.clauses && analysisResults.clauses.length > 0 && (
            <Card className="print:shadow-none print:border-none">
              <CardHeader>
                <CardTitle>Clause by Clause Breakdown</CardTitle>
                <CardDescription>Detailed analysis of individual lease clauses.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {analysisResults.clauses.map((clause: Clause, index: number) => (
                  <ClauseCard key={index} clause={clause} />
                ))}
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        !isProcessing && (
          <Card className="print:shadow-none print:border-none">
            <CardHeader>
              <CardTitle>Analysis Results Unavailable</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {analysisData.status === 'FAILED' ? 'The analysis process failed. Please check the error details above.' :
                 analysisData.status === 'PARTIAL_ANALYSIS_INSIGHTS_FAILED' ? 'Partial results are available, but some insights could not be generated. Check details above.' :
                 'The analysis results are not yet available or could not be loaded. If processing has finished, try refreshing.'}
              </p>
            </CardContent>
          </Card>
        )
      )}

      {/* Fallback if analysisData exists but status isn't one that shows results and isn't processing */}
      {!showResults && !isProcessing && analysisData.status !== 'FAILED' && analysisData.status !== 'PARTIAL_ANALYSIS_INSIGHTS_FAILED' && (
         <Card className="print:shadow-none print:border-none">
            <CardHeader>
              <CardTitle>Analysis Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                The current status of this analysis is: <strong>{analysisData.status}</strong>. 
                Results will be displayed once the analysis is complete.
              </p>
            </CardContent>
          </Card>
      )}

      {/* Disclaimer Section - Placed at the very bottom */}
      <Card className="print:shadow-none print:border-none bg-muted/50 print:mt-8">
        <CardContent className="pt-6">
            <div className="flex space-x-3 items-start">
                <Flag className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                    <h3 className="font-medium">Disclaimer</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        This analysis is provided for informational purposes only and does not constitute legal advice. 
                        For specific legal guidance regarding your lease, please consult with a qualified attorney familiar 
                        with landlord-tenant laws in your jurisdiction.
                    </p>
                </div>
            </div>
        </CardContent>
      </Card>

    </div>
  );
}
