import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  LifeBuoy, 
  MessageCircle, 
  Mail, 
  FileText, 
  HelpCircle, 
  Clock,
  Phone,
  ExternalLink,
  BookOpen,
  Video
} from "lucide-react";

export default function SupportPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Support Center</h1>
        <p className="text-muted-foreground mt-2">
          Get help with TenantArmor and learn how to make the most of your tenant protection tools
        </p>
      </div>

      {/* Quick Help Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageCircle className="h-5 w-5 mr-2 text-blue-500" />
              Live Chat
            </CardTitle>
            <CardDescription>
              Get instant help from our support team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm">
                <Clock className="h-4 w-4 mr-2" />
                <span>Mon-Fri, 9AM-5PM EST</span>
              </div>
              <Badge variant="outline" className="text-green-600">
                Response within 2 minutes
              </Badge>
            </div>
            <Button className="w-full" disabled>
              <MessageCircle className="h-4 w-4 mr-2" />
              Start Live Chat (Coming Soon)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="h-5 w-5 mr-2 text-green-500" />
              Email Support
            </CardTitle>
            <CardDescription>
              Send us a detailed message and we'll get back to you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm">
                <Clock className="h-4 w-4 mr-2" />
                <span>Response within 24 hours</span>
              </div>
              <Badge variant="outline" className="text-blue-600">
                Detailed responses
              </Badge>
            </div>
            <Button variant="outline" className="w-full" disabled>
              <Mail className="h-4 w-4 mr-2" />
              Send Email (Coming Soon)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Phone className="h-5 w-5 mr-2 text-purple-500" />
              Phone Support
            </CardTitle>
            <CardDescription>
              Speak directly with a tenant rights specialist
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm">
                <Clock className="h-4 w-4 mr-2" />
                <span>By appointment only</span>
              </div>
              <Badge variant="outline" className="text-purple-600">
                Premium support
              </Badge>
            </div>
            <Button variant="outline" className="w-full" disabled>
              <Phone className="h-4 w-4 mr-2" />
              Schedule Call (Coming Soon)
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Help Resources */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="h-5 w-5 mr-2" />
              Help Articles
            </CardTitle>
            <CardDescription>
              Browse our comprehensive knowledge base
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium text-sm">Getting Started with Lease Analysis</h4>
                <p className="text-xs text-muted-foreground mt-1">Learn how to upload and analyze your lease document</p>
              </div>
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium text-sm">Understanding Your Analysis Results</h4>
                <p className="text-xs text-muted-foreground mt-1">How to interpret risk levels and recommendations</p>
              </div>
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium text-sm">Eviction Response Guide</h4>
                <p className="text-xs text-muted-foreground mt-1">Step-by-step help for eviction situations</p>
              </div>
            </div>
            <Button variant="outline" className="w-full" disabled>
              <ExternalLink className="h-4 w-4 mr-2" />
              View All Articles (Coming Soon)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Video className="h-5 w-5 mr-2" />
              Video Tutorials
            </CardTitle>
            <CardDescription>
              Watch step-by-step video guides
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium text-sm">How to Upload Your Lease</h4>
                <p className="text-xs text-muted-foreground mt-1">3-minute tutorial on document upload process</p>
              </div>
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium text-sm">Reading Your Analysis Report</h4>
                <p className="text-xs text-muted-foreground mt-1">Understanding clauses, issues, and recommendations</p>
              </div>
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium text-sm">AI Consultation Features</h4>
                <p className="text-xs text-muted-foreground mt-1">Getting the most from your AI assistant</p>
              </div>
            </div>
            <Button variant="outline" className="w-full" disabled>
              <Video className="h-4 w-4 mr-2" />
              Watch Tutorials (Coming Soon)
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <HelpCircle className="h-5 w-5 mr-2" />
            Frequently Asked Questions
          </CardTitle>
          <CardDescription>
            Quick answers to common questions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-l-4 border-primary pl-4">
              <h4 className="font-medium">How accurate is the AI lease analysis?</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Our AI is trained on thousands of lease agreements and tenant law, but results should be used as guidance alongside professional legal advice.
              </p>
            </div>
            <div className="border-l-4 border-primary pl-4">
              <h4 className="font-medium">Is my lease document data secure?</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Yes, all documents are encrypted in transit and at rest. We follow enterprise-grade security practices to protect your sensitive information.
              </p>
            </div>
            <div className="border-l-4 border-primary pl-4">
              <h4 className="font-medium">What file formats are supported?</h4>
              <p className="text-sm text-muted-foreground mt-1">
                We support PDF files and images (JPG, PNG). You can also take photos of your lease with your phone camera.
              </p>
            </div>
            <div className="border-l-4 border-primary pl-4">
              <h4 className="font-medium">Can I get a refund if I'm not satisfied?</h4>
              <p className="text-sm text-muted-foreground mt-1">
                We offer a 30-day money-back guarantee on all purchases. Contact support if you need assistance.
              </p>
            </div>
          </div>
          <div className="mt-6">
            <Button variant="outline" disabled>
              <ExternalLink className="h-4 w-4 mr-2" />
              View All FAQs (Coming Soon)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Support */}
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="flex items-center text-red-600 dark:text-red-400">
            <LifeBuoy className="h-5 w-5 mr-2" />
            Emergency Support
          </CardTitle>
          <CardDescription>
            Facing an urgent eviction or legal situation?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm">
              If you're dealing with an immediate eviction notice or urgent tenant rights issue, we can provide expedited support and connect you with legal resources in your area.
            </p>
            <div className="flex gap-4">
              <Button variant="destructive" disabled>
                <Phone className="h-4 w-4 mr-2" />
                Emergency Hotline (Coming Soon)
              </Button>
              <Button variant="outline" disabled>
                <FileText className="h-4 w-4 mr-2" />
                Legal Resources (Coming Soon)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 