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
  Palette,
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
  Check
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
    appearance: {
      theme: "light",
      primaryColor: "blue",
      accentColor: "purple",
      fontFamily: "inter",
      compactMode: false,
      sidebarCollapsed: false
    },
    integrations: {
      stripeConnected: false,
      emailProvider: "sendgrid",
      smsProvider: "twilio",
      calendarSync: "google",
      analyticsEnabled: true
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
    taxes: {
      defaultTaxRate: 8.5,
      taxName: "Sales Tax",
      taxNumber: "",
      applyToServices: true,
      applyToPackages: true,
      includeTaxInPrice: false
    }
  });

  // Initialize form data when settings load
  useEffect(() => {
    if (settings) {
      setFormData(prev => ({
        ...prev,
        ...settings
      }));
    }
  }, [settings]);

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      // Convert the nested data into key-value pairs for the settings API
      const settingsUpdates = Object.entries(data).map(([key, value]) => ({
        key,
        value
      }));
      
      // Update each setting individually
      const responses = await Promise.all(
        settingsUpdates.map(setting => 
          apiRequest("POST", "/api/settings", setting)
        )
      );
      
      return responses;
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
    saveSettingsMutation.mutate(sectionData);
  };

  const handleSaveAll = () => {
    saveSettingsMutation.mutate(formData);
  };

  const updateFormData = (section: string, field: string, value: any) => {
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
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="bg-white"
                >
                  Reset Changes
                </Button>
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
                <TabsTrigger value="appearance" className="data-[state=active]:bg-white flex flex-col gap-1 py-3 px-2">
                  <Palette className="w-4 h-4" />
                  <span className="text-xs">Appearance</span>
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
                  <CreditCard className="w-4 h-4" />
                  <span className="text-xs">Taxes</span>
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
                            <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                            <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                            <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                            <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                            <SelectItem value="Europe/London">London (GMT)</SelectItem>
                            <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                            <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
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
              </TabsContent>

              {/* Appearance Settings */}
              <TabsContent value="appearance" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="w-5 h-5 text-purple-600" />
                      Interface & Appearance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="theme">Theme</Label>
                        <Select 
                          value={formData.appearance.theme} 
                          onValueChange={(value) => updateFormData("appearance", "theme", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">Light Theme</SelectItem>
                            <SelectItem value="dark">Dark Theme</SelectItem>
                            <SelectItem value="auto">Auto (System)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="primaryColor">Primary Color</Label>
                        <Select 
                          value={formData.appearance.primaryColor} 
                          onValueChange={(value) => updateFormData("appearance", "primaryColor", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="blue">Blue</SelectItem>
                            <SelectItem value="green">Green</SelectItem>
                            <SelectItem value="purple">Purple</SelectItem>
                            <SelectItem value="red">Red</SelectItem>
                            <SelectItem value="orange">Orange</SelectItem>
                            <SelectItem value="teal">Teal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-base font-medium">Compact Mode</Label>
                          <p className="text-sm text-slate-600">Use smaller spacing and fonts</p>
                        </div>
                        <Switch
                          checked={formData.appearance.compactMode}
                          onCheckedChange={(checked) => updateFormData("appearance", "compactMode", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-base font-medium">Collapsed Sidebar</Label>
                          <p className="text-sm text-slate-600">Start with sidebar collapsed</p>
                        </div>
                        <Switch
                          checked={formData.appearance.sidebarCollapsed}
                          onCheckedChange={(checked) => updateFormData("appearance", "sidebarCollapsed", checked)}
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <Button 
                        onClick={() => handleSaveSection("appearance")}
                        disabled={saveSettingsMutation.isPending}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Appearance Settings
                      </Button>
                    </div>
                  </CardContent>
                </Card>
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
                    
                    {/* Stripe Integration */}
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <CreditCard className="w-5 h-5 text-purple-600" />
                          <div>
                            <h4 className="font-medium">Stripe Payments</h4>
                            <p className="text-sm text-slate-600">Accept online payments</p>
                          </div>
                        </div>
                        <Badge variant={formData.integrations.stripeConnected ? "default" : "secondary"}>
                          {formData.integrations.stripeConnected ? "Connected" : "Not Connected"}
                        </Badge>
                      </div>
                      <Button variant="outline" className="w-full">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        {formData.integrations.stripeConnected ? "Manage Stripe Account" : "Connect Stripe"}
                      </Button>
                    </div>

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
                          <SelectItem value="sendgrid">SendGrid</SelectItem>
                          <SelectItem value="mailgun">Mailgun</SelectItem>
                          <SelectItem value="resend">Resend</SelectItem>
                          <SelectItem value="postmark">Postmark</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

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

              {/* Taxes Settings */}
              <TabsContent value="taxes" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-emerald-600" />
                      Tax Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="taxRate">Default Tax Rate (%)</Label>
                        <Input
                          id="taxRate"
                          type="number"
                          step="0.1"
                          value={formData.taxes.defaultTaxRate}
                          onChange={(e) => updateFormData("taxes", "defaultTaxRate", parseFloat(e.target.value))}
                          placeholder="8.5"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="taxName">Tax Name</Label>
                        <Input
                          id="taxName"
                          value={formData.taxes.taxName}
                          onChange={(e) => updateFormData("taxes", "taxName", e.target.value)}
                          placeholder="Sales Tax"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="taxNumber">Tax ID/Number</Label>
                        <Input
                          id="taxNumber"
                          value={formData.taxes.taxNumber}
                          onChange={(e) => updateFormData("taxes", "taxNumber", e.target.value)}
                          placeholder="12-3456789"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-base font-medium">Apply to Services</Label>
                          <p className="text-sm text-slate-600">Include tax on all service charges</p>
                        </div>
                        <Switch
                          checked={formData.taxes.applyToServices}
                          onCheckedChange={(checked) => updateFormData("taxes", "applyToServices", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-base font-medium">Apply to Packages</Label>
                          <p className="text-sm text-slate-600">Include tax on package pricing</p>
                        </div>
                        <Switch
                          checked={formData.taxes.applyToPackages}
                          onCheckedChange={(checked) => updateFormData("taxes", "applyToPackages", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-base font-medium">Include Tax in Price</Label>
                          <p className="text-sm text-slate-600">Show prices with tax included</p>
                        </div>
                        <Switch
                          checked={formData.taxes.includeTaxInPrice}
                          onCheckedChange={(checked) => updateFormData("taxes", "includeTaxInPrice", checked)}
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <Button 
                        onClick={() => handleSaveSection("taxes")}
                        disabled={saveSettingsMutation.isPending}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Tax Settings
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