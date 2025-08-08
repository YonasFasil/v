import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Phone, 
  PhoneCall, 
  Mic, 
  CheckCircle, 
  AlertCircle,
  Copy,
  ExternalLink,
  Settings,
  RefreshCw
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function PhoneIntegrationPage() {
  const { toast } = useToast();
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  const { data: phoneConfig, isLoading, refetch } = useQuery({
    queryKey: ["/api/phone/config"],
    refetchInterval: 5000 // Refresh every 5 seconds to check configuration
  }) as { data: any, isLoading: boolean, refetch: () => void };

  const { data: callRecords = [] } = useQuery({
    queryKey: ["/api/phone/call-records"],
    enabled: phoneConfig?.configured
  }) as { data: any[] };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      if (label === 'webhook') setCopiedWebhook(true);
      setTimeout(() => setCopiedWebhook(false), 2000);
      toast({ title: `${label} copied to clipboard!` });
    } catch (error) {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-green-100 rounded-full">
            <Phone className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold">Phone Integration</h1>
        </div>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Set up a dedicated phone number for customer booking requests with AI-powered call capture and automatic booking draft creation.
        </p>
      </div>

      {/* Configuration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuration Status
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              className="ml-auto"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {phoneConfig?.configured ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-700">Phone system configured and ready!</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Your Booking Phone Number</label>
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <PhoneCall className="h-4 w-4 text-green-600" />
                    <span className="font-mono text-lg text-green-800">{phoneConfig.phoneNumber}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(phoneConfig.phoneNumber, 'Phone number')}
                      className="ml-auto"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Webhook URL</label>
                  <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <ExternalLink className="h-4 w-4 text-blue-600" />
                    <span className="font-mono text-sm text-blue-800 truncate">{phoneConfig.webhookUrl}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(phoneConfig.webhookUrl, 'webhook')}
                      className="ml-auto"
                    >
                      <Copy className="h-4 w-4" />
                      {copiedWebhook && <span className="ml-1 text-xs">✓</span>}
                    </Button>
                  </div>
                </div>
              </div>

              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Ready to receive calls!</strong> Customers can now call {phoneConfig.phoneNumber} and their booking requests will be automatically processed by AI.
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <span className="font-medium text-amber-700">Phone system not configured</span>
              </div>
              
              <Alert className="border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  Please provide your Twilio credentials to enable phone integration. The system will automatically configure call handling and AI processing.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-purple-600" />
            How Phone Integration Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="font-semibold">Customer Calls</h3>
              <p className="text-sm text-gray-600">Customer dials your venue's phone number to inquire about booking</p>
            </div>
            
            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-green-600">2</span>
              </div>
              <h3 className="font-semibold">Call Recording</h3>
              <p className="text-sm text-gray-600">System automatically records the conversation and provides greeting</p>
            </div>
            
            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="font-semibold">AI Processing</h3>
              <p className="text-sm text-gray-600">Google Gemini AI analyzes the conversation and extracts booking details</p>
            </div>
            
            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-orange-600">4</span>
              </div>
              <h3 className="font-semibold">Draft Created</h3>
              <p className="text-sm text-gray-600">Booking draft is created for staff review and follow-up</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call Records */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PhoneCall className="h-5 w-5 text-blue-600" />
            Recent Call Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          {phoneConfig?.configured ? (
            callRecords.length > 0 ? (
              <div className="space-y-4">
                {callRecords.map((record: any, index: number) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <PhoneCall className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">{record.fromNumber}</span>
                      </div>
                      <Badge variant={record.status === 'processed' ? 'default' : 'secondary'}>
                        {record.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">Duration: {record.duration}s</p>
                    {record.extractedData && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                        <strong>Extracted:</strong> {JSON.stringify(record.extractedData, null, 2)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <PhoneCall className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No call records yet. Waiting for incoming calls...</p>
              </div>
            )
          ) : (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Configure Twilio credentials to start receiving calls</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      {!phoneConfig?.configured && (
        <Card>
          <CardHeader>
            <CardTitle>Twilio Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold">1. Create Twilio Account</h4>
                <p className="text-sm text-gray-600">Sign up for a free Twilio account at <a href="https://twilio.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">twilio.com</a></p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold">2. Get Your Credentials</h4>
                <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                  <li><strong>TWILIO_ACCOUNT_SID:</strong> Found on your Console dashboard</li>
                  <li><strong>TWILIO_AUTH_TOKEN:</strong> Also on your Console dashboard (click eye icon)</li>
                  <li><strong>TWILIO_PHONE_NUMBER:</strong> Purchase a phone number from Phone Numbers → Buy a number</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold">3. Configure Webhook</h4>
                <p className="text-sm text-gray-600">
                  Once credentials are provided, configure your Twilio phone number's webhook URL to point to this application.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}