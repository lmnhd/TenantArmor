import { Card } from "@/components/ui/card";
import Link from "next/link";
import { FileText, ShieldAlert, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome to your TenantArmor dashboard
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-2">Lease Analysis</h2>
              <p className="text-muted-foreground mb-4">
                Upload and analyze your lease agreements for potential issues
              </p>
              <Button asChild>
                <Link href="/dashboard/lease-analysis">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="bg-primary/10 p-3 rounded-full">
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-2">Eviction Response</h2>
              <p className="text-muted-foreground mb-4">
                Create customized responses to eviction notices
              </p>
              <Button asChild>
                <Link href="/dashboard/eviction-response">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="bg-primary/10 p-3 rounded-full">
              <ShieldAlert className="h-8 w-8 text-primary" />
            </div>
          </div>
        </Card>
      </div>

      <div>
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <div className="text-center py-8 text-muted-foreground">
            No recent activity to display
          </div>
        </Card>
      </div>
    </div>
  );
} 