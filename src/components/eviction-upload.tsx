"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Upload, 
  FileText, 
  Image, 
  X, 
  AlertTriangle, 
  Info,
  MapPin,
  User,
  Home,
  Phone,
  Mail,
  Calendar,
  Camera
} from "lucide-react";
import { cn } from "@/lib/utils";
import LeaseContextSelector from "./lease-context-selector";

// US States with their codes
const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
  { code: 'DC', name: 'District of Columbia' }
];

interface UploadedFile {
  file: File;
  preview?: string;
  type: 'pdf' | 'image';
}

interface FormData {
  tenantName: string;
  tenantAddress: string;
  tenantCity: string;
  tenantState: string;
  tenantZip: string;
  tenantPhone: string;
  tenantEmail: string;
  propertyAddress: string;
  propertyCity: string;
  propertyState: string;
  propertyZip: string;
  landlordName: string;
  landlordAddress: string;
  noticeDate: string;
  additionalNotes: string;
}

interface EvictionUploadProps {
  onStartAnalysis: (file: File, state: string, formData: Partial<FormData>, selectedLeaseId?: string | null) => void;
  isProcessing?: boolean;
}

export default function EvictionUpload({ onStartAnalysis, isProcessing = false }: EvictionUploadProps) {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [selectedState, setSelectedState] = useState<string>("");
  const [showOptionalForm, setShowOptionalForm] = useState(false);
  const [isCameraSupported, setIsCameraSupported] = useState(false);
  const [selectedLeaseId, setSelectedLeaseId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    tenantName: "",
    tenantAddress: "",
    tenantCity: "",
    tenantState: "",
    tenantZip: "",
    tenantPhone: "",
    tenantEmail: "",
    propertyAddress: "",
    propertyCity: "",
    propertyState: "",
    propertyZip: "",
    landlordName: "",
    landlordAddress: "",
    noticeDate: "",
    additionalNotes: ""
  });

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

    const fileType = file.type.startsWith('image/') ? 'image' : 'pdf';
    
    if (fileType === 'image') {
      const preview = URL.createObjectURL(file);
      setUploadedFile({ file, preview, type: fileType });
    } else {
      setUploadedFile({ file, type: fileType });
    }
  }, []);

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
            const file = new File([blob], `eviction-notice-${Date.now()}.jpg`, { type: 'image/jpeg' });
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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    disabled: isProcessing
  });

  const removeFile = () => {
    if (uploadedFile?.preview) {
      URL.revokeObjectURL(uploadedFile.preview);
    }
    setUploadedFile(null);
  };

  const handleFormDataChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLeaseSelection = (lease: any) => {
    setSelectedLeaseId(lease?.analysisId || null);
  };

  const handleStartAnalysis = () => {
    if (!uploadedFile || !selectedState) return;
    
    const dataToSubmit = showOptionalForm ? formData : {};
    onStartAnalysis(uploadedFile.file, selectedState, dataToSubmit, selectedLeaseId);
  };

  const isReadyToAnalyze = uploadedFile && selectedState && !isProcessing;

  return (
    <div className="space-y-6">
      {/* File Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Eviction Notice
          </CardTitle>
          <CardDescription>
            Upload a photo or PDF of your eviction notice. Our AI will extract key details and generate a customized response.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!uploadedFile ? (
            <div className="space-y-4">
              {/* Drag and drop area */}
              <div
                {...getRootProps()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                  isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
                  isProcessing && "opacity-50 cursor-not-allowed"
                )}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-muted rounded-full">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">Drop your eviction notice here</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Or click to browse files
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Supports: JPG, PNG, PDF (Max 10MB)
                    </p>
                  </div>
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
                  onClick={handleCameraCapture}
                  variant="outline"
                  size="lg"
                  className="w-full"
                  disabled={isProcessing}
                >
                  <Camera className="h-5 w-5 mr-2" />
                  Take Photo with Camera
                </Button>
              )}
            </div>
          ) : (
            <div className="flex items-start gap-4 p-4 border rounded-lg">
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
                variant="ghost"
                size="sm"
                onClick={removeFile}
                disabled={isProcessing}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* State Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Property Location
          </CardTitle>
          <CardDescription>
            Select the state where the rental property is located. This ensures we use the correct legal templates and procedures.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="state-select">State</Label>
              <Select 
                value={selectedState} 
                onValueChange={setSelectedState}
                disabled={isProcessing}
              >
                <SelectTrigger id="state-select">
                  <SelectValue placeholder="Select your state" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map((state) => (
                    <SelectItem key={state.code} value={state.code}>
                      {state.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedState && (
              <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="text-blue-800 dark:text-blue-300 font-medium">
                    {US_STATES.find(s => s.code === selectedState)?.name} Selected
                  </p>
                  <p className="text-blue-700 dark:text-blue-400 mt-1">
                    We'll use {US_STATES.find(s => s.code === selectedState)?.name}-specific legal templates and procedures for your response.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lease Context Selector */}
      <LeaseContextSelector
        onLeaseSelected={handleLeaseSelection}
        selectedLeaseId={selectedLeaseId}
      />

      {/* Optional Form Section - only show if checkbox is checked */}
      {/* ... existing optional form UI ... */}

      {/* Action Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleStartAnalysis}
          disabled={!isReadyToAnalyze}
          size="lg"
          className="min-w-[200px]"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Processing...
            </>
          ) : (
            <>
              Start AI Analysis
              <Upload className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
} 