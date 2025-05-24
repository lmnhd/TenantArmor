import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, User, Bell, Shield, CreditCard, HelpCircle } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Account Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Account Settings
            </CardTitle>
            <CardDescription>
              Manage your profile and account information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Profile Information</p>
              <p className="text-sm text-muted-foreground">Update your personal details and contact information</p>
            </div>
            <Button variant="outline" disabled>
              Edit Profile (Coming Soon)
            </Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure your notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Email Notifications</p>
              <p className="text-sm text-muted-foreground">Choose what updates you want to receive</p>
            </div>
            <Button variant="outline" disabled>
              Manage Notifications (Coming Soon)
            </Button>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Security & Privacy
            </CardTitle>
            <CardDescription>
              Manage your security settings and privacy preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Account Security</p>
              <p className="text-sm text-muted-foreground">Password, two-factor authentication, and login history</p>
            </div>
            <Button variant="outline" disabled>
              Security Settings (Coming Soon)
            </Button>
          </CardContent>
        </Card>

        {/* Billing Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Billing & Subscription
            </CardTitle>
            <CardDescription>
              Manage your subscription and payment methods
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Payment Information</p>
              <p className="text-sm text-muted-foreground">View invoices, update payment methods, and manage your subscription</p>
            </div>
            <Button variant="outline" disabled>
              Billing Settings (Coming Soon)
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <HelpCircle className="h-5 w-5 mr-2" />
            Need Help?
          </CardTitle>
          <CardDescription>
            Can't find what you're looking for? Get in touch with our support team.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button variant="outline" disabled>
              Contact Support (Coming Soon)
            </Button>
            <Button variant="outline" disabled>
              View Documentation (Coming Soon)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 