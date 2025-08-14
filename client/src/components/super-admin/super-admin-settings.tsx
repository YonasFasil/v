import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Mail, 
  CreditCard, 
  Save, 
  TestTube,
  Check,
  AlertCircle
} from "lucide-react";

interface SuperAdminConfig {
  stripe: {
    secretKey: string;
    publishableKey: string;
    webhookSecret: string;
  };
  email: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPass: string;
    fromName: string;
    fromEmail: string;
  };
}

export default function SuperAdminSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("stripe");

  // Fetch current configuration
  const { data: config, isLoading } = useQuery<SuperAdminConfig>({
    queryKey: ["/api/super-admin/config"],
    initialData: {
      stripe: {
        secretKey: "",
        publishableKey: "",
        webhookSecret: ""
      },
      email: {
        smtpHost: "",
        smtpPort: 587,
        smtpUser: "",
        smtpPass: "",
        fromName: "Venuine Support",
        fromEmail: ""
      }
    }
  });

  // Update configuration mutation
  const updateConfigMutation = useMutation({
    mutationFn: async (data: { type: 'stripe' | 'email', config: any }) => {
      return apiRequest(`/api/super-admin/config/${data.type}`, {
        method: "PUT",
        body: JSON.stringify(data.config),
      });
    },
    onSuccess: () => {
      toast({
        title: "Configuration Updated",
        description: "Settings have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/config"] });
    },
    onError: (error: any) => {
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
      return apiRequest("/api/super-admin/config/email/test", {
        method: "POST",
      });
    },
    onSuccess: () => {
      toast({
        title: "Test Email Sent",
        description: "Test email was sent successfully. Check your inbox.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Email Test Failed",
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

  const handleEmailSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const emailConfig = {
      smtpHost: formData.get("smtpHost") as string,
      smtpPort: parseInt(formData.get("smtpPort") as string),
      smtpUser: formData.get("smtpUser") as string,
      smtpPass: formData.get("smtpPass") as string,
      fromName: formData.get("fromName") as string,
      fromEmail: formData.get("fromEmail") as string,
    };
    
    updateConfigMutation.mutate({ type: 'email', config: emailConfig });
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

        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Email Configuration
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure SMTP settings for tenant communications and user verification
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtpHost">SMTP Host</Label>
                    <Input
                      id="smtpHost"
                      name="smtpHost"
                      placeholder="smtp.gmail.com"
                      defaultValue={config?.email?.smtpHost}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smtpPort">SMTP Port</Label>
                    <Input
                      id="smtpPort"
                      name="smtpPort"
                      type="number"
                      placeholder="587"
                      defaultValue={config?.email?.smtpPort}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtpUser">SMTP Username</Label>
                  <Input
                    id="smtpUser"
                    name="smtpUser"
                    type="email"
                    placeholder="your-email@gmail.com"
                    defaultValue={config?.email?.smtpUser}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtpPass">SMTP Password</Label>
                  <Input
                    id="smtpPass"
                    name="smtpPass"
                    type="password"
                    placeholder="App password or SMTP password"
                    defaultValue={config?.email?.smtpPass}
                  />
                  <p className="text-xs text-muted-foreground">
                    For Gmail, use an App Password rather than your regular password
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fromName">From Name</Label>
                    <Input
                      id="fromName"
                      name="fromName"
                      placeholder="Venuine Support"
                      defaultValue={config?.email?.fromName}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fromEmail">From Email</Label>
                    <Input
                      id="fromEmail"
                      name="fromEmail"
                      type="email"
                      placeholder="support@venuine.com"
                      defaultValue={config?.email?.fromEmail}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    disabled={updateConfigMutation.isPending}
                    className="flex-1"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateConfigMutation.isPending ? "Saving..." : "Save Email Configuration"}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => testEmailMutation.mutate()}
                    disabled={testEmailMutation.isPending}
                  >
                    <TestTube className="w-4 h-4 mr-2" />
                    {testEmailMutation.isPending ? "Testing..." : "Test Email"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Email Usage Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 mt-0.5" />
                  <div>
                    <strong>Customer Communication:</strong> All tenant customer emails will use this configuration
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 mt-0.5" />
                  <div>
                    <strong>User Verification:</strong> New user sign-up verification emails will be sent from this address
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                  <div>
                    <strong>Global Configuration:</strong> This email configuration will be used across all tenants for system-level communications
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}