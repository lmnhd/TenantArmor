import ClauseCard from '../components/ClauseCard';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { LeaseAnalysis } from '@/lib/types';
import Link from 'next/link';
import { ArrowLeft, Download, Printer, Flag } from 'lucide-react';

// Mock data
const mockAnalysisData: LeaseAnalysis = {
  id: "mock123",
  documentName: "Sample Lease Agreement.pdf",
  uploadDate: "2024-05-21",
  summary: "This lease agreement appears to be standard but contains a few clauses that warrant attention, particularly regarding late fees and subletting permissions. Overall risk is assessed as Medium.",
  overallSeverity: 'Medium',
  clauses: [
    {
      id: "clause1",
      title: "Rent Payment",
      text: "Rent is due on the 1st of each month. A late fee of $50 will be applied if rent is not received by the 5th.",
      issues: [
        { id: "issue1_1", description: "Late fee amount could be considered high depending on jurisdiction.", severity: 'Medium', recommendation: "Verify local regulations on maximum allowable late fees." },
      ],
    },
    {
      id: "clause2",
      title: "Subletting",
      text: "Subletting is not permitted without prior written consent from the Landlord.",
      issues: [
        { id: "issue2_1", description: "Strict no-subletting clause can limit tenant flexibility.", severity: 'Low', recommendation: "If flexibility is needed, discuss potential for an addendum with the landlord." },
      ],
    },
    {
      id: "clause3",
      title: "Maintenance and Repairs",
      text: "Tenant is responsible for minor repairs. Landlord is responsible for major structural repairs.",
      issues: [
        { id: "issue3_1", description: "Definition of 'minor repairs' is vague and could lead to disputes.", severity: 'High', recommendation: "Request clarification or an addendum detailing specific responsibilities for common repairs." },
      ],
    },
  ],
};

export default async function LeaseAnalysisResultPage(props: { params: { analysisId: string } }) {
  const { analysisId } = props.params;
  // In a real app, this would fetch the analysis data from the API using the analysisId
  const analysis = mockAnalysisData;

  if (!analysis) {
    return <p>Loading analysis data or analysis not found...</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:justify-between sm:items-center mb-6">
        <div>
          <Link 
            href="/dashboard/lease-analysis" 
            className="inline-flex items-center text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to all analyses
          </Link>
          <h1 className="text-3xl font-bold">{analysis.documentName}</h1>
          <p className="text-muted-foreground">Analyzed on {analysis.uploadDate}</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-6 md:col-span-2">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold">Summary</h2>
            <div className={`px-3 py-1 rounded-full text-sm font-medium
              ${analysis.overallSeverity === 'High' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200' : 
              analysis.overallSeverity === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' : 
              'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'}`}
            >
              {analysis.overallSeverity} Risk
            </div>
          </div>
          <p className="text-muted-foreground">{analysis.summary}</p>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Analysis Details</h2>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm text-muted-foreground">Document Name</dt>
              <dd className="font-medium">{analysis.documentName}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Analysis ID</dt>
              <dd className="font-medium">{analysisId}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Completion Date</dt>
              <dd className="font-medium">{analysis.uploadDate}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Overall Assessment</dt>
              <dd className={`font-medium 
                ${analysis.overallSeverity === 'High' ? 'text-red-600 dark:text-red-400' : 
                analysis.overallSeverity === 'Medium' ? 'text-yellow-600 dark:text-yellow-400' : 
                'text-green-600 dark:text-green-400'}`}>
                {analysis.overallSeverity} Risk
              </dd>
            </div>
          </dl>
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-medium mb-2">Need help understanding this?</h3>
            <p className="text-sm text-muted-foreground mb-4">Our legal experts can explain what this analysis means for your specific situation.</p>
            <Button className="w-full">
              Book Consultation
            </Button>
          </div>
        </Card>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-6">Potential Issues & Concerns</h2>
        {analysis.clauses.map((clause) => (
          <ClauseCard key={clause.id} clause={clause} />
        ))}
      </div>

      <Card className="p-6 bg-muted/50">
        <div className="flex space-x-3 items-start">
          <Flag className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium">Disclaimer</h3>
            <p className="text-sm text-muted-foreground mt-1">
              This analysis is provided for informational purposes only and does not constitute legal advice. 
              For specific legal guidance regarding your lease, please consult with a qualified attorney familiar 
              with landlord-tenant laws in your jurisdiction.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
} 