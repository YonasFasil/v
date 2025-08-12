import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { cn } from "@/lib/utils";
import { TaxesAndFeesSettings } from "@/components/taxes-and-fees-settings";
import { NotificationTestPanel } from "@/components/NotificationTestPanel";
import { 
  Building2, 
  Mail, 
  CreditCard, 
  Shield, 
  Save,
  Key,
  AlertCircle,
  CheckCircle,
  Globe,
  FileOutput,
  Bell,
  Users,
  Settings as SettingsIcon,
  Trash2,
  Plus,
  Edit3,
  Copy,
  Eye,
  EyeOff,
  ExternalLink,
  Check,
  XCircle,
  RefreshCw,
  Play,
  Calculator,
  Percent
} from "lucide-react";

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [showApiKeys, setShowApiKeys] = useState(false);

  // Fetch current settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/settings"],
    staleTime: 0
  });

  // Local state for form data
  const [formData, setFormData] = useState({
    business: {
      companyName: "",
      companyEmail: "",
      companyPhone: "",
      companyAddress: "",
      website: "",
      timezone: "America/New_York",
      currency: "USD",
      logo: ""
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      bookingConfirmations: true,
      paymentReminders: true,
      maintenanceAlerts: false,
      marketingEmails: false
    },
    integrations: {
      stripeConnected: false,
      emailProvider: "gmail",
      smsProvider: "twilio",
      calendarSync: "google",
      analyticsEnabled: true,
      gmailSettings: {
        email: "",
        appPassword: "",
        isConfigured: false
      }
    },
    security: {
      sessionTimeout: 60,
      passwordPolicy: "strong",
      auditLogging: true,
      dataBackupFrequency: "daily",
      twoFactorEnabled: false,
      ipWhitelist: ""
    },
    beo: {
      defaultTemplate: "standard",
      enabledBeoTypes: ["floor_plan", "timeline", "catering", "av_requirements"],
      autoGenerate: true,
      includeVendorInfo: true,
      showPricing: false,
      customHeader: "",
      customFooter: ""
    },
    payments: {
      defaultDepositPercentage: 30,
      paymentDueDays: 7,
      lateFeePercentage: 5,
      cancellationRefundDays: 30,
      requireDepositOnBooking: false,
      allowPartialPayments: true,
      autoSendPaymentReminders: true,
      defaultTaxRate: 8.25,
      serviceFee: 0,
      serviceFeeType: "percentage",
      acceptCreditCards: true,
      acceptACH: false,
      acceptPayPal: false,
      acceptCheck: true,
      acceptCash: true,
      acceptWireTransfer: false
    },
    taxes: {
      enabled: false,
      salesTaxRate: 0,
      serviceTaxRate: 0,
      label: "Tax",
      inclusive: false
    },
    fees: {
      serviceFeesEnabled: false,
      serviceFeeType: "percentage",
      serviceFeeAmount: 0,
      serviceFeeLabel: "Service Fee",
      processingFeesEnabled: false,
      processingFeeType: "percentage", 
      processingFeeAmount: 0,
      processingFeeLabel: "Processing Fee",
      setupFeesEnabled: false,
      setupFeeAmount: 0,
      setupFeeLabel: "Setup Fee"
    }
  });

  // Initialize form data when settings load
  useEffect(() => {
    if (settings) {
      console.log('Settings loaded:', settings);
      setFormData(prev => {
        const newData = {
          ...prev,
          ...settings
        };
        console.log('Form data updated:', newData);
        return newData;
      });
    }
  }, [settings]);

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      // Use the batch update endpoint
      const response = await apiRequest("PUT", "/api/settings", data);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Settings saved",
        description: "Your settings have been updated successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error saving settings",
        description: error.message || "Failed to save settings",
        variant: "destructive"
      });
    }
  });

  const handleSaveSection = (section: string) => {
    const sectionData = { [section]: formData[section as keyof typeof formData] };
    console.log('Saving section:', section, 'with data:', sectionData);
    saveSettingsMutation.mutate(sectionData);
  };

  const handleSaveAll = () => {
    saveSettingsMutation.mutate(formData);
  };

  const updateFormData = (section: string, field: string, value: any) => {
    console.log('Updating form data:', section, field, value);
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section as keyof typeof prev] as any),
        [field]: value
      }
    }));
  };

  const toggleArrayItem = (section: string, field: string, item: string) => {
    const currentArray = (formData[section as keyof typeof formData] as any)[field] || [];
    const newArray = currentArray.includes(item)
      ? currentArray.filter((i: string) => i !== item)
      : [...currentArray, item];
    
    updateFormData(section, field, newArray);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      
      <MobileNav 
        isOpen={mobileNavOpen} 
        onClose={() => setMobileNavOpen(false)} 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Settings" 
          subtitle="Customize your venue management experience"
          onMobileMenuToggle={() => setMobileNavOpen(true)}
        />
        
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-6 space-y-8">
            
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
                <p className="text-slate-600 mt-1">Configure your venue management system to match your business needs</p>
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={handleSaveAll}
                  disabled={saveSettingsMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saveSettingsMutation.isPending ? "Saving..." : "Save All"}
                </Button>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-1 h-auto p-1 bg-slate-100">
                <TabsTrigger value="general" className="data-[state=active]:bg-white flex flex-col gap-1 py-3 px-2">
                  <Building2 className="w-4 h-4" />
                  <span className="text-xs">General</span>
                </TabsTrigger>
                <TabsTrigger value="notifications" className="data-[state=active]:bg-white flex flex-col gap-1 py-3 px-2">
                  <Bell className="w-4 h-4" />
                  <span className="text-xs">Notifications</span>
                </TabsTrigger>
                <TabsTrigger value="integrations" className="data-[state=active]:bg-white flex flex-col gap-1 py-3 px-2">
                  <Key className="w-4 h-4" />
                  <span className="text-xs">Integrations</span>
                </TabsTrigger>
                <TabsTrigger value="beo" className="data-[state=active]:bg-white flex flex-col gap-1 py-3 px-2">
                  <FileOutput className="w-4 h-4" />
                  <span className="text-xs">BEO</span>
                </TabsTrigger>
                <TabsTrigger value="taxes" className="data-[state=active]:bg-white flex flex-col gap-1 py-3 px-2">
                  <Calculator className="w-4 h-4" />
                  <span className="text-xs">Taxes & Fees</span>
                </TabsTrigger>
                <TabsTrigger value="payments" className="data-[state=active]:bg-white flex flex-col gap-1 py-3 px-2">
                  <CreditCard className="w-4 h-4" />
                  <span className="text-xs">Payments</span>
                </TabsTrigger>
                <TabsTrigger value="security" className="data-[state=active]:bg-white flex flex-col gap-1 py-3 px-2">
                  <Shield className="w-4 h-4" />
                  <span className="text-xs">Security</span>
                </TabsTrigger>
              </TabsList>

              {/* General Settings */}
              <TabsContent value="general" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-blue-600" />
                      Business Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="companyName">Company Name</Label>
                        <Input
                          id="companyName"
                          value={formData.business.companyName}
                          onChange={(e) => updateFormData("business", "companyName", e.target.value)}
                          placeholder="Your venue name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="companyEmail">Business Email</Label>
                        <Input
                          id="companyEmail"
                          type="email"
                          value={formData.business.companyEmail}
                          onChange={(e) => updateFormData("business", "companyEmail", e.target.value)}
                          placeholder="contact@yourvenue.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="companyPhone">Phone Number</Label>
                        <Input
                          id="companyPhone"
                          value={formData.business.companyPhone}
                          onChange={(e) => updateFormData("business", "companyPhone", e.target.value)}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          value={formData.business.website}
                          onChange={(e) => updateFormData("business", "website", e.target.value)}
                          placeholder="https://yourvenue.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="companyAddress">Business Address</Label>
                      <Textarea
                        id="companyAddress"
                        value={formData.business.companyAddress}
                        onChange={(e) => updateFormData("business", "companyAddress", e.target.value)}
                        placeholder="123 Business Street, City, State 12345"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="timezone">Timezone</Label>
                        <Select 
                          value={formData.business.timezone} 
                          onValueChange={(value) => updateFormData("business", "timezone", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {/* North America */}
                            <SelectItem value="America/New_York">🇺🇸 Eastern Time (ET)</SelectItem>
                            <SelectItem value="America/Chicago">🇺🇸 Central Time (CT)</SelectItem>
                            <SelectItem value="America/Denver">🇺🇸 Mountain Time (MT)</SelectItem>
                            <SelectItem value="America/Los_Angeles">🇺🇸 Pacific Time (PT)</SelectItem>
                            <SelectItem value="America/Anchorage">🇺🇸 Alaska Time (AKT)</SelectItem>
                            <SelectItem value="Pacific/Honolulu">🇺🇸 Hawaii Time (HST)</SelectItem>
                            <SelectItem value="America/Toronto">🇨🇦 Eastern Canada</SelectItem>
                            <SelectItem value="America/Vancouver">🇨🇦 Pacific Canada</SelectItem>
                            <SelectItem value="America/Mexico_City">🇲🇽 Mexico City</SelectItem>
                            
                            {/* Europe */}
                            <SelectItem value="Europe/London">🇬🇧 London (GMT/BST)</SelectItem>
                            <SelectItem value="Europe/Paris">🇫🇷 Paris (CET/CEST)</SelectItem>
                            <SelectItem value="Europe/Berlin">🇩🇪 Berlin (CET/CEST)</SelectItem>
                            <SelectItem value="Europe/Rome">🇮🇹 Rome (CET/CEST)</SelectItem>
                            <SelectItem value="Europe/Madrid">🇪🇸 Madrid (CET/CEST)</SelectItem>
                            <SelectItem value="Europe/Amsterdam">🇳🇱 Amsterdam (CET/CEST)</SelectItem>
                            <SelectItem value="Europe/Stockholm">🇸🇪 Stockholm (CET/CEST)</SelectItem>
                            <SelectItem value="Europe/Moscow">🇷🇺 Moscow (MSK)</SelectItem>
                            
                            {/* Asia Pacific */}
                            <SelectItem value="Asia/Tokyo">🇯🇵 Tokyo (JST)</SelectItem>
                            <SelectItem value="Asia/Shanghai">🇨🇳 Shanghai (CST)</SelectItem>
                            <SelectItem value="Asia/Hong_Kong">🇭🇰 Hong Kong (HKT)</SelectItem>
                            <SelectItem value="Asia/Singapore">🇸🇬 Singapore (SGT)</SelectItem>
                            <SelectItem value="Asia/Seoul">🇰🇷 Seoul (KST)</SelectItem>
                            <SelectItem value="Asia/Mumbai">🇮🇳 Mumbai (IST)</SelectItem>
                            <SelectItem value="Asia/Dubai">🇦🇪 Dubai (GST)</SelectItem>
                            <SelectItem value="Australia/Sydney">🇦🇺 Sydney (AEST/AEDT)</SelectItem>
                            <SelectItem value="Australia/Melbourne">🇦🇺 Melbourne (AEST/AEDT)</SelectItem>
                            <SelectItem value="Australia/Perth">🇦🇺 Perth (AWST)</SelectItem>
                            <SelectItem value="Pacific/Auckland">🇳🇿 Auckland (NZST/NZDT)</SelectItem>
                            
                            {/* South America */}
                            <SelectItem value="America/Sao_Paulo">🇧🇷 São Paulo (BRT)</SelectItem>
                            <SelectItem value="America/Argentina/Buenos_Aires">🇦🇷 Buenos Aires (ART)</SelectItem>
                            <SelectItem value="America/Santiago">🇨🇱 Santiago (CLT)</SelectItem>
                            <SelectItem value="America/Lima">🇵🇪 Lima (PET)</SelectItem>
                            
                            {/* Africa */}
                            <SelectItem value="Africa/Cairo">🇪🇬 Cairo (EET)</SelectItem>
                            <SelectItem value="Africa/Johannesburg">🇿🇦 Johannesburg (SAST)</SelectItem>
                            <SelectItem value="Africa/Lagos">🇳🇬 Lagos (WAT)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="currency">Currency</Label>
                        <Select 
                          value={formData.business.currency} 
                          onValueChange={(value) => updateFormData("business", "currency", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">🇺🇸 USD - US Dollar</SelectItem>
                            <SelectItem value="EUR">🇪🇺 EUR - Euro</SelectItem>
                            <SelectItem value="GBP">🇬🇧 GBP - British Pound</SelectItem>
                            <SelectItem value="CAD">🇨🇦 CAD - Canadian Dollar</SelectItem>
                            <SelectItem value="AUD">🇦🇺 AUD - Australian Dollar</SelectItem>
                            <SelectItem value="JPY">🇯🇵 JPY - Japanese Yen</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <Button 
                        onClick={() => handleSaveSection("business")}
                        disabled={saveSettingsMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Business Settings
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Notifications Settings */}
              <TabsContent value="notifications" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="w-5 h-5 text-green-600" />
                      Notification Preferences
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-base font-medium">Email Notifications</Label>
                          <p className="text-sm text-slate-600">Receive notifications via email</p>
                        </div>
                        <Switch
                          checked={formData.notifications.emailNotifications}
                          onCheckedChange={(checked) => updateFormData("notifications", "emailNotifications", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-base font-medium">Push Notifications</Label>
                          <p className="text-sm text-slate-600">Browser push notifications</p>
                        </div>
                        <Switch
                          checked={formData.notifications.pushNotifications}
                          onCheckedChange={(checked) => updateFormData("notifications", "pushNotifications", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-base font-medium">Booking Confirmations</Label>
                          <p className="text-sm text-slate-600">Automatic booking confirmation emails</p>
                        </div>
                        <Switch
                          checked={formData.notifications.bookingConfirmations}
                          onCheckedChange={(checked) => updateFormData("notifications", "bookingConfirmations", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-base font-medium">Payment Reminders</Label>
                          <p className="text-sm text-slate-600">Send automatic payment reminder emails</p>
                        </div>
                        <Switch
                          checked={formData.notifications.paymentReminders}
                          onCheckedChange={(checked) => updateFormData("notifications", "paymentReminders", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-base font-medium">Maintenance Alerts</Label>
                          <p className="text-sm text-slate-600">System maintenance notifications</p>
                        </div>
                        <Switch
                          checked={formData.notifications.maintenanceAlerts}
                          onCheckedChange={(checked) => updateFormData("notifications", "maintenanceAlerts", checked)}
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <Button 
                        onClick={() => handleSaveSection("notifications")}
                        disabled={saveSettingsMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Notification Settings
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Notification Testing Panel */}
                <NotificationTestPanel />
              </TabsContent>



              {/* Integrations Settings */}
              <TabsContent value="integrations" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="w-5 h-5 text-orange-600" />
                      Integrations & Services
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    
                    {/* Stripe Payment Integration */}
                    <StripePaymentSection />

                    {/* Email Provider */}
                    <div className="space-y-3">
                      <Label>Email Service Provider</Label>
                      <Select 
                        value={formData.integrations.emailProvider} 
                        onValueChange={(value) => updateFormData("integrations", "emailProvider", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gmail">Gmail</SelectItem>
                          <SelectItem value="sendgrid">SendGrid</SelectItem>
                          <SelectItem value="mailgun">Mailgun</SelectItem>
                          <SelectItem value="resend">Resend</SelectItem>
                          <SelectItem value="postmark">Postmark</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Gmail Configuration - Show when Gmail is selected */}
                    {formData.integrations.emailProvider === "gmail" && (
                      <div className="space-y-4">
                        {/* Gmail Setup */}
                        <div className="p-4 border rounded-lg bg-blue-50">
                          <div className="flex items-center gap-3 mb-4">
                            <Mail className="w-5 h-5 text-blue-600" />
                            <div>
                              <h4 className="font-medium text-blue-900">Gmail Configuration</h4>
                              <p className="text-sm text-blue-700">Set up Gmail to send proposals directly from your system</p>
                            </div>
                            <Badge variant={formData.integrations.gmailSettings?.isConfigured ? "default" : "secondary"}>
                              {formData.integrations.gmailSettings?.isConfigured ? "Configured" : "Not Configured"}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="gmailEmail">Gmail Address</Label>
                            <Input
                              id="gmailEmail"
                              type="email"
                              placeholder="your-business@gmail.com"
                              value={formData.integrations.gmailSettings?.email || ""}
                              onChange={(e) => updateFormData("integrations", "gmailSettings", {
                                ...formData.integrations.gmailSettings,
                                email: e.target.value
                              })}
                            />
                            <p className="text-xs text-blue-600">Use your business Gmail account that will send proposals</p>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="gmailAppPassword">App Password</Label>
                            <Input
                              id="gmailAppPassword"
                              type="password"
                              placeholder="Enter 16-character app password"
                              value={formData.integrations.gmailSettings?.appPassword || ""}
                              onChange={(e) => updateFormData("integrations", "gmailSettings", {
                                ...formData.integrations.gmailSettings,
                                appPassword: e.target.value
                              })}
                            />
                            <div className="text-xs space-y-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-800">
                              <div>
                                <p className="font-semibold text-blue-800 dark:text-blue-200 mb-2">📧 Gmail App Password Setup Required:</p>
                                <div className="space-y-1 text-blue-700 dark:text-blue-300">
                                  <p><strong>1.</strong> Enable 2-Factor Authentication on your Gmail account</p>
                                  <p><strong>2.</strong> Go to <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900 dark:hover:text-blue-100">Google App Passwords</a></p>
                                  <p><strong>3.</strong> Select "Mail" or "Other (Custom)" and create app password</p>
                                  <p><strong>4.</strong> Copy the 16-character password (format: "abcd efgh ijkl mnop")</p>
                                  <p><strong>5.</strong> Paste that password here (NOT your regular Gmail password)</p>
                                </div>
                              </div>
                              
                              <div className="border-t border-blue-200 dark:border-blue-700 pt-3">
                                <p className="font-semibold text-amber-700 dark:text-amber-300 mb-1">🔧 Troubleshooting Authentication Issues:</p>
                                <div className="space-y-1 text-amber-600 dark:text-amber-400 text-xs">
                                  <p>• If you get "Invalid credentials" error, generate a NEW App Password</p>
                                  <p>• App Passwords expire - create a fresh one if it stopped working</p>
                                  <p>• Make sure you copy the password exactly (16 characters, no spaces)</p>
                                  <p>• Delete old App Passwords and create new ones if needed</p>
                                </div>
                              </div>
                              
                              <div className="text-red-600 dark:text-red-400 font-medium bg-red-50 dark:bg-red-950/20 p-3 rounded border border-red-200 dark:border-red-800">
                                ⚠️ NEVER use your regular Gmail password - only 16-character App Passwords work!
                                <div className="mt-2 text-xs">
                                  <strong>Getting "Authentication Failed"?</strong>
                                  <br />→ Generate a NEW App Password right now and try again
                                  <br />→ Old App Passwords expire and stop working
                                </div>
                              </div>
                              
                              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded p-3">
                                <p className="text-green-800 dark:text-green-200 font-semibold text-xs mb-1">
                                  🔑 Quick Fix for Authentication Errors:
                                </p>
                                <div className="text-green-700 dark:text-green-300 text-xs space-y-1">
                                  <p>1. <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="underline hover:text-green-900 dark:hover:text-green-100">Click here to generate a fresh App Password</a></p>
                                  <p>2. Delete your old App Password from Google first</p>
                                  <p>3. Create new one → Copy the 16 characters exactly</p>
                                  <p>4. Paste it here and test connection</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={async () => {
                                if (formData.integrations.gmailSettings?.email && formData.integrations.gmailSettings?.appPassword) {
                                  try {
                                    const response = await fetch('/api/gmail/test', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        email: formData.integrations.gmailSettings.email,
                                        appPassword: formData.integrations.gmailSettings.appPassword
                                      })
                                    });

                                    const result = await response.json();
                                    
                                    if (result.success) {
                                      updateFormData("integrations", "gmailSettings", {
                                        ...formData.integrations.gmailSettings,
                                        isConfigured: true
                                      });
                                      
                                      toast({
                                        title: "Gmail Connected!",
                                        description: "Your Gmail account is now ready to send proposals and monitor replies.",
                                        variant: "default"
                                      });
                                    } else {
                                      throw new Error(result.message);
                                    }
                                  } catch (error: any) {
                                    updateFormData("integrations", "gmailSettings", {
                                      ...formData.integrations.gmailSettings,
                                      isConfigured: false
                                    });
                                    
                                    toast({
                                      title: "Gmail Connection Failed",
                                      description: error.message || "Please generate a new Gmail App Password and try again.",
                                      variant: "destructive"
                                    });
                                  }
                                }
                              }}
                              disabled={!formData.integrations.gmailSettings?.email || !formData.integrations.gmailSettings?.appPassword}
                            >
                              <Check className="w-4 h-4 mr-2" />
                              Test Connection
                            </Button>
                            
                            {formData.integrations.gmailSettings?.isConfigured && (
                              <Button 
                                variant="default" 
                                size="sm"
                                onClick={async () => {
                                  try {
                                    await fetch('/api/gmail/send-test', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' }
                                    });
                                    
                                    toast({
                                      title: "Test Email Sent!",
                                      description: "Check your Gmail inbox for the test email.",
                                      variant: "default"
                                    });
                                  } catch (error: any) {
                                    toast({
                                      title: "Failed to Send",
                                      description: error.message || "Failed to send test email.",
                                      variant: "destructive"
                                    });
                                  }
                                }}
                              >
                                <Mail className="w-4 h-4 mr-2" />
                                Send Test Email
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        {/* Email Monitoring Configuration */}
                        <div className="p-4 border rounded-lg bg-green-50">
                          <div className="flex items-center gap-3 mb-4">
                            <Bell className="w-5 h-5 text-green-600" />
                            <div>
                              <h4 className="font-medium text-green-900">Automatic Customer Reply Detection</h4>
                              <p className="text-sm text-green-700">Monitor Gmail for customer replies to proposals and automatically record them</p>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="text-sm space-y-3 p-3 bg-green-100 rounded-md border border-green-200">
                              <p className="font-semibold text-green-800">✨ How it works:</p>
                              <div className="space-y-1 text-green-700">
                                <p>• When you send proposals via email, they're tracked automatically</p>
                                <p>• Customer replies to those emails are detected in real-time</p>
                                <p>• Replies automatically appear in the proposal's communication history</p>
                                <p>• No manual entry needed - everything happens automatically!</p>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Button 
                                variant="default" 
                                size="sm"
                                onClick={async () => {
                                  if (!formData.integrations.gmailSettings?.isConfigured) {
                                    toast({
                                      title: "Gmail Not Configured",
                                      description: "Please configure your Gmail settings first before starting email monitoring.",
                                      variant: "destructive"
                                    });
                                    return;
                                  }

                                  try {
                                    const response = await fetch('/api/emails/start-monitoring', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        email: formData.integrations.gmailSettings.email,
                                        appPassword: formData.integrations.gmailSettings.appPassword
                                      })
                                    });

                                    const result = await response.json();
                                    if (result.success) {
                                      toast({
                                        title: "Email Monitoring Started!",
                                        description: "Now monitoring for customer replies to proposals. They'll appear automatically in communication history.",
                                      });
                                    } else {
                                      throw new Error(result.message);
                                    }
                                  } catch (error: any) {
                                    toast({
                                      title: "Failed to Start Monitoring",
                                      description: error.message || "Unable to start email monitoring",
                                      variant: "destructive"
                                    });
                                  }
                                }}
                                disabled={!formData.integrations.gmailSettings?.isConfigured}
                              >
                                <Play className="w-4 h-4 mr-2" />
                                Start Monitoring
                              </Button>
                              
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={async () => {
                                  try {
                                    const response = await fetch('/api/emails/monitoring-status');
                                    const status = await response.json();
                                    
                                    toast({
                                      title: "Monitoring Status",
                                      description: status.isActive ? 
                                        `Active since ${new Date(status.startedAt).toLocaleString()}. Checking every 30 seconds.` :
                                        "Email monitoring is not currently active.",
                                      variant: status.isActive ? "default" : "secondary"
                                    });
                                  } catch (error: any) {
                                    toast({
                                      title: "Error",
                                      description: "Unable to check monitoring status",
                                      variant: "destructive"
                                    });
                                  }
                                }}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Check Status
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* API Keys Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-medium">API Keys</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowApiKeys(!showApiKeys)}
                        >
                          {showApiKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          {showApiKeys ? "Hide" : "Show"}
                        </Button>
                      </div>
                      
                      {showApiKeys && (
                        <div className="space-y-3 p-4 bg-slate-50 rounded-lg">
                          <div className="space-y-2">
                            <Label htmlFor="emailApiKey">Email API Key</Label>
                            <Input
                              id="emailApiKey"
                              type="password"
                              placeholder="Enter your email service API key"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="smsApiKey">SMS API Key (Twilio)</Label>
                            <Input
                              id="smsApiKey"
                              type="password"
                              placeholder="Enter your Twilio API key"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t">
                      <Button 
                        onClick={() => handleSaveSection("integrations")}
                        disabled={saveSettingsMutation.isPending}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Integration Settings
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* BEO Settings */}
              <TabsContent value="beo" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileOutput className="w-5 h-5 text-indigo-600" />
                      BEO (Banquet Event Orders)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <Label className="text-base font-medium">BEO Template Design</Label>
                        <p className="text-sm text-slate-600">Choose the visual design for your Banquet Event Orders</p>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                          {[
                            {
                              id: "standard",
                              name: "Standard",
                              description: "Clean and professional template",
                              features: ["Header with logo", "Structured sections", "Standard fonts"],
                              preview: {
                                bgColor: "bg-white",
                                headerColor: "bg-slate-100",
                                textColor: "text-slate-900",
                                accentColor: "border-slate-300"
                              }
                            },
                            {
                              id: "luxury",
                              name: "Luxury",
                              description: "Elegant design with premium styling",
                              features: ["Gold accents", "Elegant typography", "Premium layout"],
                              preview: {
                                bgColor: "bg-gradient-to-br from-amber-50 to-white",
                                headerColor: "bg-gradient-to-r from-amber-100 to-amber-50",
                                textColor: "text-amber-900",
                                accentColor: "border-amber-300"
                              }
                            },
                            {
                              id: "corporate",
                              name: "Corporate",
                              description: "Professional business template",
                              features: ["Bold headers", "Business colors", "Structured layout"],
                              preview: {
                                bgColor: "bg-white",
                                headerColor: "bg-blue-600",
                                textColor: "text-blue-900",
                                accentColor: "border-blue-300"
                              }
                            },
                            {
                              id: "wedding",
                              name: "Wedding",
                              description: "Romantic design for wedding events",
                              features: ["Soft colors", "Decorative elements", "Elegant styling"],
                              preview: {
                                bgColor: "bg-gradient-to-br from-rose-50 to-pink-50",
                                headerColor: "bg-gradient-to-r from-rose-100 to-pink-100",
                                textColor: "text-rose-900",
                                accentColor: "border-rose-300"
                              }
                            },
                            {
                              id: "minimal",
                              name: "Minimal",
                              description: "Simple and clean design",
                              features: ["Minimal styling", "Clean typography", "Simple layout"],
                              preview: {
                                bgColor: "bg-white",
                                headerColor: "bg-gray-50",
                                textColor: "text-gray-900",
                                accentColor: "border-gray-200"
                              }
                            },
                            {
                              id: "executive",
                              name: "Executive",
                              description: "Professional document-style layout",
                              features: ["Document header", "Sectioned layout", "Professional fonts"],
                              preview: {
                                bgColor: "bg-white",
                                headerColor: "bg-gradient-to-r from-slate-800 to-slate-700",
                                textColor: "text-slate-800",
                                accentColor: "border-slate-400"
                              }
                            }
                          ].map((template) => {
                            const isSelected = formData.beo.defaultTemplate === template.id;
                            return (
                              <div
                                key={template.id}
                                className={cn(
                                  "relative border-2 rounded-lg p-4 cursor-pointer transition-all",
                                  isSelected 
                                    ? "border-blue-500 bg-blue-50 shadow-md" 
                                    : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
                                )}
                                onClick={() => updateFormData("beo", "defaultTemplate", template.id)}
                              >
                                {isSelected && (
                                  <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                    <Check className="w-4 h-4 text-white" />
                                  </div>
                                )}
                                
                                {/* Template Preview */}
                                <div className={cn("w-full h-32 rounded border overflow-hidden mb-3", template.preview.bgColor)}>
                                  {template.id === "executive" ? (
                                    // Executive template with document-style layout
                                    <>
                                      <div className={cn("h-10 w-full", template.preview.headerColor, "border-b flex items-center px-3")}>
                                        <div className="flex items-center justify-between w-full">
                                          <div className="h-3 w-16 bg-white opacity-80 rounded"></div>
                                          <div className="h-2 w-24 bg-white opacity-60 rounded"></div>
                                        </div>
                                      </div>
                                      <div className="p-3 space-y-1.5">
                                        <div className="flex justify-between items-center">
                                          <div className={cn("h-2.5 bg-current opacity-40 rounded w-20", template.preview.textColor)}></div>
                                          <div className={cn("h-2 bg-current opacity-25 rounded w-16", template.preview.textColor)}></div>
                                        </div>
                                        <div className="border-t pt-1.5 space-y-1">
                                          <div className={cn("h-2 bg-current opacity-20 rounded w-full", template.preview.textColor)}></div>
                                          <div className={cn("h-2 bg-current opacity-20 rounded w-4/5", template.preview.textColor)}></div>
                                        </div>
                                        <div className="pt-1 space-y-1">
                                          <div className={cn("h-1.5 bg-current opacity-15 rounded w-3/5", template.preview.textColor)}></div>
                                          <div className={cn("h-1.5 bg-current opacity-15 rounded w-2/3", template.preview.textColor)}></div>
                                        </div>
                                      </div>
                                    </>
                                  ) : (
                                    // Standard preview for other templates
                                    <>
                                      <div className={cn("h-8 w-full", template.preview.headerColor, template.preview.accentColor, "border-b")}>
                                        <div className="px-3 py-2">
                                          <div className="h-4 w-20 bg-current opacity-20 rounded"></div>
                                        </div>
                                      </div>
                                      <div className="p-3 space-y-2">
                                        <div className={cn("h-3 bg-current opacity-30 rounded w-3/4", template.preview.textColor)}></div>
                                        <div className={cn("h-2 bg-current opacity-20 rounded w-full", template.preview.textColor)}></div>
                                        <div className={cn("h-2 bg-current opacity-20 rounded w-5/6", template.preview.textColor)}></div>
                                        <div className="pt-2">
                                          <div className={cn("h-2 bg-current opacity-15 rounded w-2/3", template.preview.textColor)}></div>
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </div>
                                
                                <div className="space-y-2">
                                  <h3 className="font-medium text-sm">{template.name}</h3>
                                  <p className="text-xs text-slate-600">{template.description}</p>
                                  <div className="space-y-1">
                                    {template.features.map((feature, index) => (
                                      <div key={index} className="flex items-center gap-1">
                                        <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                                        <span className="text-xs text-slate-500">{feature}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Sample Template Preview */}
                    {formData.beo.defaultTemplate && (
                      <div className="space-y-4">
                        <div className="border-t pt-6">
                          <Label className="text-base font-medium">Template Preview</Label>
                          <p className="text-sm text-slate-600 mb-4">
                            Preview of the {formData.beo.defaultTemplate} template design
                          </p>
                          
                          <div className="bg-white border rounded-lg p-6 max-w-2xl">
                            {formData.beo.defaultTemplate === "executive" ? (
                              // Executive template sample
                              <div className="space-y-4 text-sm">
                                <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-4 rounded">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h3 className="text-lg font-bold">BANQUET EVENT ORDER</h3>
                                      <p className="text-slate-200 text-xs">Venuine Events</p>
                                    </div>
                                    <div className="text-right text-xs">
                                      <p className="text-slate-200">BEO No.</p>
                                      <p className="font-semibold">#001234</p>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 text-xs">
                                  <div>
                                    <h4 className="font-semibold border-b border-slate-300 pb-1 mb-2">EVENT DETAILS</h4>
                                    <div className="space-y-1">
                                      <div className="flex justify-between">
                                        <span>Event:</span>
                                        <span>Corporate Gala</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Date:</span>
                                        <span>March 15, 2025</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Guests:</span>
                                        <span>150</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="font-semibold border-b border-slate-300 pb-1 mb-2">CLIENT INFO</h4>
                                    <div className="space-y-1">
                                      <div className="flex justify-between">
                                        <span>Name:</span>
                                        <span>Tech Corp</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Contact:</span>
                                        <span>john@techcorp.com</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                <div>
                                  <h4 className="font-semibold border-b border-slate-300 pb-1 mb-2 text-xs">SERVICES</h4>
                                  <div className="space-y-2">
                                    <div className="border border-slate-200 p-2 rounded text-xs">
                                      <div className="font-medium">Audio/Visual Setup</div>
                                      <div className="text-slate-600">Professional sound system and presentation equipment</div>
                                    </div>
                                    <div className="border border-slate-200 p-2 rounded text-xs">
                                      <div className="font-medium">Catering Service</div>
                                      <div className="text-slate-600">Three-course dinner with wine service</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : formData.beo.defaultTemplate === "luxury" ? (
                              // Luxury template sample
                              <div className="space-y-4">
                                <div className="bg-gradient-to-r from-amber-100 to-amber-50 p-4 rounded border border-amber-300">
                                  <h3 className="text-lg font-bold text-amber-900">Banquet Event Order</h3>
                                  <p className="text-amber-700 text-sm">Premium Event Services</p>
                                </div>
                                <div className="text-sm space-y-3">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="font-semibold text-amber-900">Event Details</h4>
                                      <p className="text-slate-600">Wedding Reception • March 15, 2025 • 120 guests</p>
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-amber-900">Client</h4>
                                      <p className="text-slate-600">Mr. & Mrs. Smith</p>
                                    </div>
                                  </div>
                                  <div className="bg-amber-50 p-3 rounded border border-amber-200">
                                    <h4 className="font-medium text-amber-900">Premium Services</h4>
                                    <p className="text-slate-700 text-sm">• Elegant floral arrangements • Fine dining service • Premium bar package</p>
                                  </div>
                                </div>
                              </div>
                            ) : formData.beo.defaultTemplate === "corporate" ? (
                              // Corporate template sample
                              <div className="space-y-4">
                                <div className="bg-blue-600 text-white p-4 rounded">
                                  <h3 className="text-lg font-bold">BANQUET EVENT ORDER</h3>
                                  <p className="text-blue-100 text-sm">Professional Event Management</p>
                                </div>
                                <div className="text-sm space-y-3">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="font-semibold text-blue-900">Event Information</h4>
                                      <p className="text-slate-600">Corporate Meeting • March 15, 2025 • 80 attendees</p>
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-blue-900">Organization</h4>
                                      <p className="text-slate-600">Business Solutions Inc.</p>
                                    </div>
                                  </div>
                                  <div className="border border-blue-200 p-3 rounded">
                                    <h4 className="font-medium text-blue-900">Business Services</h4>
                                    <p className="text-slate-700 text-sm">• Conference room setup • A/V equipment • Catered lunch</p>
                                  </div>
                                </div>
                              </div>
                            ) : formData.beo.defaultTemplate === "wedding" ? (
                              // Wedding template sample
                              <div className="space-y-4">
                                <div className="bg-gradient-to-r from-rose-100 to-pink-100 p-4 rounded border border-rose-300">
                                  <h3 className="text-lg font-bold text-rose-900">Banquet Event Order</h3>
                                  <p className="text-rose-700 text-sm">Romantic Wedding Celebration</p>
                                </div>
                                <div className="text-sm space-y-3">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="font-semibold text-rose-900">Wedding Details</h4>
                                      <p className="text-slate-600">Reception • March 15, 2025 • 100 guests</p>
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-rose-900">Couple</h4>
                                      <p className="text-slate-600">Sarah & Michael</p>
                                    </div>
                                  </div>
                                  <div className="bg-rose-50 p-3 rounded border border-rose-200">
                                    <h4 className="font-medium text-rose-900">Wedding Services</h4>
                                    <p className="text-slate-700 text-sm">• Romantic lighting • Floral centerpieces • Wedding cake service</p>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              // Standard and Minimal template sample
                              <div className="space-y-4">
                                <div className="bg-slate-100 p-4 rounded border border-slate-300">
                                  <h3 className="text-lg font-bold text-slate-900">Banquet Event Order</h3>
                                  <p className="text-slate-600 text-sm">Professional Event Services</p>
                                </div>
                                <div className="text-sm space-y-3">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="font-semibold">Event Details</h4>
                                      <p className="text-slate-600">Company Event • March 15, 2025 • 75 guests</p>
                                    </div>
                                    <div>
                                      <h4 className="font-semibold">Client</h4>
                                      <p className="text-slate-600">ABC Company</p>
                                    </div>
                                  </div>
                                  <div className="border border-slate-200 p-3 rounded">
                                    <h4 className="font-medium">Event Services</h4>
                                    <p className="text-slate-700 text-sm">• Room setup • Catering • Basic A/V equipment</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      <Label className="text-base font-medium">BEO Sections</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { id: "floor_plan", label: "Floor Plan" },
                          { id: "timeline", label: "Timeline" },
                          { id: "catering", label: "Catering" },
                          { id: "av_requirements", label: "AV Requirements" },
                          { id: "vendor_info", label: "Vendor Information" },
                          { id: "setup_breakdown", label: "Setup/Breakdown" }
                        ].map((item) => (
                          <div key={item.id} className="flex items-center space-x-2">
                            <Switch
                              checked={formData.beo.enabledBeoTypes.includes(item.id)}
                              onCheckedChange={() => toggleArrayItem("beo", "enabledBeoTypes", item.id)}
                            />
                            <Label className="text-sm">{item.label}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-base font-medium">Auto-Generate BEO</Label>
                          <p className="text-sm text-slate-600">Automatically create BEO when event is confirmed</p>
                        </div>
                        <Switch
                          checked={formData.beo.autoGenerate}
                          onCheckedChange={(checked) => updateFormData("beo", "autoGenerate", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-base font-medium">Show Pricing</Label>
                          <p className="text-sm text-slate-600">Include pricing information in BEO documents</p>
                        </div>
                        <Switch
                          checked={formData.beo.showPricing}
                          onCheckedChange={(checked) => updateFormData("beo", "showPricing", checked)}
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <Button 
                        onClick={() => handleSaveSection("beo")}
                        disabled={saveSettingsMutation.isPending}
                        className="bg-indigo-600 hover:bg-indigo-700"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save BEO Settings
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Taxes & Fees Settings */}
              <TabsContent value="taxes" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="w-5 h-5 text-green-600" />
                      Tax Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-base font-medium">Enable Tax Calculation</Label>
                          <p className="text-sm text-slate-600">Automatically calculate taxes on bookings and invoices</p>
                        </div>
                        <Switch
                          checked={formData.taxes?.enabled || false}
                          onCheckedChange={(checked) => updateFormData("taxes", "enabled", checked)}
                        />
                      </div>

                      {formData.taxes?.enabled && (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label htmlFor="salesTaxRate">Sales Tax Rate (%)</Label>
                              <div className="relative">
                                <Input
                                  id="salesTaxRate"
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max="100"
                                  value={formData.taxes?.salesTaxRate || ""}
                                  onChange={(e) => updateFormData("taxes", "salesTaxRate", parseFloat(e.target.value))}
                                  placeholder="8.25"
                                />
                                <Percent className="w-4 h-4 absolute right-3 top-3 text-gray-400" />
                              </div>
                              <p className="text-xs text-slate-500">Standard sales tax percentage for your location</p>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="serviceTaxRate">Service Tax Rate (%)</Label>
                              <div className="relative">
                                <Input
                                  id="serviceTaxRate"
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max="100"
                                  value={formData.taxes?.serviceTaxRate || ""}
                                  onChange={(e) => updateFormData("taxes", "serviceTaxRate", parseFloat(e.target.value))}
                                  placeholder="3.50"
                                />
                                <Percent className="w-4 h-4 absolute right-3 top-3 text-gray-400" />
                              </div>
                              <p className="text-xs text-slate-500">Additional tax for services and labor</p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="taxLabel">Tax Label</Label>
                            <Input
                              id="taxLabel"
                              value={formData.taxes?.label || ""}
                              onChange={(e) => updateFormData("taxes", "label", e.target.value)}
                              placeholder="Sales Tax"
                            />
                            <p className="text-xs text-slate-500">How taxes will be labeled on invoices and proposals</p>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <Label className="text-base font-medium">Tax Inclusive Pricing</Label>
                              <p className="text-sm text-slate-600">Show prices with tax included rather than as separate line items</p>
                            </div>
                            <Switch
                              checked={formData.taxes?.inclusive || false}
                              onCheckedChange={(checked) => updateFormData("taxes", "inclusive", checked)}
                            />
                          </div>
                        </>
                      )}
                    </div>

                    <div className="pt-4 border-t">
                      <Button 
                        onClick={() => handleSaveSection("taxes")}
                        disabled={saveSettingsMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Tax Settings
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-purple-600" />
                      Additional Fees
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-base font-medium">Service Fee</Label>
                          <p className="text-sm text-slate-600">Flat or percentage-based service fee</p>
                        </div>
                        <Switch
                          checked={formData.fees?.serviceFeesEnabled || false}
                          onCheckedChange={(checked) => updateFormData("fees", "serviceFeesEnabled", checked)}
                        />
                      </div>

                      {formData.fees?.serviceFeesEnabled && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ml-6">
                          <div className="space-y-2">
                            <Label>Fee Type</Label>
                            <Select
                              value={formData.fees?.serviceFeeType || "percentage"}
                              onValueChange={(value) => updateFormData("fees", "serviceFeeType", value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="percentage">Percentage</SelectItem>
                                <SelectItem value="fixed">Fixed Amount</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Amount</Label>
                            <div className="relative">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.fees?.serviceFeeAmount || ""}
                                onChange={(e) => updateFormData("fees", "serviceFeeAmount", parseFloat(e.target.value))}
                                placeholder={formData.fees?.serviceFeeType === "fixed" ? "50.00" : "15.00"}
                              />
                              {formData.fees?.serviceFeeType === "percentage" && (
                                <Percent className="w-4 h-4 absolute right-3 top-3 text-gray-400" />
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Label</Label>
                            <Input
                              value={formData.fees?.serviceFeeLabel || ""}
                              onChange={(e) => updateFormData("fees", "serviceFeeLabel", e.target.value)}
                              placeholder="Service Fee"
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-base font-medium">Processing Fee</Label>
                          <p className="text-sm text-slate-600">Credit card processing or payment handling fee</p>
                        </div>
                        <Switch
                          checked={formData.fees?.processingFeesEnabled || false}
                          onCheckedChange={(checked) => updateFormData("fees", "processingFeesEnabled", checked)}
                        />
                      </div>

                      {formData.fees?.processingFeesEnabled && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ml-6">
                          <div className="space-y-2">
                            <Label>Fee Type</Label>
                            <Select
                              value={formData.fees?.processingFeeType || "percentage"}
                              onValueChange={(value) => updateFormData("fees", "processingFeeType", value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="percentage">Percentage</SelectItem>
                                <SelectItem value="fixed">Fixed Amount</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Amount</Label>
                            <div className="relative">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.fees?.processingFeeAmount || ""}
                                onChange={(e) => updateFormData("fees", "processingFeeAmount", parseFloat(e.target.value))}
                                placeholder={formData.fees?.processingFeeType === "fixed" ? "25.00" : "2.90"}
                              />
                              {formData.fees?.processingFeeType === "percentage" && (
                                <Percent className="w-4 h-4 absolute right-3 top-3 text-gray-400" />
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Label</Label>
                            <Input
                              value={formData.fees?.processingFeeLabel || ""}
                              onChange={(e) => updateFormData("fees", "processingFeeLabel", e.target.value)}
                              placeholder="Processing Fee"
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-base font-medium">Setup Fee</Label>
                          <p className="text-sm text-slate-600">One-time setup or booking fee</p>
                        </div>
                        <Switch
                          checked={formData.fees?.setupFeesEnabled || false}
                          onCheckedChange={(checked) => updateFormData("fees", "setupFeesEnabled", checked)}
                        />
                      </div>

                      {formData.fees?.setupFeesEnabled && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                          <div className="space-y-2">
                            <Label>Amount</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={formData.fees?.setupFeeAmount || ""}
                              onChange={(e) => updateFormData("fees", "setupFeeAmount", parseFloat(e.target.value))}
                              placeholder="100.00"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Label</Label>
                            <Input
                              value={formData.fees?.setupFeeLabel || ""}
                              onChange={(e) => updateFormData("fees", "setupFeeLabel", e.target.value)}
                              placeholder="Setup Fee"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t">
                      <Button 
                        onClick={() => handleSaveSection("fees")}
                        disabled={saveSettingsMutation.isPending}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Fee Settings
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-orange-600" />
                      Preview Calculation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <h4 className="font-semibold mb-3">Sample Booking Calculation</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Venue Rental</span>
                          <span>$1,000.00</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Services & Packages</span>
                          <span>$500.00</span>
                        </div>
                        <hr className="my-2" />
                        <div className="flex justify-between text-slate-600">
                          <span>Subtotal</span>
                          <span>$1,500.00</span>
                        </div>
                        {formData.fees?.serviceFeesEnabled && (
                          <div className="flex justify-between text-slate-600">
                            <span>{formData.fees?.serviceFeeLabel || "Service Fee"}</span>
                            <span>
                              {formData.fees?.serviceFeeType === "percentage" 
                                ? `$${((1500 * (formData.fees?.serviceFeeAmount || 0)) / 100).toFixed(2)}`
                                : `$${(formData.fees?.serviceFeeAmount || 0).toFixed(2)}`
                              }
                            </span>
                          </div>
                        )}
                        {formData.fees?.setupFeesEnabled && (
                          <div className="flex justify-between text-slate-600">
                            <span>{formData.fees?.setupFeeLabel || "Setup Fee"}</span>
                            <span>${(formData.fees?.setupFeeAmount || 0).toFixed(2)}</span>
                          </div>
                        )}
                        {formData.taxes?.enabled && (
                          <div className="flex justify-between text-slate-600">
                            <span>{formData.taxes?.label || "Tax"}</span>
                            <span>
                              ${(((1500 + 
                                (formData.fees?.serviceFeesEnabled && formData.fees?.serviceFeeType === "percentage" 
                                  ? (1500 * (formData.fees?.serviceFeeAmount || 0)) / 100 
                                  : formData.fees?.serviceFeeAmount || 0) +
                                (formData.fees?.setupFeesEnabled ? formData.fees?.setupFeeAmount || 0 : 0)
                              ) * ((formData.taxes?.salesTaxRate || 0) + (formData.taxes?.serviceTaxRate || 0))) / 100).toFixed(2)}
                            </span>
                          </div>
                        )}
                        {formData.fees?.processingFeesEnabled && (
                          <div className="flex justify-between text-slate-600">
                            <span>{formData.fees?.processingFeeLabel || "Processing Fee"}</span>
                            <span>
                              {formData.fees?.processingFeeType === "percentage" 
                                ? `$${((1500 * (formData.fees?.processingFeeAmount || 0)) / 100).toFixed(2)}`
                                : `$${(formData.fees?.processingFeeAmount || 0).toFixed(2)}`
                              }
                            </span>
                          </div>
                        )}
                        <hr className="my-2" />
                        <div className="flex justify-between font-semibold text-lg">
                          <span>Total</span>
                          <span>
                            ${(() => {
                              let subtotal = 1500;
                              
                              // Add service fee
                              if (formData.fees?.serviceFeesEnabled) {
                                subtotal += formData.fees?.serviceFeeType === "percentage" 
                                  ? (1500 * (formData.fees?.serviceFeeAmount || 0)) / 100
                                  : formData.fees?.serviceFeeAmount || 0;
                              }
                              
                              // Add setup fee
                              if (formData.fees?.setupFeesEnabled) {
                                subtotal += formData.fees?.setupFeeAmount || 0;
                              }
                              
                              // Add taxes
                              if (formData.taxes?.enabled) {
                                subtotal += (subtotal * ((formData.taxes?.salesTaxRate || 0) + (formData.taxes?.serviceTaxRate || 0))) / 100;
                              }
                              
                              // Add processing fee
                              if (formData.fees?.processingFeesEnabled) {
                                subtotal += formData.fees?.processingFeeType === "percentage" 
                                  ? (subtotal * (formData.fees?.processingFeeAmount || 0)) / 100
                                  : formData.fees?.processingFeeAmount || 0;
                              }
                              
                              return subtotal.toFixed(2);
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Payments Settings */}
              <TabsContent value="payments" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                      Payment Settings
                    </CardTitle>
                    <p className="text-sm text-slate-600 mt-2">
                      Configure payment processing, deposits, and billing preferences
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    
                    {/* Stripe Payment Integration */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-slate-900">Payment Processing</h4>
                      <StripePaymentSection />
                    </div>

                    {/* Deposit Settings */}
                    <div className="space-y-4 border-t pt-6">
                      <h4 className="font-medium text-slate-900">Deposit & Payment Terms</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="defaultDepositPercentage">Default Deposit Percentage</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              id="defaultDepositPercentage"
                              type="number"
                              min="0"
                              max="100"
                              value={formData.payments?.defaultDepositPercentage || 30}
                              onChange={(e) => updateFormData("payments", "defaultDepositPercentage", parseInt(e.target.value) || 0)}
                              className="w-20"
                            />
                            <span className="text-sm text-slate-600">% of total amount</span>
                          </div>
                          <p className="text-xs text-slate-500">Percentage required as deposit for new bookings</p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="paymentDueDays">Payment Due (Days)</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              id="paymentDueDays"
                              type="number"
                              min="1"
                              max="365"
                              value={formData.payments?.paymentDueDays || 7}
                              onChange={(e) => updateFormData("payments", "paymentDueDays", parseInt(e.target.value) || 7)}
                              className="w-20"
                            />
                            <span className="text-sm text-slate-600">days before event</span>
                          </div>
                          <p className="text-xs text-slate-500">Final payment due deadline</p>
                        </div>
                      </div>



                      <div className="space-y-3">
                        <Label>Deposit Collection Options</Label>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <input 
                              type="checkbox"
                              id="requireDepositOnBooking"
                              checked={formData.payments?.requireDepositOnBooking || false}
                              onChange={(e) => updateFormData("payments", "requireDepositOnBooking", e.target.checked)}
                              className="rounded border-slate-300"
                            />
                            <Label htmlFor="requireDepositOnBooking" className="text-sm">
                              Require deposit payment on booking confirmation
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input 
                              type="checkbox"
                              id="allowPartialPayments"
                              checked={formData.payments?.allowPartialPayments || true}
                              onChange={(e) => updateFormData("payments", "allowPartialPayments", e.target.checked)}
                              className="rounded border-slate-300"
                            />
                            <Label htmlFor="allowPartialPayments" className="text-sm">
                              Allow multiple partial payments before final due date
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input 
                              type="checkbox"
                              id="autoSendPaymentReminders"
                              checked={formData.payments?.autoSendPaymentReminders || true}
                              onChange={(e) => updateFormData("payments", "autoSendPaymentReminders", e.target.checked)}
                              className="rounded border-slate-300"
                            />
                            <Label htmlFor="autoSendPaymentReminders" className="text-sm">
                              Automatically send payment reminder emails
                            </Label>
                          </div>
                        </div>
                      </div>
                    </div>



                    {/* Payment Methods */}
                    <div className="space-y-4 border-t pt-6">
                      <h4 className="font-medium text-slate-900">Accepted Payment Methods</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label>Online Payments</Label>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <input 
                                type="checkbox"
                                id="acceptCreditCards"
                                checked={formData.payments?.acceptCreditCards || true}
                                onChange={(e) => updateFormData("payments", "acceptCreditCards", e.target.checked)}
                                className="rounded border-slate-300"
                              />
                              <Label htmlFor="acceptCreditCards" className="text-sm">Credit/Debit Cards</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input 
                                type="checkbox"
                                id="acceptACH"
                                checked={formData.payments?.acceptACH || false}
                                onChange={(e) => updateFormData("payments", "acceptACH", e.target.checked)}
                                className="rounded border-slate-300"
                              />
                              <Label htmlFor="acceptACH" className="text-sm">Bank Transfers (ACH)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input 
                                type="checkbox"
                                id="acceptPayPal"
                                checked={formData.payments?.acceptPayPal || false}
                                onChange={(e) => updateFormData("payments", "acceptPayPal", e.target.checked)}
                                className="rounded border-slate-300"
                              />
                              <Label htmlFor="acceptPayPal" className="text-sm">PayPal</Label>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label>Offline Payments</Label>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <input 
                                type="checkbox"
                                id="acceptCheck"
                                checked={formData.payments?.acceptCheck || true}
                                onChange={(e) => updateFormData("payments", "acceptCheck", e.target.checked)}
                                className="rounded border-slate-300"
                              />
                              <Label htmlFor="acceptCheck" className="text-sm">Checks</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input 
                                type="checkbox"
                                id="acceptCash"
                                checked={formData.payments?.acceptCash || true}
                                onChange={(e) => updateFormData("payments", "acceptCash", e.target.checked)}
                                className="rounded border-slate-300"
                              />
                              <Label htmlFor="acceptCash" className="text-sm">Cash</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input 
                                type="checkbox"
                                id="acceptWireTransfer"
                                checked={formData.payments?.acceptWireTransfer || false}
                                onChange={(e) => updateFormData("payments", "acceptWireTransfer", e.target.checked)}
                                className="rounded border-slate-300"
                              />
                              <Label htmlFor="acceptWireTransfer" className="text-sm">Wire Transfer</Label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <Button 
                        onClick={() => handleSaveSection("payments")}
                        disabled={saveSettingsMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Payment Settings
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Security Settings */}
              <TabsContent value="security" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-red-600" />
                      Security & Privacy
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                        <Select 
                          value={formData.security.sessionTimeout.toString()} 
                          onValueChange={(value) => updateFormData("security", "sessionTimeout", parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="30">30 minutes</SelectItem>
                            <SelectItem value="60">1 hour</SelectItem>
                            <SelectItem value="120">2 hours</SelectItem>
                            <SelectItem value="480">8 hours</SelectItem>
                            <SelectItem value="1440">24 hours</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="passwordPolicy">Password Policy</Label>
                        <Select 
                          value={formData.security.passwordPolicy} 
                          onValueChange={(value) => updateFormData("security", "passwordPolicy", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="basic">Basic (8+ characters)</SelectItem>
                            <SelectItem value="strong">Strong (8+ chars, mixed case, numbers)</SelectItem>
                            <SelectItem value="strict">Strict (12+ chars, mixed case, numbers, symbols)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-base font-medium">Audit Logging</Label>
                          <p className="text-sm text-slate-600">Track user actions and system events</p>
                        </div>
                        <Switch
                          checked={formData.security.auditLogging}
                          onCheckedChange={(checked) => updateFormData("security", "auditLogging", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-base font-medium">Two-Factor Authentication</Label>
                          <p className="text-sm text-slate-600">Require 2FA for all users</p>
                        </div>
                        <Switch
                          checked={formData.security.twoFactorEnabled}
                          onCheckedChange={(checked) => updateFormData("security", "twoFactorEnabled", checked)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dataBackupFrequency">Data Backup Frequency</Label>
                      <Select 
                        value={formData.security.dataBackupFrequency} 
                        onValueChange={(value) => updateFormData("security", "dataBackupFrequency", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="pt-4 border-t">
                      <Button 
                        onClick={() => handleSaveSection("security")}
                        disabled={saveSettingsMutation.isPending}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Security Settings
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}

// Stripe Payment Integration Component
function StripePaymentSection() {
  const { toast } = useToast();
  const [testingPayment, setTestingPayment] = useState(false);
  
  // Query Stripe status
  const stripeStatusQuery = useQuery({
    queryKey: ["/api/stripe/status"],
    staleTime: 30000, // Cache for 30 seconds
  });
  
  const { data: stripeStatus, isLoading: statusLoading } = stripeStatusQuery;

  // Test payment intent creation
  const testPaymentMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          amount: 10.00, // $10 test amount
          metadata: { test: true, booking_id: "test-" + Date.now() }
        }),
      });
      if (!response.ok) throw new Error("Failed to create payment intent");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Payment Test Successful",
        description: `Payment intent created: ${data.paymentIntentId}`,
      });
      setTestingPayment(false);
    },
    onError: (error: any) => {
      toast({
        title: "Payment Test Failed",
        description: error.message || "Failed to create payment intent",
        variant: "destructive",
      });
      setTestingPayment(false);
    },
  });

  const handleTestPayment = () => {
    setTestingPayment(true);
    testPaymentMutation.mutate();
  };

  const isConfigured = stripeStatus?.configured;
  const isReady = stripeStatus?.ready;

  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <CreditCard className="w-5 h-5 text-purple-600" />
          <div>
            <h4 className="font-medium">Stripe Payments</h4>
            <p className="text-sm text-slate-600">Accept credit card payments for bookings and events</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={isReady ? "default" : "secondary"}>
            {statusLoading ? "Checking..." : isReady ? "Ready" : "Setup Required"}
          </Badge>
          <Button
            onClick={() => {
              stripeStatusQuery.refetch();
            }}
            variant="ghost"
            size="sm"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Configuration Status */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Stripe Connect Account:</span>
          <div className="flex items-center gap-2">
            {isConfigured ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-green-600">Connected</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-red-600" />
                <span className="text-red-600">Not Connected</span>
              </>
            )}
          </div>
        </div>
        
        {isConfigured && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Payment Processing:</span>
            <div className="flex items-center gap-2">
              {isReady ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-green-600">Active</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span className="text-amber-600">Setup Required</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Setup Instructions */}
      {!isConfigured && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800 dark:text-blue-200">Connect Your Stripe Account</p>
              <p className="text-blue-700 dark:text-blue-300 text-sm mt-1">
                Connect your Stripe account to start accepting payments through the venue management system.
              </p>
              <div className="mt-3">
                <Button 
                  onClick={async () => {
                    // Initialize the connection process
                    try {
                      await apiRequest("POST", "/api/stripe/connect/initialize");
                      // Open the Stripe Connect onboarding
                      window.open(
                        "https://connect.stripe.com/d/setup/s/_SqBRbOzYAs1NHOUIfHZJLBpBD4/YWNjdF8xUnVWNHlSQ1ROTFBEaDJ2/9f48a3151cb6a548c",
                        "_blank"
                      );
                      
                      // Refresh status after a delay
                      setTimeout(() => {
                        stripeStatusQuery.refetch();
                      }, 2000);
                      
                      toast({
                        title: "Opening Stripe Connect",
                        description: "Complete the setup in the new window, then return here.",
                      });
                    } catch (error) {
                      toast({
                        title: "Error",
                        description: "Failed to initialize Stripe Connect",
                        variant: "destructive"
                      });
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Connect Stripe Account
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manage Connected Account */}
      {isConfigured && (
        <div className="space-y-3 mb-4">
          <Button
            onClick={async () => {
              try {
                const response = await apiRequest("POST", "/api/stripe/connect/create-login-link");
                const data = await response.json();
                window.open(data.loginUrl, '_blank');
              } catch (error) {
                toast({
                  title: "Error",
                  description: "Failed to open Stripe dashboard",
                  variant: "destructive"
                });
              }
            }}
            variant="outline"
            className="w-full"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Manage Stripe Dashboard
          </Button>
          
          <Button
            onClick={async () => {
              try {
                await apiRequest("DELETE", "/api/stripe/connect/disconnect");
                toast({
                  title: "Success",
                  description: "Stripe account disconnected successfully"
                });
                stripeStatusQuery.refetch();
              } catch (error) {
                toast({
                  title: "Error",
                  description: "Failed to disconnect Stripe account",
                  variant: "destructive"
                });
              }
            }}
            variant="outline"
            className="w-full text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
          >
            <XCircle className="w-4 h-4 mr-2" />
            Disconnect Stripe Account
          </Button>
        </div>
      )}

      {/* Test Payment Button */}
      {isReady && (
        <div className="space-y-2">
          <Button
            onClick={handleTestPayment}
            disabled={testingPayment || testPaymentMutation.isPending}
            variant="outline"
            className="w-full"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            {testingPayment || testPaymentMutation.isPending ? "Testing..." : "Test Payment Integration"}
          </Button>
        </div>
      )}

      {/* Info Section */}
      <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <CreditCard className="w-4 h-4 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-1">About Stripe Integration</p>
            <p>
              This integration uses Stripe Connect to securely process payments for venue bookings and events. 
              Stripe Connect provides a complete payment solution with built-in compliance and fraud protection.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}