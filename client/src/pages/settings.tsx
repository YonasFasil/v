import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { SmartSchedulingModal } from "@/components/ai/smart-scheduling-modal";
import { EmailReplyModal } from "@/components/ai/email-reply-modal";
import { LeadScoringModal } from "@/components/ai/lead-scoring-modal";
import { 
  Settings as SettingsIcon, 
  Building, 
  Users, 
  CreditCard, 
  Bell, 
  Shield, 
  Palette, 
  Globe,
  Mail,
  Calendar,
  Clock,
  DollarSign,
  Save,
  Key,
  Database,
  Brain,
  Zap,
  Star,
  Bot
} from "lucide-react";

export default function Settings() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showSmartScheduling, setShowSmartScheduling] = useState(false);
  const [showEmailReply, setShowEmailReply] = useState(false);
  const [showLeadScoring, setShowLeadScoring] = useState(false);
  const { toast } = useToast();

  // Business Settings State
  const [businessSettings, setBusinessSettings] = useState({
    companyName: "Venuine Events",
    companyEmail: "contact@venuine.com",
    companyPhone: "+1 (555) 123-4567",
    companyAddress: "123 Business Street, City, State 12345",
    website: "https://venuine.com",
    taxId: "12-3456789",
    description: "Premier venue management and event planning services",
    logo: "",
    timezone: "America/New_York",
    currency: "USD",
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12h"
  });

  // Notification Settings State
  const [notificationSettings, setNotificationSettings] = useState({
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
  });

  // AI Settings State
  const [aiSettings, setAiSettings] = useState({
    enableAiSuggestions: true,
    autoEmailReplies: false,
    leadScoring: true,
    smartScheduling: true,
    predictiveAnalytics: true,
    voiceBooking: true,
    aiInsightFrequency: "daily",
    confidenceThreshold: 80,
    autoProcessBookings: false,
    aiLanguage: "en"
  });

  // Payment Settings State
  const [paymentSettings, setPaymentSettings] = useState({
    defaultPaymentTerms: "net30",
    lateFeePercentage: "5",
    depositPercentage: "25",
    acceptedPaymentMethods: ["credit_card", "bank_transfer", "check"],
    autoInvoicing: true,
    paymentReminders: true,
    reminderDaysBefore: "7",
    currencies: ["USD", "EUR", "GBP"],
    taxRate: "8.5"
  });

  // Deposit Settings State
  const [depositSettings, setDepositSettings] = useState({
    defaultDepositType: "percentage",
    defaultDepositValue: "25",
    minimumDepositPercentage: "10",
    maximumDepositPercentage: "50",
    minimumDepositAmount: "100",
    depositDueDays: "7",
    allowCustomDeposit: true,
    autoCalculateDeposit: true,
    requireDepositForBooking: false
  });

  // Security Settings State
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: "60",
    passwordPolicy: "strong",
    loginAttempts: "5",
    dataBackupFrequency: "daily",
    auditLogging: true,
    encryptionEnabled: true,
    accessControlEnabled: true
  });

  // Email Settings State
  const [emailSettings, setEmailSettings] = useState({
    provider: "gmail", // gmail, sendgrid, custom
    smtpHost: "smtp.gmail.com",
    smtpPort: "587",
    emailUser: "",
    emailPass: "",
    fromName: "Venuine Events",
    fromEmail: "noreply@venuine.com",
    replyToEmail: "contact@venuine.com",
    emailTemplate: "professional",
    includeSignature: true,
    signatureText: "Best regards,\nThe Venuine Events Team",
    enableEmailLogging: true,
    testMode: false
  });



  const saveSettings = (section: string) => {
    toast({
      title: "Settings saved",
      description: `${section} settings have been updated successfully`
    });
  };

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
          subtitle="Configure your venue management system"
          onMobileMenuToggle={() => setMobileNavOpen(true)}
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <Tabs defaultValue="business" className="space-y-6">
            <TabsList className="flex flex-wrap w-full justify-start gap-1 h-auto p-1">
              <TabsTrigger value="business" className="flex items-center gap-1 px-3 py-2 text-sm">
                <Building className="w-4 h-4" />
                <span className="hidden sm:inline">Business</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-1 px-3 py-2 text-sm">
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">Notifications</span>
              </TabsTrigger>
              <TabsTrigger value="email" className="flex items-center gap-1 px-3 py-2 text-sm">
                <Mail className="w-4 h-4" />
                <span className="hidden sm:inline">Email</span>
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center gap-1 px-3 py-2 text-sm">
                <SettingsIcon className="w-4 h-4" />
                <span className="hidden sm:inline">AI Features</span>
              </TabsTrigger>
              <TabsTrigger value="payments" className="flex items-center gap-1 px-3 py-2 text-sm">
                <CreditCard className="w-4 h-4" />
                <span className="hidden sm:inline">Payments</span>
              </TabsTrigger>
              <TabsTrigger value="taxes" className="flex items-center gap-1 px-3 py-2 text-sm">
                <DollarSign className="w-4 h-4" />
                <span className="hidden sm:inline">Tax & Fees</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-1 px-3 py-2 text-sm">
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Security</span>
              </TabsTrigger>
              <TabsTrigger value="integrations" className="flex items-center gap-1 px-3 py-2 text-sm">
                <Key className="w-4 h-4" />
                <span className="hidden sm:inline">Integrations</span>
              </TabsTrigger>
            </TabsList>

            {/* Business Settings */}
            <TabsContent value="business" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    Business Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input
                        id="companyName"
                        value={businessSettings.companyName}
                        onChange={(e) => setBusinessSettings(prev => ({ ...prev, companyName: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="companyEmail">Company Email</Label>
                      <Input
                        id="companyEmail"
                        type="email"
                        value={businessSettings.companyEmail}
                        onChange={(e) => setBusinessSettings(prev => ({ ...prev, companyEmail: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="companyPhone">Phone Number</Label>
                      <Input
                        id="companyPhone"
                        value={businessSettings.companyPhone}
                        onChange={(e) => setBusinessSettings(prev => ({ ...prev, companyPhone: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={businessSettings.website}
                        onChange={(e) => setBusinessSettings(prev => ({ ...prev, website: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="companyAddress">Business Address</Label>
                    <Textarea
                      id="companyAddress"
                      value={businessSettings.companyAddress}
                      onChange={(e) => setBusinessSettings(prev => ({ ...prev, companyAddress: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Business Description</Label>
                    <Textarea
                      id="description"
                      value={businessSettings.description}
                      onChange={(e) => setBusinessSettings(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select value={businessSettings.timezone} onValueChange={(value) => setBusinessSettings(prev => ({ ...prev, timezone: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="America/New_York">Eastern Time</SelectItem>
                          <SelectItem value="America/Chicago">Central Time</SelectItem>
                          <SelectItem value="America/Denver">Mountain Time</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                          <SelectItem value="Europe/London">GMT</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="currency">Currency</Label>
                      <Select value={businessSettings.currency} onValueChange={(value) => setBusinessSettings(prev => ({ ...prev, currency: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                          <SelectItem value="CAD">CAD (C$)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="dateFormat">Date Format</Label>
                      <Select value={businessSettings.dateFormat} onValueChange={(value) => setBusinessSettings(prev => ({ ...prev, dateFormat: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                          <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                          <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button onClick={() => saveSettings("Business")} className="bg-blue-600 hover:bg-blue-700">
                    <Save className="w-4 h-4 mr-2" />
                    Save Business Settings
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Email Configuration */}
            <TabsContent value="email" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Email Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Email Provider Selection */}
                  <div>
                    <h4 className="font-medium mb-4">Email Provider</h4>
                    <Select value={emailSettings.provider} onValueChange={(value) => setEmailSettings(prev => ({ ...prev, provider: value }))}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gmail">Gmail (Free - Recommended)</SelectItem>
                        <SelectItem value="sendgrid">SendGrid</SelectItem>
                        <SelectItem value="custom">Custom SMTP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* Gmail Configuration */}
                  {emailSettings.provider === "gmail" && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                          <div>
                            <h5 className="font-medium text-blue-900">Gmail Setup Instructions</h5>
                            <p className="text-sm text-blue-700 mt-1">
                              To use Gmail for sending emails, you'll need to enable 2-Step Verification and create an App Password.
                            </p>
                            <div className="mt-2 text-sm text-blue-700">
                              <p><strong>Step 1:</strong> Go to Google Account → Security → 2-Step Verification</p>
                              <p><strong>Step 2:</strong> Create an "App Password" for Mail</p>
                              <p><strong>Step 3:</strong> Add credentials to Replit Secrets (not here)</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="fromName">From Name</Label>
                          <Input
                            id="fromName"
                            value={emailSettings.fromName}
                            onChange={(e) => setEmailSettings(prev => ({ ...prev, fromName: e.target.value }))}
                            placeholder="Venuine Events"
                          />
                        </div>
                        <div>
                          <Label htmlFor="fromEmail">From Email</Label>
                          <Input
                            id="fromEmail"
                            type="email"
                            value={emailSettings.fromEmail}
                            onChange={(e) => setEmailSettings(prev => ({ ...prev, fromEmail: e.target.value }))}
                            placeholder="noreply@venuine.com"
                          />
                        </div>
                      </div>

                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <Key className="w-5 h-5 text-amber-600 mt-0.5" />
                          <div>
                            <h5 className="font-medium text-amber-900">Security Note</h5>
                            <p className="text-sm text-amber-700">
                              <strong>EMAIL_USER</strong> and <strong>EMAIL_PASS</strong> should be set in Replit Secrets, not in this interface. 
                              This keeps your credentials secure and encrypted.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Custom SMTP Configuration */}
                  {emailSettings.provider === "custom" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="smtpHost">SMTP Host</Label>
                        <Input
                          id="smtpHost"
                          value={emailSettings.smtpHost}
                          onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpHost: e.target.value }))}
                          placeholder="smtp.example.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="smtpPort">SMTP Port</Label>
                        <Input
                          id="smtpPort"
                          value={emailSettings.smtpPort}
                          onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpPort: e.target.value }))}
                          placeholder="587"
                        />
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Email Template Settings */}
                  <div>
                    <h4 className="font-medium mb-4">Email Templates</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="emailTemplate">Template Style</Label>
                        <Select value={emailSettings.emailTemplate} onValueChange={(value) => setEmailSettings(prev => ({ ...prev, emailTemplate: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="professional">Professional</SelectItem>
                            <SelectItem value="modern">Modern</SelectItem>
                            <SelectItem value="minimal">Minimal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="replyToEmail">Reply-To Email</Label>
                        <Input
                          id="replyToEmail"
                          type="email"
                          value={emailSettings.replyToEmail}
                          onChange={(e) => setEmailSettings(prev => ({ ...prev, replyToEmail: e.target.value }))}
                          placeholder="contact@venuine.com"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Include Email Signature</Label>
                      <p className="text-xs text-gray-500">Add company signature to emails</p>
                    </div>
                    <Switch
                      checked={emailSettings.includeSignature}
                      onCheckedChange={(checked) => setEmailSettings(prev => ({ ...prev, includeSignature: checked }))}
                    />
                  </div>

                  {emailSettings.includeSignature && (
                    <div>
                      <Label htmlFor="signatureText">Email Signature</Label>
                      <Textarea
                        id="signatureText"
                        value={emailSettings.signatureText}
                        onChange={(e) => setEmailSettings(prev => ({ ...prev, signatureText: e.target.value }))}
                        placeholder="Best regards,&#10;The Venuine Events Team"
                        className="min-h-[80px]"
                      />
                    </div>
                  )}

                  <Button onClick={() => saveSettings("Email")} className="bg-blue-600 hover:bg-blue-700">
                    <Save className="w-4 h-4 mr-2" />
                    Save Email Settings
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notification Settings */}
            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Notification Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-4">General Notifications</h4>
                    <div className="space-y-3">
                      {[
                        { key: 'emailNotifications', label: 'Email Notifications', icon: Mail },
                        { key: 'smsNotifications', label: 'SMS Notifications', icon: Bell },
                        { key: 'pushNotifications', label: 'Push Notifications', icon: Bell }
                      ].map(({ key, label, icon: Icon }) => (
                        <div key={key} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-gray-500" />
                            <Label>{label}</Label>
                          </div>
                          <Switch
                            checked={notificationSettings[key as keyof typeof notificationSettings] as boolean}
                            onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, [key]: checked }))}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-4">Event & Booking Notifications</h4>
                    <div className="space-y-3">
                      {[
                        { key: 'bookingConfirmations', label: 'Booking Confirmations' },
                        { key: 'reminderEmails', label: 'Event Reminder Emails' },
                        { key: 'taskDeadlines', label: 'Task Deadlines' },
                        { key: 'customerMessages', label: 'Customer Messages' }
                      ].map(({ key, label }) => (
                        <div key={key} className="flex items-center justify-between">
                          <Label>{label}</Label>
                          <Switch
                            checked={notificationSettings[key as keyof typeof notificationSettings] as boolean}
                            onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, [key]: checked }))}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-4">Business & Analytics</h4>
                    <div className="space-y-3">
                      {[
                        { key: 'paymentAlerts', label: 'Payment Alerts' },
                        { key: 'weeklyReports', label: 'Weekly Reports' },
                        { key: 'leadAssignments', label: 'Lead Assignments' },
                        { key: 'lowInventoryAlerts', label: 'Low Inventory Alerts' }
                      ].map(({ key, label }) => (
                        <div key={key} className="flex items-center justify-between">
                          <Label>{label}</Label>
                          <Switch
                            checked={notificationSettings[key as keyof typeof notificationSettings] as boolean}
                            onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, [key]: checked }))}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button onClick={() => saveSettings("Notification")} className="bg-blue-600 hover:bg-blue-700">
                    <Save className="w-4 h-4 mr-2" />
                    Save Notification Settings
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* AI Features Settings */}
            <TabsContent value="ai" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-600" />
                    AI Features Configuration
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700">NEW</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Core AI Features */}
                  <div>
                    <h4 className="font-medium mb-4 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-blue-600" />
                      Core AI Features
                    </h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* AI Analytics & Reports */}
                      <Card className="border-blue-200 bg-blue-50">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Brain className="w-5 h-5 text-blue-600" />
                              <div>
                                <h5 className="font-medium">AI Analytics & Reports</h5>
                                <p className="text-xs text-gray-600">Real-time insights and trend analysis</p>
                              </div>
                            </div>
                            <Switch
                              checked={aiSettings.predictiveAnalytics}
                              onCheckedChange={(checked) => setAiSettings(prev => ({ ...prev, predictiveAnalytics: checked }))}
                            />
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                            onClick={() => window.open('/ai-analytics', '_blank')}
                          >
                            View Analytics Dashboard
                          </Button>
                        </CardContent>
                      </Card>

                      {/* Smart Scheduling */}
                      <Card className="border-green-200 bg-green-50">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Zap className="w-5 h-5 text-green-600" />
                              <div>
                                <h5 className="font-medium">Smart Scheduling</h5>
                                <p className="text-xs text-gray-600">AI-optimized time slot suggestions</p>
                              </div>
                            </div>
                            <Switch
                              checked={aiSettings.smartScheduling}
                              onCheckedChange={(checked) => setAiSettings(prev => ({ ...prev, smartScheduling: checked }))}
                            />
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                            onClick={() => setShowSmartScheduling(true)}
                          >
                            Test Smart Scheduling
                          </Button>
                        </CardContent>
                      </Card>

                      {/* Auto Email Replies */}
                      <Card className="border-orange-200 bg-orange-50">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Mail className="w-5 h-5 text-orange-600" />
                              <div>
                                <h5 className="font-medium">Auto Email Replies</h5>
                                <p className="text-xs text-gray-600">AI-generated customer responses</p>
                              </div>
                            </div>
                            <Switch
                              checked={aiSettings.autoEmailReplies}
                              onCheckedChange={(checked) => setAiSettings(prev => ({ ...prev, autoEmailReplies: checked }))}
                            />
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                            onClick={() => setShowEmailReply(true)}
                          >
                            Test Email Generator
                          </Button>
                        </CardContent>
                      </Card>

                      {/* Lead Scoring */}
                      <Card className="border-purple-200 bg-purple-50">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Star className="w-5 h-5 text-purple-600" />
                              <div>
                                <h5 className="font-medium">Lead Scoring</h5>
                                <p className="text-xs text-gray-600">AI-powered lead prioritization</p>
                              </div>
                            </div>
                            <Switch
                              checked={aiSettings.leadScoring}
                              onCheckedChange={(checked) => setAiSettings(prev => ({ ...prev, leadScoring: checked }))}
                            />
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                            onClick={() => setShowLeadScoring(true)}
                          >
                            Test Lead Scoring
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <Separator />

                  {/* AI Configuration */}
                  <div>
                    <h4 className="font-medium mb-4 flex items-center gap-2">
                      <SettingsIcon className="w-4 h-4" />
                      AI Configuration
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="aiInsightFrequency">AI Insights Frequency</Label>
                        <Select value={aiSettings.aiInsightFrequency} onValueChange={(value) => setAiSettings(prev => ({ ...prev, aiInsightFrequency: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hourly">Every Hour</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="manual">Manual Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="confidenceThreshold">AI Confidence Threshold (%)</Label>
                        <Input
                          id="confidenceThreshold"
                          type="number"
                          min="50"
                          max="100"
                          value={aiSettings.confidenceThreshold}
                          onChange={(e) => setAiSettings(prev => ({ ...prev, confidenceThreshold: parseInt(e.target.value) }))}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Additional AI Features */}
                  <div>
                    <h4 className="font-medium mb-4">Additional Features</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Voice-to-Text Booking</Label>
                          <p className="text-xs text-gray-500">Convert speech to booking forms</p>
                        </div>
                        <Switch
                          checked={aiSettings.voiceBooking}
                          onCheckedChange={(checked) => setAiSettings(prev => ({ ...prev, voiceBooking: checked }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>AI Suggestions</Label>
                          <p className="text-xs text-gray-500">Smart recommendations in booking flow</p>
                        </div>
                        <Switch
                          checked={aiSettings.enableAiSuggestions}
                          onCheckedChange={(checked) => setAiSettings(prev => ({ ...prev, enableAiSuggestions: checked }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Warning Banner */}
                  <Card className="border-amber-200 bg-amber-50">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Bot className="h-5 w-5 text-amber-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-amber-800">AI Feature Notice</p>
                          <p className="text-sm text-amber-700">
                            These AI features are powered by Google Gemini. Always review AI-generated content before using. 
                            Results may vary and should be verified for accuracy.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Button onClick={() => saveSettings("AI Features")} className="bg-purple-600 hover:bg-purple-700">
                    <Save className="w-4 h-4 mr-2" />
                    Save AI Settings
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payment Settings */}
            <TabsContent value="payments" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Payment Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="defaultPaymentTerms">Default Payment Terms</Label>
                      <Select value={paymentSettings.defaultPaymentTerms} onValueChange={(value) => setPaymentSettings(prev => ({ ...prev, defaultPaymentTerms: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="due_on_receipt">Due on Receipt</SelectItem>
                          <SelectItem value="net15">Net 15 Days</SelectItem>
                          <SelectItem value="net30">Net 30 Days</SelectItem>
                          <SelectItem value="net60">Net 60 Days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="depositPercentage">Required Deposit (%)</Label>
                      <Input
                        id="depositPercentage"
                        type="number"
                        min="0"
                        max="100"
                        value={paymentSettings.depositPercentage}
                        onChange={(e) => setPaymentSettings(prev => ({ ...prev, depositPercentage: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lateFeePercentage">Late Fee (%)</Label>
                      <Input
                        id="lateFeePercentage"
                        type="number"
                        min="0"
                        max="50"
                        value={paymentSettings.lateFeePercentage}
                        onChange={(e) => setPaymentSettings(prev => ({ ...prev, lateFeePercentage: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="taxRate">Tax Rate (%)</Label>
                      <Input
                        id="taxRate"
                        type="number"
                        min="0"
                        max="50"
                        step="0.1"
                        value={paymentSettings.taxRate}
                        onChange={(e) => setPaymentSettings(prev => ({ ...prev, taxRate: e.target.value }))}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-4">Deposit Configuration</h4>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-100 rounded-full p-1">
                          <DollarSign className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <h5 className="font-medium text-blue-900">Deposit Management</h5>
                          <p className="text-sm text-blue-700 mt-1">
                            Configure how deposits are calculated and required for bookings and proposals.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="defaultDepositType">Default Deposit Type</Label>
                        <Select value={depositSettings.defaultDepositType} onValueChange={(value) => setDepositSettings(prev => ({ ...prev, defaultDepositType: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">Percentage of Total</SelectItem>
                            <SelectItem value="fixed">Fixed Amount</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="defaultDepositValue">
                          Default Value ({depositSettings.defaultDepositType === 'percentage' ? '%' : '$'})
                        </Label>
                        <Input
                          id="defaultDepositValue"
                          type="number"
                          min="0"
                          value={depositSettings.defaultDepositValue}
                          onChange={(e) => setDepositSettings(prev => ({ ...prev, defaultDepositValue: e.target.value }))}
                        />
                      </div>
                      {depositSettings.defaultDepositType === 'percentage' && (
                        <>
                          <div>
                            <Label htmlFor="minimumDepositPercentage">Minimum Deposit (%)</Label>
                            <Input
                              id="minimumDepositPercentage"
                              type="number"
                              min="0"
                              max="100"
                              value={depositSettings.minimumDepositPercentage}
                              onChange={(e) => setDepositSettings(prev => ({ ...prev, minimumDepositPercentage: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="maximumDepositPercentage">Maximum Deposit (%)</Label>
                            <Input
                              id="maximumDepositPercentage"
                              type="number"
                              min="0"
                              max="100"
                              value={depositSettings.maximumDepositPercentage}
                              onChange={(e) => setDepositSettings(prev => ({ ...prev, maximumDepositPercentage: e.target.value }))}
                            />
                          </div>
                        </>
                      )}
                      <div>
                        <Label htmlFor="minimumDepositAmount">Minimum Deposit Amount ($)</Label>
                        <Input
                          id="minimumDepositAmount"
                          type="number"
                          min="0"
                          value={depositSettings.minimumDepositAmount}
                          onChange={(e) => setDepositSettings(prev => ({ ...prev, minimumDepositAmount: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="depositDueDays">Deposit Due (Days Before Event)</Label>
                        <Input
                          id="depositDueDays"
                          type="number"
                          min="0"
                          value={depositSettings.depositDueDays}
                          onChange={(e) => setDepositSettings(prev => ({ ...prev, depositDueDays: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-3 mt-4">
                      {[
                        { key: 'allowCustomDeposit', label: 'Allow Custom Deposit Amounts', desc: 'Let staff override default deposit settings per booking' },
                        { key: 'autoCalculateDeposit', label: 'Auto-Calculate Deposits', desc: 'Automatically calculate deposits in proposals and bookings' },
                        { key: 'requireDepositForBooking', label: 'Require Deposit for Booking', desc: 'Make deposit payment mandatory before confirming bookings' }
                      ].map(({ key, label, desc }) => (
                        <div key={key} className="flex items-start justify-between p-3 border rounded-lg">
                          <div>
                            <Label className="font-medium">{label}</Label>
                            <p className="text-sm text-gray-600 mt-1">{desc}</p>
                          </div>
                          <Switch
                            checked={depositSettings[key as keyof typeof depositSettings] as boolean}
                            onCheckedChange={(checked) => setDepositSettings(prev => ({ ...prev, [key]: checked }))}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-4">Payment Automation</h4>
                    <div className="space-y-3">
                      {[
                        { key: 'autoInvoicing', label: 'Automatic Invoice Generation' },
                        { key: 'paymentReminders', label: 'Automatic Payment Reminders' }
                      ].map(({ key, label }) => (
                        <div key={key} className="flex items-center justify-between">
                          <Label>{label}</Label>
                          <Switch
                            checked={paymentSettings[key as keyof typeof paymentSettings] as boolean}
                            onCheckedChange={(checked) => setPaymentSettings(prev => ({ ...prev, [key]: checked }))}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button onClick={() => saveSettings("Payment")} className="bg-blue-600 hover:bg-blue-700">
                    <Save className="w-4 h-4 mr-2" />
                    Save Payment Settings
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Settings */}
            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Security & Privacy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-4">Authentication Security</h4>
                    <div className="space-y-3">
                      {[
                        { key: 'twoFactorAuth', label: 'Two-Factor Authentication (2FA)' },
                        { key: 'auditLogging', label: 'Audit Logging' },
                        { key: 'encryptionEnabled', label: 'Data Encryption' },
                        { key: 'accessControlEnabled', label: 'Role-based Access Control' }
                      ].map(({ key, label }) => (
                        <div key={key} className="flex items-center justify-between">
                          <Label>{label}</Label>
                          <Switch
                            checked={securitySettings[key as keyof typeof securitySettings] as boolean}
                            onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, [key]: checked }))}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                      <Input
                        id="sessionTimeout"
                        type="number"
                        min="15"
                        max="480"
                        value={securitySettings.sessionTimeout}
                        onChange={(e) => setSecuritySettings(prev => ({ ...prev, sessionTimeout: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="loginAttempts">Max Login Attempts</Label>
                      <Input
                        id="loginAttempts"
                        type="number"
                        min="3"
                        max="10"
                        value={securitySettings.loginAttempts}
                        onChange={(e) => setSecuritySettings(prev => ({ ...prev, loginAttempts: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="dataBackupFrequency">Data Backup Frequency</Label>
                    <Select value={securitySettings.dataBackupFrequency} onValueChange={(value) => setSecuritySettings(prev => ({ ...prev, dataBackupFrequency: value }))}>
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

                  <Button onClick={() => saveSettings("Security")} className="bg-blue-600 hover:bg-blue-700">
                    <Save className="w-4 h-4 mr-2" />
                    Save Security Settings
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tax & Fees Settings */}
            <TabsContent value="taxes" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Tax and Fees Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 rounded-full p-1">
                        <DollarSign className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-blue-900">Tax & Fee Management</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          Configure tax rates and fees that will be automatically applied to packages and services.
                          These settings will be used during event booking calculations.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Active Tax Rules & Fees</h4>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <DollarSign className="w-4 h-4 mr-2" />
                      Add Tax/Fee
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {/* Sample tax settings - these would come from API */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                      <div>
                        <h5 className="font-medium">Sales Tax</h5>
                        <p className="text-sm text-gray-600">8.25% applied to all services</p>
                        <Badge variant="outline" className="mt-1 text-xs">
                          Services Only
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Active
                        </Badge>
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button variant="outline" size="sm">Delete</Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                      <div>
                        <h5 className="font-medium">Service Fee</h5>
                        <p className="text-sm text-gray-600">$25.00 flat fee per booking</p>
                        <Badge variant="outline" className="mt-1 text-xs">
                          Total Amount
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Active
                        </Badge>
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button variant="outline" size="sm">Delete</Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                      <div>
                        <h5 className="font-medium">Gratuity</h5>
                        <p className="text-sm text-gray-600">18% applied to packages</p>
                        <Badge variant="outline" className="mt-1 text-xs">
                          Packages Only
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          Inactive
                        </Badge>
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button variant="outline" size="sm">Delete</Button>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-3">Quick Setup</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Button variant="outline" className="p-4 h-auto flex flex-col items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        <span className="text-sm font-medium">Sales Tax</span>
                        <span className="text-xs text-gray-500">Percentage-based tax</span>
                      </Button>
                      <Button variant="outline" className="p-4 h-auto flex flex-col items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        <span className="text-sm font-medium">Service Fee</span>
                        <span className="text-xs text-gray-500">Fixed amount fee</span>
                      </Button>
                      <Button variant="outline" className="p-4 h-auto flex flex-col items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        <span className="text-sm font-medium">Gratuity</span>
                        <span className="text-xs text-gray-500">Optional tip percentage</span>
                      </Button>
                    </div>
                  </div>

                  <Button onClick={() => saveSettings('taxes')} className="bg-blue-600 hover:bg-blue-700">
                    <Save className="w-4 h-4 mr-2" />
                    Save Tax Settings
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Integrations Settings */}
            <TabsContent value="integrations" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="w-5 h-5" />
                    API Keys & Integrations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Database className="w-8 h-8 text-blue-600" />
                        <div>
                          <h4 className="font-medium">Google Gemini AI</h4>
                          <p className="text-sm text-gray-500">AI-powered features and automation</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Connected
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-8 h-8 text-purple-600" />
                        <div>
                          <h4 className="font-medium">Payment Gateway</h4>
                          <p className="text-sm text-gray-500">Process payments and subscriptions</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        Not Connected
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Mail className="w-8 h-8 text-red-600" />
                        <div>
                          <h4 className="font-medium">Email Service</h4>
                          <p className="text-sm text-gray-500">Automated email notifications</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        Not Connected
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-8 h-8 text-green-600" />
                        <div>
                          <h4 className="font-medium">Calendar Integration</h4>
                          <p className="text-sm text-gray-500">Sync with Google Calendar, Outlook</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        Not Connected
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-4">Webhook Endpoints</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <span className="text-sm font-mono">Booking Created</span>
                        <Badge variant="outline">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <span className="text-sm font-mono">Payment Received</span>
                        <Badge variant="outline">Inactive</Badge>
                      </div>
                    </div>
                  </div>

                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Key className="w-4 h-4 mr-2" />
                    Manage API Keys
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* AI Feature Modals */}
      <SmartSchedulingModal
        open={showSmartScheduling}
        onOpenChange={setShowSmartScheduling}
        eventData={{
          eventType: "corporate",
          guestCount: 50,
          duration: 4
        }}
      />

      <EmailReplyModal
        open={showEmailReply}
        onOpenChange={setShowEmailReply}
        customerName="Sample Customer"
        customerEmail="customer@example.com"
        initialMessage="I'm interested in booking your venue for a corporate event in March. We're expecting about 100 guests and would like catering included. Could you please send me more information about availability and pricing?"
      />

      <LeadScoringModal
        open={showLeadScoring}
        onOpenChange={setShowLeadScoring}
        customerData={{
          name: "Sample Customer",
          email: "customer@example.com",
          company: "Tech Corp Inc."
        }}
      />
    </div>
  );
}