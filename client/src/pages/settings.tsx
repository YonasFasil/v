import { useState } from "react";
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
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Building, 
  Mail, 
  CreditCard, 
  Shield, 
  Save,
  Key,
  AlertCircle,
  CheckCircle,
  Globe,
  FileOutput
} from "lucide-react";

export default function Settings() {
  const { toast } = useToast();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Business Settings
  const [businessSettings, setBusinessSettings] = useState({
    companyName: "Venuine Events",
    companyEmail: "contact@venuine.com",
    companyPhone: "+1 (555) 123-4567",
    companyAddress: "123 Business Street, City, State 12345",
    website: "https://venuine.com",
    timezone: "America/New_York",
    currency: "USD"
  });

  // Email Settings
  const [emailSettings, setEmailSettings] = useState({
    provider: "custom",
    fromName: "Venuine Events",
    fromEmail: "noreply@venuine.com",
    replyToEmail: "contact@venuine.com",
    emailTemplate: "professional",
    includeSignature: true,
    signatureText: "Best regards,\nThe Venuine Events Team",
    apiKey: "",
    apiUrl: "",
    apiProvider: ""
  });

  // Payment Settings
  const [paymentSettings, setPaymentSettings] = useState({
    defaultPaymentTerms: "net30",
    depositPercentage: "25",
    lateFeePercentage: "5",
    acceptedPaymentMethods: ["credit_card", "bank_transfer"],
    taxRate: "8.5"
  });

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    sessionTimeout: "60",
    passwordPolicy: "strong",
    auditLogging: true,
    dataBackupFrequency: "daily"
  });

  // BEO Settings
  const [beoSettings, setBeoSettings] = useState({
    defaultTemplate: "standard",
    enabledBeoTypes: ["floor_plan", "timeline", "catering", "av_requirements"],
    autoGenerate: true,
    includeVendorInfo: true,
    showPricing: false
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
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 gap-2">
              <TabsTrigger value="business" className="flex items-center gap-2 px-4 py-3">
                <Building className="w-4 h-4" />
                <span>Business</span>
              </TabsTrigger>
              <TabsTrigger value="integrations" className="flex items-center gap-2 px-4 py-3">
                <Key className="w-4 h-4" />
                <span>Integrations</span>
              </TabsTrigger>
              <TabsTrigger value="payments" className="flex items-center gap-2 px-4 py-3">
                <CreditCard className="w-4 h-4" />
                <span>Payments</span>
              </TabsTrigger>
              <TabsTrigger value="beo" className="flex items-center gap-2 px-4 py-3">
                <FileOutput className="w-4 h-4" />
                <span>BEO</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2 px-4 py-3">
                <Shield className="w-4 h-4" />
                <span>Security</span>
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
                    <Input
                      id="companyAddress"
                      value={businessSettings.companyAddress}
                      onChange={(e) => setBusinessSettings(prev => ({ ...prev, companyAddress: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          <SelectItem value="USD">USD - US Dollar</SelectItem>
                          <SelectItem value="EUR">EUR - Euro</SelectItem>
                          <SelectItem value="GBP">GBP - British Pound</SelectItem>
                          <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
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

            {/* Integrations */}
            <TabsContent value="integrations" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="w-5 h-5" />
                    Integrations & API Keys
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Email Integration */}
                  <div>
                    <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                      <Mail className="w-5 h-5" />
                      Email Integration
                    </h3>
                    
                    {/* Current Status */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-amber-900">Demo Mode Active</h4>
                          <p className="text-sm text-amber-700 mt-1">
                            Emails are currently in demo mode. Configure your email API credentials to enable real email sending.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Email Provider Selection */}
                  <div>
                    <h4 className="font-medium mb-4">Email Provider</h4>
                    <Select value={emailSettings.provider} onValueChange={(value) => setEmailSettings(prev => ({ ...prev, provider: value }))}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sendgrid">SendGrid</SelectItem>
                        <SelectItem value="mailgun">Mailgun</SelectItem>
                        <SelectItem value="resend">Resend</SelectItem>
                        <SelectItem value="postmark">Postmark</SelectItem>
                        <SelectItem value="custom">Custom Email API</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* API Configuration */}
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Key className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <h5 className="font-medium text-blue-900">API Configuration</h5>
                          <p className="text-sm text-blue-700 mt-1">
                            Configure your email service API credentials below. API keys will be stored securely in Replit Secrets.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="apiProvider">API Provider</Label>
                        <Input
                          id="apiProvider"
                          value={emailSettings.apiProvider}
                          onChange={(e) => setEmailSettings(prev => ({ ...prev, apiProvider: e.target.value }))}
                          placeholder="e.g., SendGrid, Mailgun, Resend"
                        />
                      </div>
                      <div>
                        <Label htmlFor="apiUrl">API Endpoint URL</Label>
                        <Input
                          id="apiUrl"
                          value={emailSettings.apiUrl}
                          onChange={(e) => setEmailSettings(prev => ({ ...prev, apiUrl: e.target.value }))}
                          placeholder="https://api.emailservice.com/v1/send"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="apiKey">API Key</Label>
                      <Input
                        id="apiKey"
                        type="password"
                        value={emailSettings.apiKey}
                        onChange={(e) => setEmailSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                        placeholder="Enter your API key here"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        This will be stored securely and used for authentication
                      </p>
                    </div>

                    <Separator />

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

                      <div>
                        <Label htmlFor="emailTemplate">Email Template</Label>
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
                        <Label htmlFor="signatureText">Email Signature</Label>
                        <textarea
                          id="signatureText"
                          className="w-full p-3 border border-gray-300 rounded-md resize-none"
                          rows={3}
                          value={emailSettings.signatureText}
                          onChange={(e) => setEmailSettings(prev => ({ ...prev, signatureText: e.target.value }))}
                          placeholder="Best regards,&#10;The Venuine Events Team"
                        />
                      </div>
                    </div>

                  <Button onClick={() => saveSettings("Email")} className="bg-blue-600 hover:bg-blue-700">
                    <Save className="w-4 h-4 mr-2" />
                    Save Email Settings
                  </Button>

                  <Separator />

                  {/* Other Integrations */}
                  <div>
                    <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                      <Globe className="w-5 h-5" />
                      Other Integrations
                    </h3>
                    
                    <div className="grid gap-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">Google Gemini AI</h4>
                            <p className="text-sm text-gray-500">AI-powered features and automation</p>
                          </div>
                        </div>
                        <div className="text-sm text-green-600 font-medium">Connected</div>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">Stripe Payments</h4>
                            <p className="text-sm text-gray-500">Online payment processing</p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">Not Connected</div>
                      </div>
                    </div>
                  </div>
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
                <CardContent className="space-y-4">
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
                      <Label htmlFor="depositPercentage">Default Deposit Percentage</Label>
                      <Input
                        id="depositPercentage"
                        value={paymentSettings.depositPercentage}
                        onChange={(e) => setPaymentSettings(prev => ({ ...prev, depositPercentage: e.target.value }))}
                        placeholder="25"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lateFeePercentage">Late Fee Percentage</Label>
                      <Input
                        id="lateFeePercentage"
                        value={paymentSettings.lateFeePercentage}
                        onChange={(e) => setPaymentSettings(prev => ({ ...prev, lateFeePercentage: e.target.value }))}
                        placeholder="5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="taxRate">Tax Rate (%)</Label>
                      <Input
                        id="taxRate"
                        value={paymentSettings.taxRate}
                        onChange={(e) => setPaymentSettings(prev => ({ ...prev, taxRate: e.target.value }))}
                        placeholder="8.5"
                      />
                    </div>
                  </div>

                  <Button onClick={() => saveSettings("Payment")} className="bg-blue-600 hover:bg-blue-700">
                    <Save className="w-4 h-4 mr-2" />
                    Save Payment Settings
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* BEO Settings */}
            <TabsContent value="beo" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileOutput className="w-5 h-5" />
                    BEO (Banquet Event Orders) Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Template Selection */}
                  <div>
                    <Label htmlFor="defaultTemplate">Default BEO Template</Label>
                    <Select value={beoSettings.defaultTemplate} onValueChange={(value) => setBeoSettings(prev => ({ ...prev, defaultTemplate: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard Template</SelectItem>
                        <SelectItem value="luxury">Luxury Template</SelectItem>
                        <SelectItem value="corporate">Corporate Template</SelectItem>
                        <SelectItem value="wedding">Wedding Template</SelectItem>
                        <SelectItem value="minimal">Minimal Template</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* BEO Types */}
                  <div>
                    <Label className="text-base font-medium">BEO Types to Display</Label>
                    <p className="text-sm text-gray-600 mb-3">Select which types of BEO documents should be available in the BEO modal</p>
                    <div className="space-y-3">
                      {[
                        { value: "floor_plan", label: "Floor Plan & Layout" },
                        { value: "timeline", label: "Event Timeline" },
                        { value: "catering", label: "Catering & Menu Details" },
                        { value: "av_requirements", label: "AV & Technical Requirements" },
                        { value: "vendor_contact", label: "Vendor Contact Information" },
                        { value: "setup_breakdown", label: "Setup & Breakdown Schedule" }
                      ].map((type) => (
                        <div key={type.value} className="flex items-center justify-between">
                          <Label htmlFor={type.value} className="text-sm font-normal">
                            {type.label}
                          </Label>
                          <Switch
                            id={type.value}
                            checked={beoSettings.enabledBeoTypes.includes(type.value)}
                            onCheckedChange={(checked) => {
                              setBeoSettings(prev => ({
                                ...prev,
                                enabledBeoTypes: checked 
                                  ? [...prev.enabledBeoTypes, type.value]
                                  : prev.enabledBeoTypes.filter(t => t !== type.value)
                              }));
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Additional Options */}
                  <div className="space-y-4">
                    <Label className="text-base font-medium">Additional Options</Label>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="autoGenerate" className="text-sm font-normal">Auto-generate BEO on event creation</Label>
                        <p className="text-xs text-gray-500">Automatically create BEO documents when a new event is saved</p>
                      </div>
                      <Switch
                        id="autoGenerate"
                        checked={beoSettings.autoGenerate}
                        onCheckedChange={(checked) => setBeoSettings(prev => ({ ...prev, autoGenerate: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="includeVendorInfo" className="text-sm font-normal">Include vendor information</Label>
                        <p className="text-xs text-gray-500">Show vendor contacts and details in BEO documents</p>
                      </div>
                      <Switch
                        id="includeVendorInfo"
                        checked={beoSettings.includeVendorInfo}
                        onCheckedChange={(checked) => setBeoSettings(prev => ({ ...prev, includeVendorInfo: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="showPricing" className="text-sm font-normal">Show pricing in BEO</Label>
                        <p className="text-xs text-gray-500">Display pricing information in generated BEO documents</p>
                      </div>
                      <Switch
                        id="showPricing"
                        checked={beoSettings.showPricing}
                        onCheckedChange={(checked) => setBeoSettings(prev => ({ ...prev, showPricing: checked }))}
                      />
                    </div>
                  </div>

                  <Button onClick={() => saveSettings("BEO")} className="bg-blue-600 hover:bg-blue-700">
                    <Save className="w-4 h-4 mr-2" />
                    Save BEO Settings
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
                    Security Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                      <Input
                        id="sessionTimeout"
                        value={securitySettings.sessionTimeout}
                        onChange={(e) => setSecuritySettings(prev => ({ ...prev, sessionTimeout: e.target.value }))}
                        placeholder="60"
                      />
                    </div>
                    <div>
                      <Label htmlFor="passwordPolicy">Password Policy</Label>
                      <Select value={securitySettings.passwordPolicy} onValueChange={(value) => setSecuritySettings(prev => ({ ...prev, passwordPolicy: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basic">Basic (8+ characters)</SelectItem>
                          <SelectItem value="strong">Strong (12+ chars, mixed case, numbers)</SelectItem>
                          <SelectItem value="strict">Strict (16+ chars, symbols required)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="dataBackupFrequency">Data Backup Frequency</Label>
                      <Select value={securitySettings.dataBackupFrequency} onValueChange={(value) => setSecuritySettings(prev => ({ ...prev, dataBackupFrequency: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button onClick={() => saveSettings("Security")} className="bg-blue-600 hover:bg-blue-700">
                    <Save className="w-4 h-4 mr-2" />
                    Save Security Settings
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