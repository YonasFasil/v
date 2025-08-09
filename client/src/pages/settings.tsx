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
  Globe
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
    provider: "gmail",
    fromName: "Venuine Events",
    fromEmail: "noreply@venuine.com",
    replyToEmail: "contact@venuine.com",
    emailTemplate: "professional",
    includeSignature: true,
    signatureText: "Best regards,\nThe Venuine Events Team"
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
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 gap-2">
              <TabsTrigger value="business" className="flex items-center gap-2 px-4 py-3">
                <Building className="w-4 h-4" />
                <span>Business</span>
              </TabsTrigger>
              <TabsTrigger value="email" className="flex items-center gap-2 px-4 py-3">
                <Mail className="w-4 h-4" />
                <span>Email</span>
              </TabsTrigger>
              <TabsTrigger value="payments" className="flex items-center gap-2 px-4 py-3">
                <CreditCard className="w-4 h-4" />
                <span>Payments</span>
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
                  {/* Current Status */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-amber-900">Demo Mode Active</h4>
                        <p className="text-sm text-amber-700 mt-1">
                          Emails are currently in demo mode. Configure Gmail credentials in Replit Secrets to enable real email sending.
                        </p>
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
                              To use Gmail for sending emails, you'll need to create an App Password.
                            </p>
                            <div className="mt-3 text-sm text-blue-700 space-y-1">
                              <p><strong>Step 1:</strong> Go to Google Account → Security → 2-Step Verification</p>
                              <p><strong>Step 2:</strong> Generate an "App Password" for Mail</p>
                              <p><strong>Step 3:</strong> Add to Replit Secrets:</p>
                              <ul className="ml-4 mt-2 space-y-1">
                                <li>• <code className="bg-blue-100 px-2 py-1 rounded">EMAIL_USER</code> = your Gmail address</li>
                                <li>• <code className="bg-blue-100 px-2 py-1 rounded">EMAIL_PASS</code> = your App Password (16 characters)</li>
                              </ul>
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
                  )}

                  <Button onClick={() => saveSettings("Email")} className="bg-blue-600 hover:bg-blue-700">
                    <Save className="w-4 h-4 mr-2" />
                    Save Email Settings
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