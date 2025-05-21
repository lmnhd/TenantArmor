import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { ArrowLeft, Pencil, Download, InfoIcon } from "lucide-react";
import Link from "next/link";

// Mock data for response templates
const templateData = {
  "ca-notice-to-pay": {
    title: "Response to Pay Rent or Quit Notice",
    state: "California",
    description: "Use this template when you've received a notice demanding payment of rent.",
    templateContent: `
[Date]

[Landlord's Name]
[Landlord's Address]
[City, State ZIP]

RE: Response to Pay Rent or Quit Notice for [Your Address]

Dear [Landlord's Name],

I am writing in response to the Pay Rent or Quit Notice dated [Notice Date] that I received on [Date Received]. 

[SELECT AN APPROPRIATE RESPONSE OPTION BELOW AND DELETE THE OTHERS]

OPTION 1 - PAYMENT MADE:
Please be advised that I have already paid the rent amount of $[Amount] on [Payment Date] via [Payment Method]. I have attached proof of this payment for your records. Therefore, I believe this notice was sent in error, and I request that you withdraw it immediately.

OPTION 2 - PAYMENT DISPUTE:
I dispute the amount claimed in the notice for the following reason(s): [Explain discrepancy, such as prior payments not credited, improper late fees, etc.]. I have attached documentation supporting my position. I request that we discuss this matter to reconcile our records.

OPTION 3 - HABITABILITY ISSUES:
I wish to bring to your attention that there are serious habitability issues affecting the premises that must be addressed before full rent payment is due. California law permits tenants to withhold rent when a landlord fails to maintain habitable premises. The following issues require immediate attention: [List specific issues with dates reported]. 

OPTION 4 - HARDSHIP/PAYMENT PLAN:
I am currently experiencing financial hardship due to [brief explanation]. I propose the following payment plan to bring my account current: [Proposed payment schedule]. Please contact me to discuss this arrangement.

[ADD ANY ADDITIONAL CONTEXT SPECIFIC TO YOUR SITUATION]

I would appreciate your prompt attention to this matter. I can be reached at [Your Phone Number] or [Your Email] to discuss this further.

Sincerely,

[Your Name]
[Your Address]
[City, State ZIP]
[Your Phone Number]
[Your Email]
    `,
    instructions: [
      "Fill in all bracketed fields with your specific information",
      "Select only ONE response option that best fits your situation",
      "Delete the other response options before finalizing",
      "Include supporting documentation if referenced in your letter",
      "Keep a copy of the letter and proof of delivery for your records"
    ],
    legalNotes: "In California, landlords must provide a three-day notice to pay rent or quit before filing for eviction. The notice must specify the exact amount owed and the dates covered. If you believe the notice is invalid or have legal defenses, consider consulting with a tenant attorney or legal aid organization."
  },
  // More templates would be defined here for other IDs
};

export default async function EvictionResponseTemplatePage({ 
  params 
}: { 
  params: Promise<{ templateId: string }> 
}) {
  const { templateId } = await params;
  const template = templateData[templateId as keyof typeof templateData] || {
    title: "Template Not Found",
    state: "Unavailable",
    description: "Sorry, this template does not exist or has been removed.",
    templateContent: "Unavailable",
    instructions: [],
    legalNotes: ""
  };

  return (
    <div className="space-y-8">
      <div>
        <Link 
          href="/dashboard/eviction-response" 
          className="inline-flex items-center text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to all templates
        </Link>
        <h1 className="text-3xl font-bold">{template.title}</h1>
        <p className="text-muted-foreground">Applicable in {template.state}</p>
      </div>

      <div className="flex items-start gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <InfoIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="font-medium text-blue-800 dark:text-blue-300">Template Instructions</h3>
          <p className="text-sm text-blue-700 dark:text-blue-400 mt-1 mb-2">
            {template.description}
          </p>
          <ul className="list-disc pl-5 text-sm text-blue-700 dark:text-blue-400 space-y-1">
            {template.instructions.map((instruction, index) => (
              <li key={index}>{instruction}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <Card className="border shadow-sm">
            <CardHeader className="bg-muted/50 flex flex-row items-center justify-between">
              <h2 className="text-xl font-semibold">Template Document</h2>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button variant="default" size="sm">
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Document
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="bg-white dark:bg-gray-950 border rounded-md p-6 font-mono text-sm whitespace-pre-wrap">
                {template.templateContent}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="font-semibold">Legal Notes</h3>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {template.legalNotes}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="font-semibold">Need Help?</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This template provides a general framework but may not address your specific situation.
              </p>
              <Button className="w-full">
                Speak with an Attorney
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 