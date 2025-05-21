"use client";

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { UploadCloud, FileText, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function UploadLeasePage() {
  const [file, setFile] = useState<File | null>(null);
  const [isConsentChecked, setIsConsentChecked] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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
    if (!file || !isConsentChecked) {
      return;
    }
    
    setIsUploading(true);
    
    // In a real app, this would be replaced with an actual API call
    // to upload the file and process it
    try {
      // Simulate upload process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate redirect to analysis page
      window.location.href = '/dashboard/lease-analysis/analysis1';
    } catch (error) {
      console.error('Upload error:', error);
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

          <Button 
            type="submit" 
            disabled={!file || !isConsentChecked || isUploading}
            className="w-full"
          >
            {isUploading ? "Processing..." : "Start Analysis"}
          </Button>
        </form>
      </Card>
    </div>
  );
} 