import { useState, useEffect } from "react";
import { CollapsibleSidebar, MobileSidebar } from "@/components/layout/collapsible-sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Building2, 
  Bell, 
  Sparkles, 
  CreditCard, 
  Shield, 
  Settings as SettingsIcon,
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Check,
  AlertCircle,
  ExternalLink,
  Save,
  Trash2,
  Plus,
  X,
  Key,
  Database,
  Clock,
  DollarSign,
  Palette,
  Calendar as CalendarIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";

// Form schemas
const businessSettingsSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  companyEmail: z.string().email("Valid email is required"),
  companyPhone: z.string().min(1, "Phone number is required"),
  companyAddress: z.string().min(1, "Address is required"),
  website: z.string().url().optional().or(z.literal("")),
  taxId: z.string().optional(),
  description: z.string().optional(),
  timezone: z.string(),
  currency: z.string(),
  dateFormat: z.string(),
  timeFormat: z.string()
});

const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  bookingConfirmations: z.boolean(),
  paymentAlerts: z.boolean(),
  reminderEmails: z.boolean(),
  marketingEmails: z.boolean(),
  weeklyReports: z.boolean(),
  lowInventoryAlerts: z.boolean(),
  taskDeadlines: z.boolean(),
  customerMessages: z.boolean(),
  leadAssignments: z.boolean()
});

type BusinessSettings = z.infer<typeof businessSettingsSchema>;
type NotificationSettings = z.infer<typeof notificationSettingsSchema>;

