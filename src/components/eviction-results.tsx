"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Download, 
  Copy, 
  Mail, 
  Calendar, 
  MapPin, 
  Phone, 
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Gavel,
  Shield,
  Edit3,
  RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalysisResults {
  noticeType: string;
  deadline: string;
  amountDue?: string;
  propertyAddress: string;
  landlordName: string;
  violations: string[];
  defenses: string[];
  urgency: 'low' | 'medium' | 'high';
  confidence: number;
  responseText: string;
  courtInstructions: string;
  legalAidContacts: Array<{
    name: string;
    phone: string;
    website: string;
    address: string;
  }>;
  state: string;
  stateLaws: string[];
  deadlineType: string;
  keyDates: Array<{
    date: string;
    description: string;
    type: 'deadline' | 'court' | 'notice';
  }>;
}

interface EvictionResultsProps {
  results: AnalysisResults;
  onStartOver: () => void;
  onEdit?: () => void;
}

export default function EvictionResults({ results, onStartOver, onEdit }: EvictionResultsProps) {
  const [editableResponse, setEditableResponse] = useState(results.responseText);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDefenses, setSelectedDefenses] = useState<string[]>(results.defenses);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  function getUrgencyColor(urgency: string) {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  function getConfidenceColor(confidence: number) {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function getDaysUntil(dateString: string) {
    const targetDate = new Date(dateString);
    const today = new Date();
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  async function copyToClipboard(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(label);
      setTimeout(() => setCopiedText(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  }

  function handleDefenseToggle(defense: string, checked: boolean) {
    setSelectedDefenses(prev => 
      checked 
        ? [...prev, defense]
        : prev.filter(d => d !== defense)
    );
  }

  function generateUpdatedResponse() {
    // Simple regeneration logic - in real implementation, this would call the API
    const selectedDefenseText = selectedDefenses.map(defense => `- ${defense}`).join('\n');
    const updatedResponse = editableResponse.replace(
      /LEGAL DEFENSES:[\s\S]*?(?=DEMAND FOR CURE:|$)/,
      `LEGAL DEFENSES:\n${selectedDefenseText}\n\n`
    );
    setEditableResponse(updatedResponse);
  }

  const daysUntilDeadline = getDaysUntil(results.deadline);

  return (
    <div className="space-y-6">
      {/* Analysis Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Analysis Complete
          </CardTitle>
          <CardDescription>
            AI analysis of your eviction notice with confidence score and urgency assessment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="text-2xl font-bold mb-1">
                {(results.confidence * 100).toFixed(0)}%
              </div>
              <div className={cn("text-sm font-medium", getConfidenceColor(results.confidence))}>
                AI Confidence
              </div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <Badge className={getUrgencyColor(results.urgency)}>
                {results.urgency.toUpperCase()} URGENCY
              </Badge>
              <div className="text-sm text-muted-foreground mt-1">
                Response Priority
              </div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="text-2xl font-bold mb-1">
                {daysUntilDeadline}
              </div>
              <div className="text-sm text-muted-foreground">
                Days until deadline
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notice Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Notice Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Notice Type</h4>
                <p className="text-sm text-muted-foreground">{results.noticeType}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Property Address</h4>
                <p className="text-sm text-muted-foreground">{results.propertyAddress}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Landlord</h4>
                <p className="text-sm text-muted-foreground">{results.landlordName}</p>
              </div>
              {results.amountDue && (
                <div>
                  <h4 className="font-medium mb-2">Amount Due</h4>
                  <p className="text-sm text-muted-foreground">{results.amountDue}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legal Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gavel className="h-5 w-5" />
            Legal Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Violations */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                Potential Landlord Violations
              </h4>
              <div className="space-y-2">
                {results.violations.map((violation, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{violation}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Available Defenses */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-600" />
                Available Tenant Defenses
              </h4>
              <div className="space-y-2">
                {results.defenses.map((defense, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <Checkbox 
                      checked={selectedDefenses.includes(defense)}
                      onCheckedChange={(checked) => handleDefenseToggle(defense, checked as boolean)}
                    />
                    <span className="text-sm flex-1">{defense}</span>
                  </div>
                ))}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={generateUpdatedResponse}
                className="mt-3"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Update Response with Selected Defenses
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generated Response */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Generated Legal Response
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                {isEditing ? 'Done Editing' : 'Edit'}
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Customized legal response letter based on your notice analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isEditing ? (
              <Textarea
                value={editableResponse}
                onChange={(e) => setEditableResponse(e.target.value)}
                className="min-h-[400px] font-mono text-sm"
                placeholder="Edit your legal response..."
              />
            ) : (
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm font-mono">
                  {editableResponse}
                </pre>
              </div>
            )}
            
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(editableResponse, 'response')}
              >
                <Copy className="h-4 w-4 mr-2" />
                {copiedText === 'response' ? 'Copied!' : 'Copy Text'}
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download Word
              </Button>
              <Button variant="outline" size="sm">
                <Mail className="h-4 w-4 mr-2" />
                Email Copy
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Important Dates & Deadlines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {results.keyDates.map((dateInfo, index) => {
              const daysUntil = getDaysUntil(dateInfo.date);
              const isUrgent = daysUntil <= 5;
              
              return (
                <div 
                  key={index}
                  className={cn(
                    "flex items-center gap-4 p-3 rounded-lg border",
                    isUrgent 
                      ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" 
                      : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-full",
                    isUrgent ? "bg-red-200 dark:bg-red-800" : "bg-gray-200 dark:bg-gray-700"
                  )}>
                    <Clock className={cn(
                      "h-4 w-4",
                      isUrgent ? "text-red-600 dark:text-red-400" : "text-gray-600 dark:text-gray-400"
                    )} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{dateInfo.description}</h4>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(dateInfo.date)} 
                      {daysUntil >= 0 && (
                        <span className={cn(
                          "ml-2 font-medium",
                          isUrgent ? "text-red-600" : "text-blue-600"
                        )}>
                          ({daysUntil === 0 ? 'Today' : daysUntil === 1 ? '1 day left' : `${daysUntil} days left`})
                        </span>
                      )}
                    </p>
                  </div>
                  {isUrgent && (
                    <Badge variant="destructive">
                      Urgent
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Court Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Court Filing Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm">
                {results.courtInstructions}
              </pre>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(results.courtInstructions, 'instructions')}
            >
              <Copy className="h-4 w-4 mr-2" />
              {copiedText === 'instructions' ? 'Copied!' : 'Copy Instructions'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Legal Aid Contacts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Legal Aid Organizations
          </CardTitle>
          <CardDescription>
            Free legal assistance in your area
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.legalAidContacts.map((contact, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-2">
                <h4 className="font-medium">{contact.name}</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3" />
                    <span>{contact.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-3 w-3" />
                    <a href={contact.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {contact.website}
                    </a>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span>{contact.address}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-center gap-4">
        <Button variant="outline" onClick={onStartOver}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Start Over
        </Button>
        <Button onClick={() => window.print()}>
          <Download className="h-4 w-4 mr-2" />
          Print Results
        </Button>
      </div>
    </div>
  );
} 