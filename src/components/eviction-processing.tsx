"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Upload, 
  Eye, 
  Brain, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Clock,
  MapPin,
  Gavel
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProcessingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  status: 'pending' | 'processing' | 'completed' | 'error';
  duration?: number;
  details?: string;
}

interface EvictionProcessingProps {
  file: File;
  state: string;
  formData: Record<string, any>;
  selectedLeaseId?: string | null;
  onComplete: (results: any) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

export default function EvictionProcessing({ 
  file, 
  state, 
  formData, 
  selectedLeaseId,
  onComplete, 
  onError, 
  onCancel 
}: EvictionProcessingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(120); // 2 minutes default
  const [jobId, setJobId] = useState<string | null>(null);
  const [pollingEnabled, setPollingEnabled] = useState(false);
  const [currentStepDescription, setCurrentStepDescription] = useState('Starting analysis...');

  function getStateName(stateCode: string): string {
    const states: Record<string, string> = {
      'CA': 'California',
      'NY': 'New York',
      'TX': 'Texas',
      'FL': 'Florida',
      'IL': 'Illinois',
      'PA': 'Pennsylvania',
      'OH': 'Ohio',
      'GA': 'Georgia',
      'NC': 'North Carolina',
      'MI': 'Michigan'
    };
    return states[stateCode] || stateCode;
  }

  const processingSteps: ProcessingStep[] = [
    {
      id: 'upload',
      title: 'Document Upload',
      description: 'Securely uploading your eviction notice',
      icon: Upload,
      status: 'completed'
    },
    {
      id: 'ocr',
      title: 'Text Extraction',
      description: 'Using OCR to extract text from your document',
      icon: Eye,
      status: currentStep >= 1 ? 'completed' : currentStep === 0 ? 'processing' : 'pending'
    },
    {
      id: 'analysis',
      title: 'AI Legal Analysis',
      description: 'Analyzing notice type, deadlines, and legal violations',
      icon: Brain,
      status: currentStep >= 2 ? 'completed' : currentStep === 1 ? 'processing' : 'pending'
    },
    {
      id: 'template',
      title: 'State Template Loading',
      description: `Loading ${getStateName(state)} legal templates and procedures`,
      icon: MapPin,
      status: currentStep >= 3 ? 'completed' : currentStep === 2 ? 'processing' : 'pending'
    },
    {
      id: 'generation',
      title: 'Response Generation',
      description: 'Creating personalized legal response letter',
      icon: FileText,
      status: currentStep >= 4 ? 'completed' : currentStep === 3 ? 'processing' : 'pending'
    },
    {
      id: 'review',
      title: 'Legal Review',
      description: 'Final review and formatting of your response',
      icon: Gavel,
      status: currentStep >= 5 ? 'completed' : currentStep === 4 ? 'processing' : 'pending'
    }
  ];

  useEffect(() => {
    // Start the processing workflow
    processEvictionNotice();

    // Timer for elapsed time
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Start polling if we have a job ID
    if (jobId && pollingEnabled) {
      const pollInterval = setInterval(async () => {
        try {
          const response = await fetch(`/api/eviction-response/status/${jobId}`);
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Failed to check status');
          }

          // Update progress and step description
          setProgress(data.progress || 0);
          setCurrentStepDescription(data.currentStep || 'Processing...');

          // Update current step based on progress
          const stepIndex = Math.floor((data.progress / 100) * processingSteps.length);
          setCurrentStep(Math.min(stepIndex, processingSteps.length - 1));

          // Check if completed
          if (data.status === 'completed' && data.results) {
            clearInterval(pollInterval);
            setPollingEnabled(false);
            onComplete(data.results);
          }

          // Check if failed
          if (data.status === 'failed') {
            clearInterval(pollInterval);
            setPollingEnabled(false);
            onError(data.error || 'Processing failed');
          }

        } catch (error) {
          console.error('Polling error:', error);
          clearInterval(pollInterval);
          setPollingEnabled(false);
          onError(error instanceof Error ? error.message : 'Failed to check processing status');
        }
      }, 2000); // Poll every 2 seconds

      return () => clearInterval(pollInterval);
    }
  }, [jobId, pollingEnabled, onComplete, onError, processingSteps.length]);

