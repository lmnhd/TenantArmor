"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, CheckCircle, Info } from "lucide-react";

interface LeaseAnalysis {
  analysisId: string;
  fileName: string;
  uploadTimestamp: string;
  status: string;
  overallSeverity?: 'High' | 'Medium' | 'Low';
  summary?: string;
}

interface LeaseContextSelectorProps {
  onLeaseSelected?: (leaseAnalysis: LeaseAnalysis | null) => void;
  selectedLeaseId?: string | null;
}

export default function LeaseContextSelector({ 
  onLeaseSelected, 
  selectedLeaseId 
}: LeaseContextSelectorProps) {
  const [leases, setLeases] = useState<LeaseAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserLeases();
  }, []);

  async function fetchUserLeases() {
    try {
      const response = await fetch('/api/user-lease-analyses');
      if (!response.ok) throw new Error('Failed to fetch lease analyses');
      
      const data = await response.json();
      setLeases(data.analyses || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leases');
    } finally {
      setLoading(false);
    }
  }

  function handleLeaseSelection(lease: LeaseAnalysis | null) {
    onLeaseSelected?.(lease);
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Lease Context...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (error || leases.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Lease Context (Optional)
          </CardTitle>
          <CardDescription>
            {error ? 'Unable to load lease analyses' : 'No previous lease analyses found. Upload a lease first for enhanced eviction response.'}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Use Existing Lease for Context
        </CardTitle>
        <CardDescription>
          Select a previously analyzed lease to provide additional context for your eviction response.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {leases.map((lease) => (
            <div
              key={lease.analysisId}
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedLeaseId === lease.analysisId
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-primary/50'
              }`}
              onClick={() => handleLeaseSelection(
                selectedLeaseId === lease.analysisId ? null : lease
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{lease.fileName}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(lease.uploadTimestamp).toLocaleDateString()}
                  </p>
                  {lease.summary && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {lease.summary}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  {selectedLeaseId === lease.analysisId && (
                    <CheckCircle className="h-4 w-4 text-primary" />
                  )}
                  {lease.overallSeverity && (
                    <Badge 
                      variant={lease.overallSeverity === 'High' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {lease.overallSeverity}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {selectedLeaseId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleLeaseSelection(null)}
              className="w-full"
            >
              Clear Selection
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 