import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, MapPin, Clock, ChevronRight, AlertTriangle, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function EvictionResponsePage() {
  // Mock data for templates
  const responseTemplates = [
    {
      id: "ca-notice-to-pay",
      title: "Response to Pay Rent or Quit Notice",
      state: "California",
      description: "Use this template when you've received a notice demanding payment of rent.",
      timeEstimate: "20-30 minutes",
      category: "Payment Issues"
    },
    {
      id: "tx-cure-notice",
      title: "Response to Notice to Cure Lease Violation",
      state: "Texas",
      description: "Use when landlord claims you've violated a lease term and demands you fix the issue.",
      timeEstimate: "25-35 minutes",
      category: "Lease Violations"
    },
    {
      id: "ny-no-fault-eviction",
      title: "Response to No-Fault Eviction Notice",
      state: "New York",
      description: "For situations where landlord is attempting to evict without claiming fault.",
      timeEstimate: "30-40 minutes",
      category: "No-Fault Eviction"
    },
    {
      id: "general-hardship",
      title: "Hardship Declaration",
      state: "All States",
      description: "General template explaining financial hardship circumstances.",
      timeEstimate: "15-25 minutes",
      category: "Financial Hardship"
    },
    {
      id: "general-request-repair",
      title: "Repair Request with Eviction Defense",
      state: "All States",
      description: "For responding to eviction while documenting repair issues or habitability concerns.",
      timeEstimate: "25-40 minutes",
      category: "Repairs & Habitability"
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Eviction Response</h1>
          <p className="text-muted-foreground mt-2">
            Create customized responses to eviction notices using our templates
          </p>
        </div>
        <Button>
          <Link href="/dashboard/eviction-response/custom">
            Create Custom Response
          </Link>
        </Button>
      </div>

      <div className="flex items-start gap-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="font-medium text-yellow-800 dark:text-yellow-300">Time-Sensitive Matter</h3>
          <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
            Eviction notices typically have strict response deadlines. Respond as soon as possible to protect your rights.
            If you're facing an emergency situation, consider seeking immediate legal assistance.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {responseTemplates.map((template) => (
          <Card key={template.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start mb-1">
                <CardTitle className="text-lg">{template.title}</CardTitle>
              </div>
              <CardDescription className="flex items-center">
                <MapPin className="h-3.5 w-3.5 mr-1" />
                {template.state}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-3">
              <p className="text-sm text-muted-foreground mb-3">
                {template.description}
              </p>
              <div className="flex justify-between text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Clock className="h-3.5 w-3.5 mr-1" />
                  {template.timeEstimate}
                </div>
                <div className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">
                  {template.category}
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/50 pt-3">
              <Button asChild className="w-full">
                <Link href={`/dashboard/eviction-response/${template.id}`}>
                  Use Template
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      <Card className="p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900">
        <div className="flex items-start gap-4">
          <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-300">Personalized Assistance Available</h3>
            <p className="text-green-700 dark:text-green-400 mt-1 mb-4">
              Need help with a complex eviction situation? Our network of attorneys can provide personalized guidance 
              tailored to your specific circumstances.
            </p>
            <Button className="bg-green-600 hover:bg-green-700 text-white">
              Connect with an Attorney
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
} 