export default function FunctionalSettings() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("business");
  const [stripeConnected, setStripeConnected] = useState(false);
  const [stripeAccountId, setStripeAccountId] = useState("");
  const { toast } = useToast();

  // Fetch current settings
  const { data: currentSettings, isLoading } = useQuery({
    queryKey: ["/api/settings"],
  });

  // Business Settings Form
  const businessForm = useForm<BusinessSettings>({
    resolver: zodResolver(businessSettingsSchema),
    defaultValues: {
      companyName: "Venuine Events",
      companyEmail: "contact@venuine.com",
      companyPhone: "+1 (555) 123-4567",
      companyAddress: "123 Business Street, City, State 12345",
      website: "https://venuine.com",
      taxId: "12-3456789",
      description: "Premier venue management and event planning services",
      timezone: "America/New_York",
      currency: "USD",
      dateFormat: "MM/DD/YYYY",
      timeFormat: "12h"
    }
  });

  // Notification Settings Form
  const notificationForm = useForm<NotificationSettings>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      bookingConfirmations: true,
      paymentAlerts: true,
      reminderEmails: true,
      marketingEmails: false,
      weeklyReports: true,
      lowInventoryAlerts: true,
      taskDeadlines: true,
      customerMessages: true,
      leadAssignments: true
    }
  });

  // AI Settings State
  const [aiSettings, setAiSettings] = useState({
    enableAiSuggestions: true,
    autoEmailReplies: false,
    leadScoring: true,
    smartScheduling: true,
    voiceBooking: true,
    predictiveAnalytics: false,
    aiChatAssistant: true,
    contentGeneration: false
  });

  // Security Settings State
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: "60",
    passwordPolicy: "medium",
    loginNotifications: true,
    dataEncryption: true,
    backupFrequency: "daily",
    auditLog: true,
    ipWhitelist: ""
  });

  // Integration Settings State
  const [integrationSettings, setIntegrationSettings] = useState({
    googleCalendar: false,
    outlookCalendar: false,
    zapier: false,
    mailchimp: false,
    slack: false,
    webhooks: [],
    apiKeys: []
  });

  // Mutations for saving settings
  const saveBusinessSettings = useMutation({
    mutationFn: (data: BusinessSettings) => apiRequest("PUT", "/api/settings/business", data),
    onSuccess: () => {
      toast({ title: "Business settings saved successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
    onError: () => {
      toast({ title: "Failed to save business settings", variant: "destructive" });
    }
  });

  const saveNotificationSettings = useMutation({
    mutationFn: (data: NotificationSettings) => apiRequest("PUT", "/api/settings/notifications", data),
    onSuccess: () => {
      toast({ title: "Notification settings saved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to save notification settings", variant: "destructive" });
    }
  });

  const saveAiSettings = useMutation({
    mutationFn: (data: any) => apiRequest("PUT", "/api/settings/ai", data),
    onSuccess: () => {
      toast({ title: "AI settings saved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to save AI settings", variant: "destructive" });
    }
  });

  // Stripe Connect Integration
  const handleStripeConnect = () => {
    const stripeConnectUrl = "https://connect.stripe.com/d/setup/s/_Sp7dm2dq26znMMPAWRggSop3RU/YWNjdF8xUnRUT1lJYlBaRTlUYlNP/8b90735cfa91f5a5d";
    window.open(stripeConnectUrl, '_blank');
  };

  const disconnectStripe = useMutation({
    mutationFn: () => apiRequest("DELETE", "/api/stripe/disconnect"),
    onSuccess: () => {
      setStripeConnected(false);
      setStripeAccountId("");
      toast({ title: "Stripe account disconnected successfully" });
    },
    onError: () => {
      toast({ title: "Failed to disconnect Stripe account", variant: "destructive" });
    }
  });

  // Check Stripe connection status
  useEffect(() => {
    const checkStripeConnection = async () => {
      try {
        const response = await apiRequest("GET", "/api/stripe/status");
        const data = await response.json();
        setStripeConnected(data.connected);
        setStripeAccountId(data.accountId || "");
      } catch (error) {
        console.error("Failed to check Stripe status:", error);
      }
    };
    checkStripeConnection();
  }, []);

  const renderBusinessSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Company Information
          </CardTitle>
          <CardDescription>
            Basic information about your venue business
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...businessForm}>
            <form onSubmit={businessForm.handleSubmit((data) => saveBusinessSettings.mutate(data))} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={businessForm.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={businessForm.control}
                  name="companyEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={businessForm.control}
                  name="companyPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={businessForm.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input placeholder="https://yourwebsite.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={businessForm.control}
                name="companyAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Address</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={businessForm.control}
                  name="timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timezone</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="America/New_York">Eastern Time</SelectItem>
                          <SelectItem value="America/Chicago">Central Time</SelectItem>
                          <SelectItem value="America/Denver">Mountain Time</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={businessForm.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                          <SelectItem value="CAD">CAD (C$)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" disabled={saveBusinessSettings.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {saveBusinessSettings.isPending ? "Saving..." : "Save Business Settings"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Customize how and when you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...notificationForm}>
            <form onSubmit={notificationForm.handleSubmit((data) => saveNotificationSettings.mutate(data))} className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">General Notifications</h4>
                  <FormField
                    control={notificationForm.control}
                    name="emailNotifications"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>Email Notifications</FormLabel>
                          <p className="text-sm text-gray-500">Receive notifications via email</p>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={notificationForm.control}
                    name="smsNotifications"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>SMS Notifications</FormLabel>
                          <p className="text-sm text-gray-500">Receive notifications via SMS</p>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={notificationForm.control}
                    name="pushNotifications"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>Push Notifications</FormLabel>
                          <p className="text-sm text-gray-500">Browser push notifications</p>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium">Event Notifications</h4>
                  <FormField
                    control={notificationForm.control}
                    name="bookingConfirmations"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>Booking Confirmations</FormLabel>
                          <p className="text-sm text-gray-500">New booking confirmations</p>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={notificationForm.control}
                    name="paymentAlerts"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>Payment Alerts</FormLabel>
                          <p className="text-sm text-gray-500">Payment received notifications</p>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={notificationForm.control}
                    name="reminderEmails"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>Reminder Emails</FormLabel>
                          <p className="text-sm text-gray-500">Event reminder emails</p>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <Button type="submit" disabled={saveNotificationSettings.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {saveNotificationSettings.isPending ? "Saving..." : "Save Notification Settings"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );

  const renderAiSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            AI Features
          </CardTitle>
          <CardDescription>
            Configure AI-powered features and automation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">Smart Booking</h4>
              <div className="flex items-center justify-between">
                <div>
                  <Label>AI Suggestions</Label>
                  <p className="text-sm text-gray-500">Smart venue and package recommendations</p>
                </div>
                <Switch 
                  checked={aiSettings.enableAiSuggestions}
                  onCheckedChange={(checked) => setAiSettings(prev => ({ ...prev, enableAiSuggestions: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Voice Booking</Label>
                  <p className="text-sm text-gray-500">Voice-to-text event creation</p>
                </div>
                <Switch 
                  checked={aiSettings.voiceBooking}
                  onCheckedChange={(checked) => setAiSettings(prev => ({ ...prev, voiceBooking: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Smart Scheduling</Label>
                  <p className="text-sm text-gray-500">AI-optimized time slot suggestions</p>
                </div>
                <Switch 
                  checked={aiSettings.smartScheduling}
                  onCheckedChange={(checked) => setAiSettings(prev => ({ ...prev, smartScheduling: checked }))}
                />
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-medium">Customer Experience</h4>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto Email Replies</Label>
                  <p className="text-sm text-gray-500">AI-generated email responses</p>
                </div>
                <Switch 
                  checked={aiSettings.autoEmailReplies}
                  onCheckedChange={(checked) => setAiSettings(prev => ({ ...prev, autoEmailReplies: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Lead Scoring</Label>
                  <p className="text-sm text-gray-500">AI-powered lead prioritization</p>
                </div>
                <Switch 
                  checked={aiSettings.leadScoring}
                  onCheckedChange={(checked) => setAiSettings(prev => ({ ...prev, leadScoring: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Predictive Analytics</Label>
                  <p className="text-sm text-gray-500">Revenue and demand forecasting</p>
                </div>
                <Switch 
                  checked={aiSettings.predictiveAnalytics}
                  onCheckedChange={(checked) => setAiSettings(prev => ({ ...prev, predictiveAnalytics: checked }))}
                />
              </div>
            </div>
          </div>
          <Button onClick={() => saveAiSettings.mutate(aiSettings)} disabled={saveAiSettings.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {saveAiSettings.isPending ? "Saving..." : "Save AI Settings"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderPaymentSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Integration
          </CardTitle>
          <CardDescription>
            Configure payment processing for your venue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium">Stripe Connect</h4>
                  <p className="text-sm text-gray-500">
                    {stripeConnected ? "Connected and ready to process payments" : "Connect your Stripe account to start accepting payments"}
                  </p>
                </div>
              </div>
              <Badge variant={stripeConnected ? "default" : "secondary"} className={stripeConnected ? "bg-green-100 text-green-800" : ""}>
                {stripeConnected ? (
                  <>
                    <Check className="w-3 h-3 mr-1" />
                    Connected
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Not Connected
                  </>
                )}
              </Badge>
            </div>
            
            {stripeConnected ? (
              <div className="space-y-3">
                <div className="text-sm">
                  <span className="font-medium">Account ID:</span> {stripeAccountId}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => window.open('https://dashboard.stripe.com', '_blank')}>
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Open Stripe Dashboard
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => disconnectStripe.mutate()}>
                    <X className="w-4 h-4 mr-1" />
                    Disconnect
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Connect your Stripe account with one click to start processing payments securely. 
                  No need to manually enter API keys - everything is handled automatically.
                </p>
                <Button onClick={handleStripeConnect} className="bg-blue-600 hover:bg-blue-700">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Connect with Stripe
                </Button>
              </div>
            )}
          </div>

          {stripeConnected && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Payment Methods</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-green-600" />
                      Credit Cards
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-green-600" />
                      Debit Cards
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-green-600" />
                      ACH Bank Transfers
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-green-600" />
                      Digital Wallets
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Processing Fees</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div>Online payments: 2.9% + 30¢</div>
                    <div>In-person: 2.7% + 5¢</div>
                    <div>International: +1.5%</div>
                    <div className="text-xs text-gray-500 mt-2">
                      Standard Stripe rates apply
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security & Privacy
          </CardTitle>
          <CardDescription>
            Protect your account and data with advanced security features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">Authentication</h4>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-gray-500">Add an extra layer of security</p>
                </div>
                <Switch 
                  checked={securitySettings.twoFactorAuth}
                  onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, twoFactorAuth: checked }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Session Timeout (minutes)</Label>
                <Select value={securitySettings.sessionTimeout} onValueChange={(value) => setSecuritySettings(prev => ({ ...prev, sessionTimeout: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="480">8 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-medium">Data Protection</h4>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Login Notifications</Label>
                  <p className="text-sm text-gray-500">Email alerts for new logins</p>
                </div>
                <Switch 
                  checked={securitySettings.loginNotifications}
                  onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, loginNotifications: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Data Encryption</Label>
                  <p className="text-sm text-gray-500">Encrypt sensitive data</p>
                </div>
                <Switch 
                  checked={securitySettings.dataEncryption}
                  onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, dataEncryption: checked }))}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderIntegrationSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Integrations
          </CardTitle>
          <CardDescription>
            Connect with external services and tools
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  <span className="font-medium">Google Calendar</span>
                </div>
                <Switch 
                  checked={integrationSettings.googleCalendar}
                  onCheckedChange={(checked) => setIntegrationSettings(prev => ({ ...prev, googleCalendar: checked }))}
                />
              </div>
              <p className="text-sm text-gray-500">Sync events with Google Calendar</p>
            </div>
            
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  <span className="font-medium">Mailchimp</span>
                </div>
                <Switch 
                  checked={integrationSettings.mailchimp}
                  onCheckedChange={(checked) => setIntegrationSettings(prev => ({ ...prev, mailchimp: checked }))}
                />
              </div>
              <p className="text-sm text-gray-500">Email marketing automation</p>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  <span className="font-medium">Zapier</span>
                </div>
                <Switch 
                  checked={integrationSettings.zapier}
                  onCheckedChange={(checked) => setIntegrationSettings(prev => ({ ...prev, zapier: checked }))}
                />
              </div>
              <p className="text-sm text-gray-500">Automate workflows</p>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  <span className="font-medium">Slack</span>
                </div>
                <Switch 
                  checked={integrationSettings.slack}
                  onCheckedChange={(checked) => setIntegrationSettings(prev => ({ ...prev, slack: checked }))}
                />
              </div>
              <p className="text-sm text-gray-500">Team notifications</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <CollapsibleSidebar 
          isCollapsed={sidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden lg:flex"
        />
        <MobileSidebar isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header 
            title="Settings" 
            subtitle="Configure your venue management preferences"
            mobileNavOpen={mobileNavOpen}
            setMobileNavOpen={setMobileNavOpen}
          />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <CollapsibleSidebar 
        isCollapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="hidden lg:flex"
      />
      <MobileSidebar isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Settings" 
          subtitle="Configure your venue management preferences"
          mobileNavOpen={mobileNavOpen}
          setMobileNavOpen={setMobileNavOpen}
        />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="w-full overflow-x-auto mobile-tabs">
              <TabsList className="flex w-max min-w-full justify-start sm:justify-center lg:grid lg:grid-cols-6 gap-1 p-1">
                <TabsTrigger value="business" className="flex items-center gap-1 text-xs sm:text-sm px-3 py-2 whitespace-nowrap">
                  <Building2 className="w-4 h-4" />
                  <span>Business</span>
                </TabsTrigger>
                <TabsTrigger value="notifications" className="flex items-center gap-1 text-xs sm:text-sm px-3 py-2 whitespace-nowrap">
                  <Bell className="w-4 h-4" />
                  <span className="hidden xs:inline">Notifications</span>
                  <span className="xs:hidden">Notify</span>
                </TabsTrigger>
                <TabsTrigger value="ai" className="flex items-center gap-1 text-xs sm:text-sm px-3 py-2 whitespace-nowrap">
                  <Sparkles className="w-4 h-4" />
                  <span>AI</span>
                </TabsTrigger>
                <TabsTrigger value="payment" className="flex items-center gap-1 text-xs sm:text-sm px-3 py-2 whitespace-nowrap">
                  <CreditCard className="w-4 h-4" />
                  <span>Payment</span>
                </TabsTrigger>
                <TabsTrigger value="security" className="flex items-center gap-1 text-xs sm:text-sm px-3 py-2 whitespace-nowrap">
                  <Shield className="w-4 h-4" />
                  <span>Security</span>
                </TabsTrigger>
                <TabsTrigger value="integrations" className="flex items-center gap-1 text-xs sm:text-sm px-3 py-2 whitespace-nowrap">
                  <Globe className="w-4 h-4" />
                  <span className="hidden xs:inline">Integrations</span>
                  <span className="xs:hidden">Integra.</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="business">
              {renderBusinessSettings()}
            </TabsContent>

            <TabsContent value="notifications">
              {renderNotificationSettings()}
            </TabsContent>

            <TabsContent value="ai">
              {renderAiSettings()}
            </TabsContent>

            <TabsContent value="payment">
              {renderPaymentSettings()}
            </TabsContent>

            <TabsContent value="security">
              {renderSecuritySettings()}
            </TabsContent>

            <TabsContent value="integrations">
              {renderIntegrationSettings()}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}