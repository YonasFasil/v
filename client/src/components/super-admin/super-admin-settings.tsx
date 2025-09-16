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
  Send,
  Check,
  AlertCircle
} from "lucide-react";

interface SuperAdminConfig {
  stripe: {
    secretKey: string;
    publishableKey: string;
    webhookSecret: string;
  };
}

interface EmailConfig {
  provider: string;
  email: string;
  password: string;
  enabled: boolean;
}

export default function SuperAdminSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("email");

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

  // Fetch email configuration separately
  const { data: emailConfig, isLoading: emailLoading } = useQuery<EmailConfig>({
    queryKey: ["/api/super-admin/config/email"],
    queryFn: () => apiRequest("/api/super-admin/config/email"),
    initialData: {
      provider: "gmail",
      email: "",
      password: "",
      enabled: false
    }
  });

  // Update configuration mutation
  const updateConfigMutation = useMutation({
    mutationFn: async (data: { type: 'stripe' | 'email', config: any }) => {
      return apiRequest(`/api/super-admin/config/${data.type}`, {
        method: 'POST',
        body: JSON.stringify(data.config),
      });
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Configuration Updated",
        description: "Settings have been saved successfully.",
      });
      if (variables.type === 'email') {
        queryClient.invalidateQueries({ queryKey: ["/api/super-admin/config/email"] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/super-admin/config"] });
      }
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
    mutationFn: async (testEmail: string) => {
      return apiRequest("/api/super-admin/email/test", {
        method: "POST",
        body: JSON.stringify({ testEmail }),
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

  const handleEmailSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const emailConfigData = {
      provider: "gmail",
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      enabled: formData.get("enabled") === "on",
    };

    updateConfigMutation.mutate({ type: 'email', config: emailConfigData });
  };
  
  const handleTestEmail = () => {
    const testEmail = prompt("Enter the email address to send a test email to:");
    if (testEmail) {
      testEmailMutation.mutate(testEmail);
    }
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

        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Gmail Email Configuration
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure Gmail SMTP for customer verification emails and notifications
              </p>
            </CardHeader>
            <CardContent>
              {emailLoading ? (
                <div>Loading email configuration...</div>
              ) : (
                <form onSubmit={handleEmailSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="enabled"
                        name="enabled"
                        defaultChecked={emailConfig?.enabled}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <Label htmlFor="enabled" className="text-sm font-medium">
                        Enable Email Service
                      </Label>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Gmail Email Address</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="your-email@gmail.com"
                        defaultValue={emailConfig?.email}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Gmail App Password</Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder={emailConfig?.password ? "••••••••" : "Enter Gmail app password"}
                        defaultValue=""
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={updateConfigMutation.isPending}
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {updateConfigMutation.isPending ? "Saving..." : "Save Configuration"}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleTestEmail}
                      disabled={testEmailMutation.isPending || !emailConfig?.enabled}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {testEmailMutation.isPending ? "Sending..." : "Send Test Email"}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
