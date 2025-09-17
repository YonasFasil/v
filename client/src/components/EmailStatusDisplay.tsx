import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/api";
import { Mail, CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react";

interface EmailStatus {
  configured: boolean;
  provider: string;
  email: string;
  error?: string;
  description: string;
  managedBy: string;
}

export function EmailStatusDisplay() {
  const { data: emailStatus, isLoading, error } = useQuery<EmailStatus>({
    queryKey: ["/api/email/status"],
    queryFn: () => apiRequest("/api/email/status"),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Service Status
            <RefreshCw className="w-4 h-4 animate-spin" />
          </CardTitle>
          <CardDescription>Checking email service configuration...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Service Status
            <Badge variant="destructive">Error</Badge>
          </CardTitle>
          <CardDescription>Unable to check email service status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <XCircle className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-sm font-medium text-red-800">Unable to check email status</p>
              <p className="text-xs text-red-600">Please contact your administrator</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!emailStatus) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Email Service Status
          <Badge variant={emailStatus.configured ? "default" : "secondary"}>
            {emailStatus.configured ? "Active" : "Not Available"}
          </Badge>
        </CardTitle>
        <CardDescription>
          Managed by {emailStatus.managedBy} • Used for customer communications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {emailStatus.configured ? (
          <div className="space-y-4">
            {/* Success Status */}
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800">Email service is configured and ready</p>
                <p className="text-xs text-green-600">{emailStatus.description}</p>
              </div>
            </div>

            {/* Configuration Details */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Provider</p>
                <p className="text-sm font-medium text-gray-900">{emailStatus.provider}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email Address</p>
                <p className="text-sm font-medium text-gray-900">{emailStatus.email}</p>
              </div>
            </div>

            {/* What this means */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900">Automatic Email Services</h4>
              <div className="space-y-1 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span>Customer welcome emails during signup</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span>Proposal emails and updates</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span>Booking confirmations and notifications</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span>System notifications and alerts</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Error/Not Configured Status */}
            <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800">Email service not configured</p>
                <p className="text-xs text-amber-600">{emailStatus.description}</p>
                {emailStatus.error && (
                  <p className="text-xs text-red-600 mt-1">Error: {emailStatus.error}</p>
                )}
              </div>
            </div>

            {/* What this means */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900">Impact on Email Services</h4>
              <div className="space-y-1 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <XCircle className="w-3 h-3 text-red-500" />
                  <span>Customer emails will not be sent automatically</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="w-3 h-3 text-red-500" />
                  <span>Proposal emails will fail to send</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="w-3 h-3 text-red-500" />
                  <span>Booking confirmations will not be delivered</span>
                </div>
              </div>

              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-xs text-blue-800">
                  <strong>Contact your administrator</strong> to configure the email service for your organization.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}