import { Card } from "@/components/ui/card";
import Link from "next/link";
import { FileText, ShieldAlert, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubscriptionStatus } from "@/components/subscription/subscription-status";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Your Tenant Protection Hub</h1>
        <p className="text-muted-foreground mt-1">
          Protect your rights and make informed decisions with expert legal guidance
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Lease Protection</h2>
                  <p className="text-muted-foreground mb-4">
                    Know exactly what you're signing before you commit to a lease
                  </p>
                  <Button asChild>
                    <Link href="/dashboard/lease-analysis">
                      Analyze My Lease
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
                  <h2 className="text-xl font-semibold mb-2">Eviction Defense</h2>
                  <p className="text-muted-foreground mb-4">
                    Get immediate help and know your rights when facing eviction
                  </p>
                  <Button asChild>
                    <Link href="/dashboard/eviction-response">
                      Get Help Now
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

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Your Protection History</h2>
            <div className="text-center py-8 text-muted-foreground">
              No protection activities yet - start by analyzing your lease or getting eviction help
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <SubscriptionStatus />
        </div>
      </div>
    </div>
  );
} 