"use client";

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { UploadCloud, FileText, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from 'next/navigation';

export default function UploadLeasePage() {
  const [file, setFile] = useState<File | null>(null);
  const [userSelectedState, setUserSelectedState] = useState<string>("");
  const [isConsentChecked, setIsConsentChecked] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const router = useRouter();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0]);
      }
    }
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file || !isConsentChecked || !userSelectedState) {
      if (!userSelectedState) setUploadError("Please specify the state/jurisdiction for the lease.");
      else if (!file) setUploadError("Please select a file to upload.");
      else if (!isConsentChecked) setUploadError("Please agree to the terms and privacy policy.");
      return;
    }
    
    setUploadError(null);
    setIsUploading(true);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userSelectedState', userSelectedState);

    try {
      const response = await fetch('/api/lease-upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Upload failed with status: ${response.status}`);
      }

      const result = await response.json();
      
      // Assuming the API returns an analysisId
      if (result.analysisId) {
        router.push(`/dashboard/lease-analysis/${result.analysisId}`);
      } else {
        // Fallback or if analysis ID is not immediately available and polling is needed from results page
        // For now, let's assume direct navigation or handle specific cases as requirements evolve.
        console.warn('Analysis ID not found in response, redirecting to general history or a pending page.');
        // router.push('/dashboard/lease-analysis'); // Or a page showing pending analysis
        // For now, if no analysisId, treat as error for simplicity
        throw new Error('Analysis ID not returned from the API.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'An unknown error occurred during upload.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Upload Your Lease</h1>
        <p className="text-muted-foreground mt-2">
          Upload your lease document for AI-powered analysis
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="lease-document" className="text-base">
              Lease Document (PDF)
            </Label>
            
            <div 
              {...getRootProps()} 
              className="mt-2 border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <input {...getInputProps()} id="lease-document" />
              <UploadCloud className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              
              {file ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="font-medium">{file.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Click or drag to replace
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="font-medium">
                    {isDragActive ? "Drop the file here" : "Drag and drop your lease"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    or click to browse files
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    PDF files up to 10MB
                  </p>
                </div>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="state-jurisdiction" className="text-base">
              State / Jurisdiction of Lease
            </Label>
            <Input 
              id="state-jurisdiction"
              type="text"
              value={userSelectedState}
              onChange={(e) => setUserSelectedState(e.target.value)}
              placeholder="E.g., California, New York"
              className="mt-2"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Specify the state or jurisdiction the lease agreement pertains to. This helps tailor the analysis.
            </p>
          </div>

          <div className="flex gap-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Important Notice</p>
              <p className="text-muted-foreground mt-1">
                Our AI will analyze your document to identify potential legal issues, but this is not legal advice. 
                Always consult with a qualified attorney for specific legal concerns.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox 
              id="consent" 
              checked={isConsentChecked}
              onCheckedChange={(checked) => setIsConsentChecked(checked === true)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="consent"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I understand and agree to the{" "}
                <Link href="/terms" className="text-primary underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-primary underline">
                  Privacy Policy
                </Link>
              </Label>
            </div>
          </div>

          {uploadError && (
            <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-md text-sm text-red-700 dark:text-red-300 flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          <Button 
            type="submit" 
            disabled={!file || !isConsentChecked || !userSelectedState || isUploading}
            className="w-full"
          >
            {isUploading ? "Processing..." : "Start Analysis"}
          </Button>
        </form>
      </Card>
    </div>
  );
} 