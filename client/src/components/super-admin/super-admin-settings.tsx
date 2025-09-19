import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Mail,
  CreditCard,
  Save,
  TestTube,
  Check,
  AlertCircle,
  Send,
  Loader2,
  CheckCircle,
  XCircle,
  Info,
  ExternalLink,
  Zap,
  Globe,
  Users,
  Shield,
  Settings
} from "lucide-react";

interface SuperAdminConfig {
  stripe: {
    secretKey: string;
    publishableKey: string;
    webhookSecret: string;
  };
}

interface EmailConfig {
  configured: boolean;
  email: string | null;
  enabled: boolean;
}

export default function SuperAdminSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("stripe");
  const [testEmailAddress, setTestEmailAddress] = useState("");

  // Fetch current configuration
  const { data: config, isLoading } = useQuery<SuperAdminConfig>({
    queryKey: ["/api/super-admin/config"],
    initialData: {
      stripe: {
        secretKey: "",
        publishableKey: "",
        webhookSecret: ""
      }
    }
  });

  // Fetch email configuration from environment variables only
  const { data: emailConfig, isLoading: emailLoading, refetch: refetchEmailConfig } = useQuery<EmailConfig>({
    queryKey: ["/api/debug-email-config"],
    queryFn: async () => {
      const response = await fetch('/api/debug-email-config', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('super_admin_token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch email status');
      const result = await response.json();

      return {
        configured: result.debug?.environment?.hasGmailEmail && result.debug?.environment?.hasGmailPassword,
        email: process.env.GLOBAL_EMAIL_ADDRESS || 'Environment variable not visible',
        enabled: result.debug?.environment?.hasGmailEmail && result.debug?.environment?.hasGmailPassword
      };
    },
    staleTime: 0,
    refetchOnMount: "always"
  });

  // Update configuration mutation
  const updateConfigMutation = useMutation({
    mutationFn: async (data: { type: 'stripe', config: any }) => {
      return apiRequest(`/api/super-admin/config/${data.type}`, {
        method: 'POST',
        body: JSON.stringify(data.config),
      });
    },
    onSuccess: async () => {
      toast({
        title: "Configuration Updated",
        description: "Settings have been saved successfully.",
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/super-admin/config"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update configuration.",
        variant: "destructive",
      });
    },
  });

  // Test proposal email mutation
  const testProposalMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/send-communication-email", {
        method: "POST",
        body: JSON.stringify({
          type: "proposal",
          to: testEmailAddress || "test@example.com",
          subject: "Test Event Proposal",
          customerName: "Test Customer",
          content: "This is a test proposal email from your IMAP configuration!"
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: "✅ Test Email Sent",
        description: "Test email sent successfully using your IMAP configuration!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Test Email Failed",
        description: error.message || "Failed to send test email.",
        variant: "destructive",
      });
    },
  });

  const handleStripeSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const stripeConfig = {
      secretKey: formData.get("secretKey") as string,
      publishableKey: formData.get("publishableKey") as string,
      webhookSecret: formData.get("webhookSecret") as string,
    };

    updateConfigMutation.mutate({ type: 'stripe', config: stripeConfig });
  };

  if (isLoading) {
    return <div>Loading configuration...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Super Admin Settings</h2>
        <p className="text-muted-foreground">Configure global platform settings</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="stripe" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Stripe Configuration
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            IMAP Email Status
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stripe" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Stripe Configuration
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure Stripe for tenant subscription billing and payments
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleStripeSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="secretKey">Secret Key</Label>
                  <Input
                    id="secretKey"
                    name="secretKey"
                    type="password"
                    placeholder="sk_live_..."
                    defaultValue={config?.stripe?.secretKey}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Your Stripe secret key (starts with sk_live_ or sk_test_)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="publishableKey">Publishable Key</Label>
                  <Input
                    id="publishableKey"
                    name="publishableKey"
                    placeholder="pk_live_..."
                    defaultValue={config?.stripe?.publishableKey}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Your Stripe publishable key (starts with pk_live_ or pk_test_)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="webhookSecret">Webhook Secret</Label>
                  <Input
                    id="webhookSecret"
                    name="webhookSecret"
                    type="password"
                    placeholder="whsec_..."
                    defaultValue={config?.stripe?.webhookSecret}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Your Stripe webhook endpoint secret for secure webhook verification
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={updateConfigMutation.isPending}
                  className="w-full"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateConfigMutation.isPending ? "Saving..." : "Save Stripe Configuration"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-6">
          {/* Status Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${emailConfig?.configured ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <Mail className={`w-6 h-6 ${emailConfig?.configured ? 'text-green-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <CardTitle className="text-xl">IMAP Email Service</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Email system configured via Vercel environment variables
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {emailLoading ? (
                    <Badge variant="secondary">
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Loading...
                    </Badge>
                  ) : emailConfig?.configured ? (
                    <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
                      <XCircle className="w-3 h-3 mr-1" />
                      Not Configured
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            {emailConfig?.configured && (
              <CardContent>
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">
                    <div className="space-y-2">
                      <div className="font-medium">✅ Email System Active</div>
                      <div className="text-sm">
                        <strong>Configuration Source:</strong> Vercel Environment Variables
                      </div>
                      <div className="text-sm">
                        <strong>Sending emails from:</strong> Your configured IMAP email address
                      </div>
                      <div className="text-sm">
                        <strong>System Type:</strong> IMAP/SMTP (cPanel or Custom Mail Server)
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              </CardContent>
            )}
          </Card>

          {/* Configuration Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Environment Configuration Status
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Your email system is configured via Vercel environment variables
              </p>
            </CardHeader>
            <CardContent>
              {emailLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  <span>Checking configuration...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-3">
                        <div>
                          <strong>Required Environment Variables in Vercel:</strong>
                        </div>
                        <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-sm">
                          <div>GLOBAL_EMAIL_ADDRESS=notifications@venuine.com</div>
                          <div>GLOBAL_EMAIL_PASSWORD=your-email-password</div>
                          <div>GLOBAL_EMAIL_HOST=mail.venuine.com</div>
                          <div>GLOBAL_EMAIL_PORT=587</div>
                        </div>
                        <div className="text-sm space-y-1">
                          <div>✅ <strong>GLOBAL_EMAIL_ADDRESS:</strong> {emailConfig?.configured ? "✓ Configured" : "❌ Missing"}</div>
                          <div>✅ <strong>GLOBAL_EMAIL_PASSWORD:</strong> {emailConfig?.configured ? "✓ Configured" : "❌ Missing"}</div>
                          <div>✅ <strong>GLOBAL_EMAIL_HOST:</strong> For cPanel/SMTP settings</div>
                          <div>✅ <strong>GLOBAL_EMAIL_PORT:</strong> Usually 587 for SMTP</div>
                        </div>
                        {!emailConfig?.configured && (
                          <div className="text-red-600 text-sm">
                            <strong>⚠️ Email system not configured.</strong> Please add the required environment variables in your Vercel dashboard.
                          </div>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>

                  <Button
                    onClick={() => refetchEmailConfig()}
                    variant="outline"
                    className="w-full"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Refresh Configuration Status
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Email Testing */}
          {emailConfig?.configured && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="w-5 h-5" />
                  Test Email System
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Send a test email to verify your IMAP configuration is working
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="testEmail">Test Email Address</Label>
                  <Input
                    id="testEmail"
                    type="email"
                    placeholder="Enter email to test with"
                    value={testEmailAddress}
                    onChange={(e) => setTestEmailAddress(e.target.value)}
                    className="h-12"
                  />
                  <p className="text-xs text-muted-foreground">
                    We'll send a test proposal email to this address
                  </p>
                </div>

                <Button
                  onClick={() => testProposalMutation.mutate()}
                  disabled={testProposalMutation.isPending || !testEmailAddress}
                  className="w-full h-12"
                >
                  {testProposalMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  {testProposalMutation.isPending ? "Sending..." : "Send Test Email"}
                </Button>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2 text-sm">
                      <div><strong>This test will verify:</strong></div>
                      <ul className="ml-4 space-y-1 list-disc">
                        <li>SMTP connection to your email server</li>
                        <li>Email authentication and delivery</li>
                        <li>Reply-to address configuration</li>
                        <li>Email formatting and content</li>
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

          {/* IMAP Monitoring */}
          {emailConfig?.configured && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Incoming Email Monitoring
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Monitor your IMAP inbox for customer replies and automatically add them to communication history
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="font-medium">How Customer Reply Detection Works:</div>
                      <div className="text-sm space-y-1">
                        <div>• Customer receives proposal with reply-to: <code>notifications+token@venuine.com</code></div>
                        <div>• Customer replies from their email client</div>
                        <div>• Click "Check for Customer Replies" to scan your inbox</div>
                        <div>• New replies are automatically added to communication history</div>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/check-email-replies', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json'
                        }
                      });

                      const result = await response.json();

                      if (result.success) {
                        toast({
                          title: "✅ Email Check Complete",
                          description: `Found ${result.newReplies?.length || 0} new customer replies`,
                        });
                      } else {
                        toast({
                          title: "❌ Email Check Failed",
                          description: result.message || "Could not check for email replies",
                          variant: "destructive"
                        });
                      }
                    } catch (error) {
                      toast({
                        title: "❌ Check Failed",
                        description: "Network error while checking for email replies",
                        variant: "destructive"
                      });
                    }
                  }}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Check for Customer Replies
                </Button>

                <Alert className="bg-amber-50 border-amber-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2 text-sm">
                      <div className="font-medium">Important Notes:</div>
                      <ul className="ml-4 space-y-1 list-disc">
                        <li>Click the button periodically to check for new customer replies</li>
                        <li>Uses port 993 (IMAP) for reading emails, port 465 (SMTP) for sending</li>
                        <li>Replies are tracked using secure tokens in the reply-to address</li>
                        <li>Only emails with valid tokens are processed and added to history</li>
                        <li>Duplicate emails are automatically prevented</li>
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

          {/* Email Service Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                Email Service Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-green-900">✅ Customer Communications</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Event proposals and quotes</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Booking confirmations</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Payment notifications</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium text-blue-900">🔧 Technical Features</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Secure reply-to tokens</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Communication history tracking</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Professional email templates</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="font-medium">🔒 Security & Privacy</div>
                    <div className="text-sm">
                      Your email configuration is stored securely in Vercel environment variables.
                      Only administrators can access these settings. All customer communications
                      are logged with secure tokens for reply tracking.
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}