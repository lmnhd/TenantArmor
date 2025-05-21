import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FileText, Clock, AlertCircle } from 'lucide-react';

export default function LeaseAnalysisPage() {
  // Placeholder for analyses history - reuse mock data for now
  const analysesHistory = [
    { id: "analysis1", name: "Apartment Lease Alpha.pdf", date: "2024-05-20", status: "Completed", overallSeverity: "Medium" },
    { id: "analysis2", name: "Office Sublease Beta.pdf", date: "2024-05-18", status: "Completed", overallSeverity: "Low" },
    { id: "analysis3", name: "Rental Agreement Charlie.pdf", date: "2024-05-15", status: "Processing", overallSeverity: "N/A" }, 
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Lease Analysis</h1>
        <Button asChild>
          <Link href="/dashboard/lease-analysis/upload">
            <Plus className="mr-2 h-4 w-4" />
            Upload New Lease
          </Link>
        </Button>
      </div>

      <div className="bg-muted/50 p-5 rounded-lg flex items-start space-x-4">
        <AlertCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="text-sm font-medium">How Lease Analysis Works</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Upload your lease agreement and our AI will analyze it for potentially problematic clauses, 
            unusual terms, and help you understand your rights and obligations as a tenant.
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Your Analysis History</h2>
        {analysesHistory.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {analysesHistory.map((analysis) => (
              <Card key={analysis.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <FileText className="mr-2 h-5 w-5 text-muted-foreground" />
                    {analysis.name}
                  </CardTitle>
                  <CardDescription className="flex items-center">
                    <Clock className="mr-1 h-4 w-4" />
                    Analyzed on {analysis.date}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Status:</p>
                      <p className={`text-sm font-medium ${
                        analysis.status === 'Completed' ? 'text-green-600 dark:text-green-400' :
                        analysis.status === 'Processing' ? 'text-blue-600 dark:text-blue-400' :
                        'text-red-600 dark:text-red-400'
                      }`}>
                        {analysis.status}
                      </p>
                    </div>
                    {analysis.status === 'Completed' && (
                      <div>
                        <p className="text-sm font-medium">Risk Level:</p>
                        <p className={`text-sm font-medium ${
                          analysis.overallSeverity === 'High' ? 'text-red-600 dark:text-red-400' :
                          analysis.overallSeverity === 'Medium' ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-green-600 dark:text-green-400'
                        }`}>
                          {analysis.overallSeverity}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/50 pt-2">
                  {analysis.status === 'Completed' ? (
                    <Button asChild variant="default" className="w-full">
                      <Link href={`/dashboard/lease-analysis/${analysis.id}`}>
                        View Analysis
                      </Link>
                    </Button>
                  ) : (
                    <Button disabled className="w-full">
                      {analysis.status === 'Processing' ? 'Processing...' : 'Failed - Try Again'}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 border-2 border-dashed rounded-lg">
            <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-1">No analyses yet</h3>
            <p className="text-muted-foreground mb-4">Upload your first lease for analysis</p>
            <Button asChild>
              <Link href="/dashboard/lease-analysis/upload">
                <Plus className="mr-2 h-4 w-4" />
                Upload Lease
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 