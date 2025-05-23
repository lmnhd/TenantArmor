"use client";

import { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadCloud, FileText, AlertCircle, Camera, Image, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from 'next/navigation';

// US States with their codes - only active states for now
const US_STATES = [
  // { code: 'AL', name: 'Alabama' },
  // { code: 'AK', name: 'Alaska' },
  // { code: 'AZ', name: 'Arizona' },
  // { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  // { code: 'CO', name: 'Colorado' },
  // { code: 'CT', name: 'Connecticut' },
  // { code: 'DE', name: 'Delaware' },
  // { code: 'FL', name: 'Florida' },
  // { code: 'GA', name: 'Georgia' },
  // { code: 'HI', name: 'Hawaii' },
  // { code: 'ID', name: 'Idaho' },
  // { code: 'IL', name: 'Illinois' },
  // { code: 'IN', name: 'Indiana' },
  // { code: 'IA', name: 'Iowa' },
  // { code: 'KS', name: 'Kansas' },
  // { code: 'KY', name: 'Kentucky' },
  // { code: 'LA', name: 'Louisiana' },
  // { code: 'ME', name: 'Maine' },
  // { code: 'MD', name: 'Maryland' },
  // { code: 'MA', name: 'Massachusetts' },
  // { code: 'MI', name: 'Michigan' },
  // { code: 'MN', name: 'Minnesota' },
  // { code: 'MS', name: 'Mississippi' },
  // { code: 'MO', name: 'Missouri' },
  // { code: 'MT', name: 'Montana' },
  // { code: 'NE', name: 'Nebraska' },
  // { code: 'NV', name: 'Nevada' },
  // { code: 'NH', name: 'New Hampshire' },
  // { code: 'NJ', name: 'New Jersey' },
  // { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  // { code: 'NC', name: 'North Carolina' },
  // { code: 'ND', name: 'North Dakota' },
  // { code: 'OH', name: 'Ohio' },
  // { code: 'OK', name: 'Oklahoma' },
  // { code: 'OR', name: 'Oregon' },
  // { code: 'PA', name: 'Pennsylvania' },
  // { code: 'RI', name: 'Rhode Island' },
  // { code: 'SC', name: 'South Carolina' },
  // { code: 'SD', name: 'South Dakota' },
  // { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  // { code: 'UT', name: 'Utah' },
  // { code: 'VT', name: 'Vermont' },
  // { code: 'VA', name: 'Virginia' },
  // { code: 'WA', name: 'Washington' },
  // { code: 'WV', name: 'West Virginia' },
  // { code: 'WI', name: 'Wisconsin' },
  // { code: 'WY', name: 'Wyoming' },
  // { code: 'DC', name: 'District of Columbia' }
];

interface UploadedFile {
  file: File;
  preview?: string;
  type: 'pdf' | 'image';
}

export default function UploadLeasePage() {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [userSelectedState, setUserSelectedState] = useState<string>("");
  const [isConsentChecked, setIsConsentChecked] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isCameraSupported, setIsCameraSupported] = useState(false);
  const router = useRouter();

  // Check for camera support on component mount
  useEffect(() => {
    const checkCameraSupport = async () => {
      try {
        if (typeof navigator !== 'undefined' && 
            navigator.mediaDevices && 
            typeof navigator.mediaDevices.getUserMedia === 'function') {
          // Try to enumerate devices to confirm camera access
          const devices = await navigator.mediaDevices.enumerateDevices();
          const hasVideoInput = devices.some(device => device.kind === 'videoinput');
          setIsCameraSupported(hasVideoInput);
        }
      } catch (error) {
        console.log('Camera support check failed:', error);
        setIsCameraSupported(false);
      }
    };
    checkCameraSupport();
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Handle HEIC/HEIF format conversion for iOS devices
    if (file.type === 'image/heic' || file.type === 'image/heif' || 
        file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
      
      alert('HEIC/HEIF format detected. Converting to JPEG for better compatibility...');
      convertHeicToJpeg(file);
      return;
    }

    const fileType = file.type.startsWith('image/') ? 'image' : 'pdf';
    
    if (fileType === 'image') {
      const preview = URL.createObjectURL(file);
      setUploadedFile({ file, preview, type: fileType });
    } else {
      setUploadedFile({ file, type: fileType });
    }
  }, []);

  // Helper function to convert HEIC/HEIF to JPEG
  const convertHeicToJpeg = useCallback(async (file: File) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = document.createElement('img');
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        const maxWidth = 2048;
        const maxHeight = 2048;
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;
          if (width > height) {
            width = maxWidth;
            height = maxWidth / aspectRatio;
          } else {
            height = maxHeight;
            width = maxHeight * aspectRatio;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const convertedFile = new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            
            const preview = URL.createObjectURL(convertedFile);
            setUploadedFile({ file: convertedFile, preview, type: 'image' });
          } else {
            alert('Failed to convert HEIC file. Please try using camera capture instead.');
          }
        }, 'image/jpeg', 0.85);
        
        URL.revokeObjectURL(url);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        alert('Unable to process HEIC file. Please try using camera capture instead.');
      };
      
      img.src = url;
    } catch (error) {
      console.error('HEIC conversion error:', error);
      alert('Failed to convert HEIC file. Please try using camera capture instead.');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.heic', '.heif'],
      'application/pdf': ['.pdf']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
    disabled: isUploading
  });

  const handleCameraCapture = async () => {
    if (!isCameraSupported) {
      alert('Camera is not supported on this device');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera for document scanning
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      
      // Create video element
      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      video.playsInline = true;
      
      // Create canvas for capture
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      // Create modal overlay for camera UI
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        z-index: 9999;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 20px;
      `;
      
      video.style.cssText = `
        max-width: 90vw;
        max-height: 70vh;
        border-radius: 8px;
      `;
      
      // Create buttons container
      const buttonContainer = document.createElement('div');
      buttonContainer.style.cssText = `
        display: flex;
        gap: 16px;
        margin-top: 20px;
      `;
      
      // Capture button
      const captureButton = document.createElement('button');
      captureButton.textContent = '📸 Capture';
      captureButton.style.cssText = `
        padding: 12px 24px;
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 16px;
        cursor: pointer;
      `;
      
      // Cancel button
      const cancelButton = document.createElement('button');
      cancelButton.textContent = '✕ Cancel';
      cancelButton.style.cssText = `
        padding: 12px 24px;
        background: #6b7280;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 16px;
        cursor: pointer;
      `;
      
      // Add elements to modal
      modal.appendChild(video);
      buttonContainer.appendChild(captureButton);
      buttonContainer.appendChild(cancelButton);
      modal.appendChild(buttonContainer);
      document.body.appendChild(modal);
      
      // Handle capture
      captureButton.onclick = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context?.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `lease-document-${Date.now()}.jpg`, { type: 'image/jpeg' });
            const preview = URL.createObjectURL(file);
            setUploadedFile({ file, preview, type: 'image' });
          }
        }, 'image/jpeg', 0.85);
        
        // Cleanup
        stream.getTracks().forEach(track => track.stop());
        document.body.removeChild(modal);
      };
      
      // Handle cancel
      cancelButton.onclick = () => {
        stream.getTracks().forEach(track => track.stop());
        document.body.removeChild(modal);
      };
      
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please check permissions or use file upload instead.');
    }
  };

  const removeFile = () => {
    if (uploadedFile?.preview) {
      URL.revokeObjectURL(uploadedFile.preview);
    }
    setUploadedFile(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!uploadedFile || !isConsentChecked || !userSelectedState) {
      if (!userSelectedState) setUploadError("Please select the state/jurisdiction for the lease.");
      else if (!uploadedFile) setUploadError("Please select a file to upload.");
      else if (!isConsentChecked) setUploadError("Please agree to the terms and privacy policy.");
      return;
    }
    
    setUploadError(null);
    setIsUploading(true);
    
    const formData = new FormData();
    formData.append('file', uploadedFile.file);
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
              Lease Document (PDF or Photo)
            </Label>
            
            {!uploadedFile ? (
              <div className="space-y-4 mt-2">
                {/* Drag and drop area */}
                <div 
                  {...getRootProps()} 
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <input {...getInputProps()} id="lease-document" />
                  <UploadCloud className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                  
                  <div className="space-y-2">
                    <p className="font-medium">
                      {isDragActive ? "Drop the file here" : "Drag and drop your lease document"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      or click to browse files
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Supports: PDF, JPG, PNG (Max 10MB)
                    </p>
                  </div>
                </div>
                
                {/* Alternative: Camera button */}
                {isCameraSupported && (
                  <div className="flex items-center gap-4">
                    <div className="flex-1 border-t border-muted"></div>
                    <span className="text-sm text-muted-foreground">OR</span>
                    <div className="flex-1 border-t border-muted"></div>
                  </div>
                )}
                
                {isCameraSupported && (
                  <Button
                    type="button"
                    onClick={handleCameraCapture}
                    variant="outline"
                    size="lg"
                    className="w-full"
                    disabled={isUploading}
                  >
                    <Camera className="h-5 w-5 mr-2" />
                    Take Photo with Camera
                  </Button>
                )}
              </div>
            ) : (
              <div className="mt-2 flex items-start gap-4 p-4 border rounded-lg">
                <div className="p-2 bg-primary/10 rounded">
                  {uploadedFile.type === 'image' ? (
                    <Image className="h-6 w-6 text-primary" />
                  ) : (
                    <FileText className="h-6 w-6 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{uploadedFile.file.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {(uploadedFile.file.size / 1024 / 1024).toFixed(1)} MB • {uploadedFile.type.toUpperCase()}
                  </p>
                  {uploadedFile.preview && (
                    <div className="mt-2">
                      <img 
                        src={uploadedFile.preview} 
                        alt="Preview" 
                        className="max-w-xs max-h-32 object-contain border rounded"
                      />
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={removeFile}
                  disabled={isUploading}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="state-jurisdiction" className="text-base">
              State / Jurisdiction of Lease
            </Label>
            <Select
              value={userSelectedState}
              onValueChange={(value) => setUserSelectedState(value)}
            >
              <SelectTrigger id="state-jurisdiction" className="mt-2">
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {US_STATES.map((state) => (
                  <SelectItem key={state.code} value={state.code}>
                    {state.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Select the state or jurisdiction the lease agreement pertains to. This helps tailor the analysis.
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
            disabled={!uploadedFile || !isConsentChecked || !userSelectedState || isUploading}
            className="w-full"
          >
            {isUploading ? "Processing..." : "Start Analysis"}
          </Button>
        </form>
      </Card>
    </div>
  );
} 