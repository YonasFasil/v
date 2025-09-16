import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Mail, Save, Send } from "lucide-react";

interface EmailConfig {
  email: string;
  pass: string;
}

export default function SuperAdminEmailSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { data: emailConfig, isLoading } = useQuery<EmailConfig>({
    queryKey: ["/api/super-admin/email-config"],
    queryFn: () => apiRequest("/api/super-admin/email-config"),
    onSuccess: (data) => {
      if (data) {
        setEmail(data.email);
        setPassword(data.pass);
      }
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: (newConfig: EmailConfig) => 
      apiRequest("/api/super-admin/email-config", {
        method: 'POST',
        body: JSON.stringify(newConfig),
      }),
    onSuccess: () => {
      toast({ title: "Email configuration saved." });
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/email-config"] });
    },
    onError: (error: any) => {
      toast({ title: "Error saving configuration", description: error.message, variant: "destructive" });
    },
  });

  const testEmailMutation = useMutation({
    mutationFn: (testEmail: string) => 
      apiRequest("/api/super-admin/email/test", {
        method: "POST",
        body: JSON.stringify({ to: testEmail }),
      }),
    onSuccess: () => {
      toast({ title: "Test email sent successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error sending test email", description: error.message, variant: "destructive" });
    },
  });

  const handleSave = () => {
    updateConfigMutation.mutate({ email, pass: password });
  };

  const handleTest = () => {
    const to = prompt("Enter email address to send a test to:");
    if (to) {
      testEmailMutation.mutate(to);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Global Email Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">Gmail Email Address</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your-email@gmail.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Gmail App Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={updateConfigMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {updateConfigMutation.isPending ? "Saving..." : "Save"}
          </Button>
          <Button variant="outline" onClick={handleTest} disabled={testEmailMutation.isPending}>
            <Send className="w-4 h-4 mr-2" />
            {testEmailMutation.isPending ? "Sending..." : "Send Test Email"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