  async function processEvictionNotice() {
    try {
      const apiFormData = new FormData();
      apiFormData.append('file', file);
      apiFormData.append('state', state);
      apiFormData.append('additionalData', JSON.stringify(formData));
      
      // Add lease context if selected
      if (selectedLeaseId) {
        apiFormData.append('selectedLeaseId', selectedLeaseId);
      }

      const response = await fetch('/api/eviction-response/analyze', {
        method: 'POST',
        body: apiFormData,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();

      // Check if we got a job ID (polling mode) or immediate results
      if (result.jobId && result.polling) {
        console.log('[POLLING MODE] Starting job polling for:', result.jobId);
        setJobId(result.jobId);
        setPollingEnabled(true);
        setCurrentStepDescription('Job queued for processing...');
      } else if (result.noticeType) {
        // Immediate results (fallback mode)
        console.log('[IMMEDIATE MODE] Got results directly');
        // Simulate the old processing flow for immediate results
        await simulateProcessingSteps();
        onComplete(result);
      } else {
        throw new Error('Unexpected response format');
      }

    } catch (error) {
      console.error('API call failed:', error);
      onError(error instanceof Error ? error.message : 'Processing failed');
    }
  }

  // Fallback simulation for immediate results
  async function simulateProcessingSteps() {
    const steps = [
      { progress: 15, description: 'Document upload confirmed', delay: 1000 },
      { progress: 35, description: 'Extracting text with OCR', delay: 2000 },
      { progress: 60, description: 'Analyzing legal content', delay: 2000 },
      { progress: 80, description: 'Loading state templates', delay: 1000 },
      { progress: 95, description: 'Generating response', delay: 1500 },
      { progress: 100, description: 'Analysis complete', delay: 500 }
    ];

    for (const step of steps) {
      setProgress(step.progress);
      setCurrentStepDescription(step.description);
      setCurrentStep(Math.floor((step.progress / 100) * processingSteps.length));
      await new Promise(resolve => setTimeout(resolve, step.delay));
    }
  }

  function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  function getStepIcon(step: ProcessingStep) {
    const IconComponent = step.icon;
    
    if (step.status === 'completed') {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    } else if (step.status === 'processing') {
      return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
    } else if (step.status === 'error') {
      return <AlertCircle className="h-5 w-5 text-red-600" />;
    } else {
      return <IconComponent className="h-5 w-5 text-gray-400" />;
    }
  }

  function getStepStatus(step: ProcessingStep) {
    switch (step.status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800">Processing...</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Analysis in Progress
            {jobId && (
              <span className="text-sm font-mono text-muted-foreground">
                (Job: {jobId.slice(-8)})
              </span>
            )}
          </CardTitle>
          <CardDescription>
            Processing your eviction notice for {getStateName(state)}. This typically takes 1-3 minutes.
            {pollingEnabled && (
              <span className="block text-blue-600 text-sm mt-1">
                ⚡ Real-time polling enabled
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Overall Progress */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Overall Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Time Information */}
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Elapsed: {formatTime(timeElapsed)}</span>
              </div>
              {estimatedTime > timeElapsed && (
                <span>Est. remaining: {formatTime(estimatedTime - timeElapsed)}</span>
              )}
            </div>

            {/* Current Step Highlight */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                <div>
                  <h4 className="font-medium text-blue-800 dark:text-blue-300">
                    {currentStepDescription}
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    {pollingEnabled ? 'Live updates from server' : 'Simulated processing'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Processing Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Processing Steps</CardTitle>
          <CardDescription>
            Detailed breakdown of the AI analysis process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {processingSteps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-lg border transition-colors",
                  step.status === 'processing' && "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
                  step.status === 'completed' && "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
                  step.status === 'error' && "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
                  step.status === 'pending' && "bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800"
                )}
              >
                <div className="flex-shrink-0 mt-1">
                  {getStepIcon(step)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium">{step.title}</h4>
                    {getStepStatus(step)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cancel Button */}
      <div className="flex justify-center">
        <Button 
          variant="outline" 
          onClick={onCancel}
          disabled={progress > 80} // Disable near completion
        >
          Cancel Processing
        </Button>
      </div>
    </div>
  );
} 