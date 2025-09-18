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
  Eye,
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
  provider: string | null;
  email: string | null;
  enabled: boolean;
}

export default function SuperAdminSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("stripe");
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [previewType, setPreviewType] = useState<"verification" | "proposal" | "notification">("verification");

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

  // Fetch email configuration separately with aggressive refetching
  const { data: emailConfig, isLoading: emailLoading, refetch: refetchEmailConfig, error: emailError } = useQuery<EmailConfig>({
    queryKey: ["/api/super-admin/global-email/status"],
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache the data
    refetchOnMount: "always", // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchInterval: false, // Don't poll
    retry: 1, // Only retry once on failure
    enabled: true, // Always enabled
    networkMode: "always" // Fetch even when offline
  });

  // Force refresh of email configuration on component mount and tab change
  useEffect(() => {
    if (activeTab === 'email') {
      console.log('Email tab active, refetching config...');
      refetchEmailConfig();
    }
  }, [activeTab, refetchEmailConfig]);

  // Log email config state for debugging
  useEffect(() => {
    console.log('Email config state:', {
      emailConfig,
      isLoading: emailLoading,
      error: emailError,
      configured: emailConfig?.configured,
      rawData: JSON.stringify(emailConfig)
    });
  }, [emailConfig, emailLoading, emailError]);

  // Force initial fetch on mount
  useEffect(() => {
    console.log('Component mounted, fetching email config...');
    refetchEmailConfig();
  }, []);

  // Update configuration mutation
  const updateConfigMutation = useMutation({
    mutationFn: async (data: { type: 'stripe' | 'email', config: any }) => {
      const endpoint = data.type === 'email'
        ? '/api/email-configure'
        : `/api/super-admin/config/${data.type}`;
      return apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(data.config),
      });
    },
    onSuccess: async (_, variables) => {
      toast({
        title: "Configuration Updated",
        description: "Settings have been saved successfully.",
      });
      if (variables.type === 'email') {
        // Force refetch of email configuration
        queryClient.removeQueries({ queryKey: ["/api/super-admin/global-email/status"] }); // Remove from cache completely
        await queryClient.invalidateQueries({ queryKey: ["/api/super-admin/global-email/status"] });
        await refetchEmailConfig();
        // Double check after a short delay
        setTimeout(() => {
          refetchEmailConfig();
        }, 500);
      } else {
        await queryClient.invalidateQueries({ queryKey: ["/api/super-admin/config"] });
      }
    },
    onError: (error: any, variables) => {
      console.error('Configuration update error:', error, 'Variables:', variables);
      toast({
        title: "Error",
        description: error.message || "Failed to update configuration.",
        variant: "destructive",
      });
    },
  });

  // Test email configuration mutation
  const testEmailMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/super-admin/global-email/test", {
        method: "POST",
        body: JSON.stringify({ testEmail: testEmailAddress || emailConfig?.email || "test@example.com" }),
      });
    },
    onSuccess: () => {
      toast({
        title: "✅ Test Email Sent",
        description: "Basic test email was sent successfully. Check your inbox.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Email Test Failed",
        description: error.message || "Failed to send test email.",
        variant: "destructive",
      });
    },
  });

  // Test verification email mutation
  const testVerificationMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/global-email/send-verification", {
        method: "POST",
        body: JSON.stringify({
          email: testEmailAddress || emailConfig?.email || "test@example.com",
          customerName: "Test Customer",
          verificationToken: "test-token-" + Date.now(),
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: "✅ Verification Email Sent",
        description: "Customer verification email sent successfully. Check your inbox.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Verification Email Failed",
        description: error.message || "Failed to send verification email.",
        variant: "destructive",
      });
    },
  });

  // Test proposal email mutation
  const testProposalMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/global-email/send-communication", {
        method: "POST",
        body: JSON.stringify({
          type: "proposal",
          to: testEmailAddress || emailConfig?.email || "test@example.com",
          subject: "Test Event Proposal",
          customerName: "Test Customer",
          eventName: "Sample Wedding Event",
          proposalViewUrl: "https://venue-project.com/proposals/test-123",
          tenantName: "Venue Project Demo",
          eventDate: "December 15, 2024",
          venue: "Grand Ballroom",
          customMessage: "Thank you for choosing us for your special day!"
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: "✅ Proposal Email Sent",
        description: "Event proposal email sent successfully. Check your inbox.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Proposal Email Failed",
        description: error.message || "Failed to send proposal email.",
        variant: "destructive",
      });
    },
  });

  // Test notification email mutation
  const testNotificationMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/global-email/send-communication", {
        method: "POST",
        body: JSON.stringify({
          type: "notification",
          to: testEmailAddress || emailConfig?.email || "test@example.com",
          subject: "Booking Confirmation",
          customerName: "Test Customer",
          notificationType: "booking_confirmed",
          tenantName: "Venue Project Demo",
          content: "Your booking has been confirmed! We look forward to hosting your event on December 15th, 2024.",
          actionUrl: "https://venue-project.com/dashboard/bookings",
          actionText: "View Booking Details"
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: "✅ Notification Email Sent",
        description: "Booking notification email sent successfully. Check your inbox.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Notification Email Failed",
        description: error.message || "Failed to send notification email.",
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

  const handleEmailSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const emailConfigData = {
      provider: "gmail",
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      enabled: formData.get("enabled") === "on",
    };

    // Validate required fields
    if (!emailConfigData.email) {
      toast({
        title: "Validation Error",
        description: "Email address is required",
        variant: "destructive"
      });
      return;
    }

    if (emailConfigData.enabled && !emailConfigData.password) {
      toast({
        title: "Validation Error",
        description: "App password is required when email service is enabled",
        variant: "destructive"
      });
      return;
    }

    console.log('Submitting email config:', emailConfigData);
    updateConfigMutation.mutate({ type: 'email', config: emailConfigData });
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
            Email Configuration
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
                  <div className={`p-2 rounded-lg ${emailConfig?.configured && emailConfig?.enabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <Mail className={`w-6 h-6 ${emailConfig?.configured && emailConfig?.enabled ? 'text-green-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Global Email Service</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Unified email system for customer verification and tenant communications
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {emailLoading ? (
                    <Badge variant="secondary">
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Loading...
                    </Badge>
                  ) : emailConfig?.configured === true ? (
                    emailConfig.enabled ? (
                      <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Configured but Disabled
                      </Badge>
                    )
                  ) : (
                    <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
                      <XCircle className="w-3 h-3 mr-1" />
                      Not Configured
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            {emailConfig && emailConfig.configured && emailConfig.enabled && (
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <Globe className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Provider</p>
                      <p className="text-xs text-blue-700">{emailConfig?.provider || 'Gmail'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                    <Mail className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium text-purple-900">Email Address</p>
                      <p className="text-xs text-purple-700 truncate">{emailConfig?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <Shield className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-900">Security</p>
                      <p className="text-xs text-green-700">App Password</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Configuration Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Email Configuration
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure Gmail SMTP for global email delivery across all tenants
              </p>
            </CardHeader>
            <CardContent>
              {emailLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  <span>Loading configuration...</span>
                </div>
              ) : (
                <form onSubmit={handleEmailSubmit} className="space-y-6">
                  {/* Enable Toggle */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Zap className="w-5 h-5 text-blue-600" />
                      <div>
                        <Label htmlFor="enabled" className="text-base font-medium">
                          Enable Global Email Service
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Activate email delivery for all customer and tenant communications
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      id="enabled"
                      name="enabled"
                      defaultChecked={emailConfig?.enabled}
                      className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>

                  {/* Email Configuration */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-base font-medium">
                        Gmail Email Address
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="your-email@gmail.com"
                        defaultValue={emailConfig?.email || ""}
                        className="h-12"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        This will be the sender address for all system emails
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-base font-medium">
                        Gmail App Password
                      </Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder={emailConfig?.configured ? "••••••••••••" : "Enter Gmail app password"}
                        defaultValue=""
                        className="h-12"
                      />
                      <p className="text-xs text-muted-foreground">
                        Required for secure SMTP authentication
                      </p>
                    </div>
                  </div>

                  {/* Setup Instructions */}
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <p className="font-medium">Gmail App Password Setup:</p>
                        <ol className="text-sm space-y-1 ml-4 list-decimal">
                          <li>Go to your Google Account settings</li>
                          <li>Navigate to Security → 2-Step Verification</li>
                          <li>Scroll down and click "App passwords"</li>
                          <li>Generate a new app password for "Mail"</li>
                          <li>Copy and paste the 16-character password here</li>
                        </ol>
                        <a
                          href="https://support.google.com/accounts/answer/185833"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Learn more <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </AlertDescription>
                  </Alert>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      disabled={updateConfigMutation.isPending}
                      className="flex-1 h-12"
                    >
                      {updateConfigMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      {updateConfigMutation.isPending ? "Saving..." : "Save Configuration"}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Email Testing Suite */}
          {emailConfig && emailConfig.configured && emailConfig.enabled && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="w-5 h-5" />
                  Email Testing Suite
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Test different email types to ensure everything is working correctly
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Test Email Address */}
                <div className="space-y-2">
                  <Label htmlFor="testEmail" className="text-base font-medium">
                    Test Email Address
                  </Label>
                  <Input
                    id="testEmail"
                    type="email"
                    placeholder={emailConfig?.email || "Enter test email address"}
                    value={testEmailAddress}
                    onChange={(e) => setTestEmailAddress(e.target.value)}
                    className="h-12"
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to send test emails to the configured email address
                  </p>
                </div>

                <Separator />

                {/* Test Buttons Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Basic Test */}
                  <div className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-blue-600" />
                      <h4 className="font-medium">Basic Connection Test</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Test SMTP connection and authentication
                    </p>
                    <Button
                      onClick={() => testEmailMutation.mutate()}
                      disabled={testEmailMutation.isPending}
                      variant="outline"
                      className="w-full"
                    >
                      {testEmailMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      {testEmailMutation.isPending ? "Sending..." : "Send Test Email"}
                    </Button>
                  </div>

                  {/* Verification Email Test */}
                  <div className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-green-600" />
                      <h4 className="font-medium">Customer Verification</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Test customer signup verification email
                    </p>
                    <Button
                      onClick={() => testVerificationMutation.mutate()}
                      disabled={testVerificationMutation.isPending}
                      variant="outline"
                      className="w-full"
                    >
                      {testVerificationMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Users className="w-4 h-4 mr-2" />
                      )}
                      {testVerificationMutation.isPending ? "Sending..." : "Test Verification"}
                    </Button>
                  </div>

                  {/* Proposal Email Test */}
                  <div className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center gap-2">
                      <Mail className="w-5 h-5 text-purple-600" />
                      <h4 className="font-medium">Event Proposal</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Test tenant-to-customer proposal email
                    </p>
                    <Button
                      onClick={() => testProposalMutation.mutate()}
                      disabled={testProposalMutation.isPending}
                      variant="outline"
                      className="w-full"
                    >
                      {testProposalMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Mail className="w-4 h-4 mr-2" />
                      )}
                      {testProposalMutation.isPending ? "Sending..." : "Test Proposal"}
                    </Button>
                  </div>

                  {/* Notification Email Test */}
                  <div className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-amber-600" />
                      <h4 className="font-medium">Booking Notification</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Test booking confirmation notification
                    </p>
                    <Button
                      onClick={() => testNotificationMutation.mutate()}
                      disabled={testNotificationMutation.isPending}
                      variant="outline"
                      className="w-full"
                    >
                      {testNotificationMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      {testNotificationMutation.isPending ? "Sending..." : "Test Notification"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Email Service Usage Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                Email Service Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-green-900">✅ Customer Communications</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>New customer signup verification emails</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Password reset and account recovery</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Event booking confirmations</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium text-blue-900">🏢 Tenant Communications</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Event proposals and quotes</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Booking status notifications</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Payment reminders and receipts</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Global Configuration:</strong> This email setup affects all tenants in the system.
                  Ensure the email address is monitored and has appropriate sending limits for your expected volume.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}