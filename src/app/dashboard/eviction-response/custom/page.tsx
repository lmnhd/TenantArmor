"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowLeft, Save, Download, InfoIcon, Copy, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function CustomEvictionResponsePage() {
  const [responseText, setResponseText] = useState<string>(`[Date]

[Recipient Name]
[Recipient Address]
[City, State ZIP]

RE: Response to Eviction Notice for [Your Address]

Dear [Recipient Name],

I am writing in response to the eviction notice dated [Notice Date] that I received on [Date Received]. 

[BODY OF YOUR RESPONSE - EXPLAIN YOUR SPECIFIC SITUATION AND RESPONSE]

I would appreciate your prompt attention to this matter. I can be reached at [Your Phone Number] or [Your Email] to discuss this further.

Sincerely,

[Your Name]
[Your Address]
[City, State ZIP]
[Your Phone Number]
[Your Email]`);

  const [showSaved, setShowSaved] = useState(false);

  const handleSave = () => {
    // In a real app, this would save to the database
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 3000);
  };

  const commonDefenses = [
    "Improper notice (incorrect information or delivery method)",
    "Rent was paid during the notice period",
    "Retaliatory eviction (after requesting repairs or exercising rights)",
    "Discrimination-based eviction (protected class)",
    "Habitual late payment accepted by landlord",
    "Waiver (landlord accepted partial payment)",
    "Habitability issues (code violations, serious repair needs)",
    "Lease violation notice lacks required specificity",
    "Lease violation was minor or remedied within cure period",
    "Lease violation was caused by disability (reasonable accommodation)",
  ];

  return (
    <div className="space-y-8">
      <div>
        <Link 
          href="/dashboard/eviction-response" 
          className="inline-flex items-center text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to templates
        </Link>
        <h1 className="text-3xl font-bold">Create Custom Response</h1>
        <p className="text-muted-foreground">Draft a personalized eviction response letter</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3 space-y-6">
          <Card className="border shadow-sm">
            <CardHeader className="bg-muted/50 flex flex-row items-center justify-between">
              <h2 className="text-xl font-semibold">Response Document</h2>
              <div className="flex space-x-2">
                {showSaved ? (
                  <Button variant="ghost" size="sm" className="text-green-600" disabled>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Saved
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Draft
                  </Button>
                )}
                <Button variant="outline" size="sm">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <textarea
                className="w-full font-mono text-sm p-4 min-h-[500px] border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                aria-label="Eviction response letter text"
              />
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-3">
            <Button variant="outline">Save as Draft</Button>
            <Button>Finalize & Download</Button>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="font-semibold">Common Defense Checklist</h3>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Consider if any of these common defenses apply to your situation:
              </p>
              <div className="space-y-3">
                {commonDefenses.map((defense, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <Checkbox id={`defense-${index}`} />
                    <Label
                      htmlFor={`defense-${index}`}
                      className="text-sm font-normal leading-tight cursor-pointer"
                    >
                      {defense}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex items-start gap-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <InfoIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-yellow-800 dark:text-yellow-300">Important Note</h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                This is not legal advice. For serious eviction matters, consider consulting with a qualified attorney who specializes in tenant law in your jurisdiction.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 