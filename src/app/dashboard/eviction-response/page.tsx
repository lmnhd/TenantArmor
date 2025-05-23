"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  Brain, 
  Shield, 
  Clock, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  Zap
} from "lucide-react";

import EvictionUpload from "@/components/eviction-upload";
import EvictionProcessing from "@/components/eviction-processing";
import EvictionResults from "@/components/eviction-results";

type WorkflowStep = 'upload' | 'processing' | 'results' | 'error';

interface ProcessingData {
  file: File;
  state: string;
  formData: Record<string, any>;
}

export default function EvictionResponsePage() {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('upload');
  const [processingData, setProcessingData] = useState<ProcessingData | null>(null);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  function handleStartAnalysis(file: File, state: string, formData: Record<string, any>) {
    setProcessingData({ file, state, formData });
    setCurrentStep('processing');
    setError(null);
  }

  function handleProcessingComplete(analysisResults: any) {
    setResults(analysisResults);
    setCurrentStep('results');
  }

  function handleProcessingError(errorMessage: string) {
    setError(errorMessage);
    setCurrentStep('error');
  }

  function handleProcessingCancel() {
    setCurrentStep('upload');
    setProcessingData(null);
    setError(null);
  }

  function handleStartOver() {
    setCurrentStep('upload');
    setProcessingData(null);
    setResults(null);
    setError(null);
  }

  function handleRetry() {
    if (processingData) {
      setCurrentStep('processing');
      setError(null);
    }
  }

  function getStepProgress() {
    switch (currentStep) {
      case 'upload': return 0;
      case 'processing': return 50;
      case 'results': return 100;
      case 'error': return 25;
      default: return 0;
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <Brain className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">AI-Powered Eviction Response</h1>
            <p className="text-muted-foreground">
              Upload your eviction notice and get a customized legal response in minutes
            </p>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{getStepProgress()}%</span>
          </div>
          <Progress value={getStepProgress()} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Upload</span>
            <span>Processing</span>
            <span>Results</span>
          </div>
        </div>
      </div>

      {/* Information Cards */}
      {currentStep === 'upload' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-600" />
                <CardTitle className="text-lg">AI-Powered Analysis</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Our AI reads your eviction notice, identifies key information, and analyzes potential legal defenses using state-specific laws.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                <CardTitle className="text-lg">Legal Templates</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Generates responses using proven legal templates customized for your state's specific eviction laws and procedures.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">Fast Results</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Get your customized legal response in under 3 minutes, including court filing instructions and legal aid contacts.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Area */}
      <div className="space-y-6">
        {/* Upload Step */}
        {currentStep === 'upload' && (
          <EvictionUpload
            onStartAnalysis={handleStartAnalysis}
            isProcessing={false}
          />
        )}

        {/* Processing Step */}
        {currentStep === 'processing' && processingData && (
          <EvictionProcessing
            file={processingData.file}
            state={processingData.state}
            formData={processingData.formData}
            onComplete={handleProcessingComplete}
            onError={handleProcessingError}
            onCancel={handleProcessingCancel}
          />
        )}

        {/* Results Step */}
        {currentStep === 'results' && results && (
          <EvictionResults
            results={results}
            onStartOver={handleStartOver}
          />
        )}

        {/* Error Step */}
        {currentStep === 'error' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Processing Error
              </CardTitle>
              <CardDescription>
                An error occurred while processing your eviction notice
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-300">
                    {error || 'An unexpected error occurred. Please try again.'}
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <Button onClick={handleRetry}>
                    Try Again
                  </Button>
                  <Button variant="outline" onClick={handleStartOver}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Start Over
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Legal Disclaimer */}
      {currentStep === 'upload' && (
        <div className="mt-12 p-6 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                Important Legal Disclaimer
              </h3>
              <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                <p>
                  This AI-generated response is provided for informational purposes only and does not constitute legal advice. 
                  While our system uses state-specific legal templates, every situation is unique.
                </p>
                <p>
                  <strong>We strongly recommend:</strong>
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Reviewing any generated response with a qualified attorney</li>
                  <li>Contacting local legal aid organizations for free assistance</li>
                  <li>Understanding your state's specific eviction laws and deadlines</li>
                  <li>Keeping detailed records of all communications with your landlord</li>
                </ul>
                <p>
                  TenantArmor is not a law firm and cannot provide legal representation. 
                  This tool is designed to help you understand your options and draft initial responses.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 