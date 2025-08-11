import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertEmailSettingSchema, type EmailSetting, type InsertEmailSetting } from "@shared/schema";
import { Mail, Trash2, Check, TestTube, Settings, Shield, Send } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function EmailSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingSetting, setEditingSetting] = useState<EmailSetting | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState("");

  const { data: emailSettings = [], isLoading } = useQuery<EmailSetting[]>({
    queryKey: ["/api/admin/email-settings"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertEmailSetting) => {
      return apiRequest("POST", "/api/admin/email-settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-settings"] });
      setShowCreateDialog(false);
      setEditingSetting(null);
      toast({
        title: "Success",
        description: "Email configuration saved successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save email configuration",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertEmailSetting> }) => {
      return apiRequest("PUT", `/api/admin/email-settings/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-settings"] });
      setEditingSetting(null);
      toast({
        title: "Success",
        description: "Email configuration updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update email configuration",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/email-settings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-settings"] });
      toast({
        title: "Success",
        description: "Email configuration deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete email configuration",
        variant: "destructive",
      });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/admin/email-settings/${id}/set-default`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-settings"] });
      toast({
        title: "Success",
        description: "Default email configuration updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to set default configuration",
        variant: "destructive",
      });
    },
  });

  const testEmailMutation = useMutation({
    mutationFn: async ({ id, testEmail }: { id: string; testEmail: string }) => {
      return apiRequest("POST", `/api/admin/email-settings/${id}/test`, { testEmail });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-settings"] });
      setTestingId(null);
      setTestEmail("");
      toast({
        title: "Success",
        description: "Test email sent successfully",
      });
    },
    onError: (error: any) => {
      setTestingId(null);
      toast({
        title: "Error",
        description: error.message || "Failed to send test email",
        variant: "destructive",
      });
    },
  });

  const form = useForm<InsertEmailSetting>({
    resolver: zodResolver(insertEmailSettingSchema),
    defaultValues: {
      provider: "gmail",
      smtpHost: "smtp.gmail.com",
      smtpPort: 587,
      smtpSecure: true,
      fromName: "VENUIN Platform",
      isActive: true,
      isDefault: false,
    },
  });

  const onSubmit = (data: InsertEmailSetting) => {
    if (editingSetting) {
      updateMutation.mutate({ id: editingSetting.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (setting: EmailSetting) => {
    setEditingSetting(setting);
    form.reset({
      provider: setting.provider,
      smtpHost: setting.smtpHost || undefined,
      smtpPort: setting.smtpPort || undefined,
      smtpSecure: setting.smtpSecure,
      username: setting.username,
      password: setting.password,
      fromName: setting.fromName,
      fromEmail: setting.fromEmail,
      replyToEmail: setting.replyToEmail || undefined,
      isActive: setting.isActive,
      isDefault: setting.isDefault,
    });
    setShowCreateDialog(true);
  };

  const handleTestEmail = (settingId: string) => {
    if (!testEmail) {
      toast({
        title: "Error",
        description: "Please enter a test email address",
        variant: "destructive",
      });
      return;
    }
    setTestingId(settingId);
    testEmailMutation.mutate({ id: settingId, testEmail });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Email Settings</h1>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="h-32 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Mail className="h-8 w-8" />
            Email Configuration
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure Gmail and SMTP settings for tenant verification and notification emails
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingSetting(null);
              form.reset({
                provider: "gmail",
                smtpHost: "smtp.gmail.com",
                smtpPort: 587,
                smtpSecure: true,
                fromName: "VENUIN Platform",
                isActive: true,
                isDefault: false,
              });
            }}>
              <Settings className="h-4 w-4 mr-2" />
              Add Configuration
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSetting ? "Edit Email Configuration" : "Add Email Configuration"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="provider"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Provider</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select provider" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="gmail">Gmail</SelectItem>
                            <SelectItem value="smtp">SMTP</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fromName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>From Name</FormLabel>
                        <FormControl>
                          <Input placeholder="VENUIN Platform" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="notifications@yourplatform.com" {...field} />
                        </FormControl>
                        <FormDescription>
                          Gmail email address or SMTP username
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="App password for Gmail" {...field} />
                        </FormControl>
                        <FormDescription>
                          Use Gmail App Password for security
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fromEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>From Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="noreply@yourplatform.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="replyToEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reply To Email (Optional)</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="support@yourplatform.com" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="smtpHost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SMTP Host</FormLabel>
                        <FormControl>
                          <Input placeholder="smtp.gmail.com" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="smtpPort"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SMTP Port</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="587" 
                            {...field}
                            value={field.value || ""}
                            onChange={e => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="smtpSecure"
                    render={({ field }) => (
                      <FormItem className="flex flex-col justify-end">
                        <FormLabel>Use TLS/SSL</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Switch
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>Active</FormLabel>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isDefault"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Switch
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>Set as Default</FormLabel>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateDialog(false);
                      setEditingSetting(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingSetting ? "Update Configuration" : "Add Configuration"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {emailSettings.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Email Configurations</h3>
              <p className="text-muted-foreground mb-4">
                Add your first email configuration to enable tenant notifications and verification emails.
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Add Configuration
              </Button>
            </CardContent>
          </Card>
        ) : (
          emailSettings.map((setting) => (
            <Card key={setting.id} className={setting.isDefault ? "border-blue-200 bg-blue-50" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      <CardTitle className="text-lg">{setting.fromName}</CardTitle>
                    </div>
                    <div className="flex gap-2">
                      {setting.isDefault && (
                        <Badge variant="default" className="bg-blue-100 text-blue-800">
                          <Check className="h-3 w-3 mr-1" />
                          Default
                        </Badge>
                      )}
                      {setting.isActive ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                      {setting.testEmailSent && (
                        <Badge variant="outline" className="bg-purple-100 text-purple-800">
                          <TestTube className="h-3 w-3 mr-1" />
                          Tested
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!setting.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDefaultMutation.mutate(setting.id)}
                        disabled={setDefaultMutation.isPending}
                      >
                        <Shield className="h-4 w-4 mr-1" />
                        Set Default
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(setting)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteMutation.mutate(setting.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Provider:</strong> {setting.provider.toUpperCase()}</p>
                    <p><strong>From Email:</strong> {setting.fromEmail}</p>
                    <p><strong>Username:</strong> {setting.username}</p>
                  </div>
                  <div>
                    <p><strong>SMTP Host:</strong> {setting.smtpHost || "N/A"}</p>
                    <p><strong>SMTP Port:</strong> {setting.smtpPort || "N/A"}</p>
                    <p><strong>Secure:</strong> {setting.smtpSecure ? "Yes" : "No"}</p>
                  </div>
                </div>
                
                <div className="mt-4 flex items-center gap-2">
                  <Input
                    placeholder="test@example.com"
                    value={testingId === setting.id ? testEmail : ""}
                    onChange={(e) => {
                      if (testingId === setting.id) {
                        setTestEmail(e.target.value);
                      } else {
                        setTestingId(setting.id);
                        setTestEmail(e.target.value);
                      }
                    }}
                    className="max-w-xs"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestEmail(setting.id)}
                    disabled={testEmailMutation.isPending && testingId === setting.id}
                  >
                    <Send className="h-4 w-4 mr-1" />
                    Send Test Email
                  </Button>
                </div>
                
                {setting.lastTestAt && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Last tested: {new Date(setting.lastTestAt).toLocaleString()}
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}