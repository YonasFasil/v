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
  Database
} from "lucide-react";

export default function Settings() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
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
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
              <TabsTrigger value="business" className="flex items-center gap-2">
                <Building className="w-4 h-4" />
                <span className="hidden sm:inline">Business</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">Notifications</span>
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center gap-2">
                <SettingsIcon className="w-4 h-4" />
                <span className="hidden sm:inline">AI Features</span>
              </TabsTrigger>
              <TabsTrigger value="payments" className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                <span className="hidden sm:inline">Payments</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Security</span>
              </TabsTrigger>
              <TabsTrigger value="integrations" className="flex items-center gap-2">
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
                    <SettingsIcon className="w-5 h-5" />
                    AI Features Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-4">Core AI Features</h4>
                    <div className="space-y-3">
                      {[
                        { key: 'enableAiSuggestions', label: 'AI Suggestions & Recommendations' },
                        { key: 'smartScheduling', label: 'Smart Scheduling Optimization' },
                        { key: 'leadScoring', label: 'Automated Lead Scoring' },
                        { key: 'predictiveAnalytics', label: 'Predictive Analytics' },
                        { key: 'voiceBooking', label: 'Voice-to-Text Booking' }
                      ].map(({ key, label }) => (
                        <div key={key} className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <Label>{label}</Label>
                            <span className="text-xs text-gray-500">Powered by Google Gemini AI</span>
                          </div>
                          <Switch
                            checked={aiSettings[key as keyof typeof aiSettings] as boolean}
                            onCheckedChange={(checked) => setAiSettings(prev => ({ ...prev, [key]: checked }))}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-4">AI Automation</h4>
                    <div className="space-y-3">
                      {[
                        { key: 'autoEmailReplies', label: 'Automated Email Replies' },
                        { key: 'autoProcessBookings', label: 'Auto-process Simple Bookings' }
                      ].map(({ key, label }) => (
                        <div key={key} className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <Label>{label}</Label>
                            <span className="text-xs text-red-500">Use with caution - requires monitoring</span>
                          </div>
                          <Switch
                            checked={aiSettings[key as keyof typeof aiSettings] as boolean}
                            onCheckedChange={(checked) => setAiSettings(prev => ({ ...prev, [key]: checked }))}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

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

                  <Button onClick={() => saveSettings("AI Features")} className="bg-blue-600 hover:bg-blue-700">
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
    </div>
  );
}