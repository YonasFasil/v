import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Bell, Mail, AlertTriangle, CreditCard, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface NotificationStats {
  notificationSettings: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    bookingConfirmations: boolean;
    paymentReminders: boolean;
    maintenanceAlerts: boolean;
  };
  stats: {
    totalBookings: number;
    confirmedBookings: number;
    overduePayments: number;
    gmailConfigured: boolean;
  };
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
}

export function NotificationTestPanel() {
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [testType, setTestType] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch notification stats
  const { data: notificationStats, isLoading: statsLoading } = useQuery<NotificationStats>({
    queryKey: ["/api/notifications/stats"]
  });

  // Fetch customers for testing
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"]
  });

  // Test notification mutation
  const testNotificationMutation = useMutation({
    mutationFn: async ({ type, customerId }: { type: string; customerId: string }) => {
      return apiRequest("POST", "/api/notifications/test", { type, customerId });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Test Notification Sent!",
        description: data.message,
        variant: "default"
      });
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Failed to send test notification";
      toast({
        title: "Test Failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  // Send payment reminders mutation
  const sendPaymentRemindersMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/notifications/payment-reminders", {});
    },
    onSuccess: (data: any) => {
      toast({
        title: "Payment Reminders Sent",
        description: `${data.results?.length || 0} reminders processed`,
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send Reminders",
        description: error.message || "Error sending payment reminders",
        variant: "destructive"
      });
    }
  });

  const handleTestNotification = () => {
    if (!selectedCustomer || !testType) {
      toast({
        title: "Missing Information",
        description: "Please select both a customer and notification type",
        variant: "destructive"
      });
      return;
    }

    testNotificationMutation.mutate({ type: testType, customerId: selectedCustomer });
  };

  const handleSendPaymentReminders = () => {
    sendPaymentRemindersMutation.mutate();
  };

  if (statsLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
        </CardContent>
      </Card>
    );
  }

  const settings = notificationStats?.notificationSettings;
  const stats = notificationStats?.stats;

  return (
    <div className="space-y-6">
      {/* Notification Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification System Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span className="text-sm">Email Notifications</span>
              <Badge variant={settings?.emailNotifications ? "default" : "secondary"}>
                {settings?.emailNotifications ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Booking Confirmations</span>
              <Badge variant={settings?.bookingConfirmations ? "default" : "secondary"}>
                {settings?.bookingConfirmations ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              <span className="text-sm">Payment Reminders</span>
              <Badge variant={settings?.paymentReminders ? "default" : "secondary"}>
                {settings?.paymentReminders ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">Maintenance Alerts</span>
              <Badge variant={settings?.maintenanceAlerts ? "default" : "secondary"}>
                {settings?.maintenanceAlerts ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg">
            <h4 className="font-medium mb-2">System Statistics</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">{stats?.totalBookings || 0}</span>
                <p className="text-slate-600">Total Bookings</p>
              </div>
              <div>
                <span className="font-medium">{stats?.confirmedBookings || 0}</span>
                <p className="text-slate-600">Confirmed Bookings</p>
              </div>
              <div>
                <span className="font-medium text-orange-600">{stats?.overduePayments || 0}</span>
                <p className="text-slate-600">Overdue Payments</p>
              </div>
              <div>
                <span className="font-medium">
                  {stats?.gmailConfigured ? (
                    <Badge variant="default" className="text-xs">Gmail Ready</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">Not Configured</Badge>
                  )}
                </span>
                <p className="text-slate-600">Email Service</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Test Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Customer</label>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a customer..." />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} ({customer.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notification Type</label>
              <Select value={testType} onValueChange={setTestType}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose notification type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="booking">Booking Confirmation</SelectItem>
                  <SelectItem value="payment">Payment Reminder</SelectItem>
                  <SelectItem value="maintenance">Maintenance Alert</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={handleTestNotification}
            disabled={!selectedCustomer || !testType || testNotificationMutation.isPending}
            className="w-full"
          >
            {testNotificationMutation.isPending ? "Sending..." : "Send Test Notification"}
          </Button>

          {!settings?.emailNotifications && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <AlertTriangle className="w-4 h-4 inline mr-1" />
                Email notifications are disabled in settings. Enable them to test notifications.
              </p>
            </div>
          )}

          {!stats?.gmailConfigured && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <Mail className="w-4 h-4 inline mr-1" />
                Gmail is not configured. Set up Gmail credentials in Integrations settings to send emails.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Reminders */}
      {stats?.overduePayments! > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-orange-600" />
              Payment Reminders
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800 mb-3">
                You have <strong>{stats?.overduePayments}</strong> bookings with overdue payments.
              </p>
              <Button 
                onClick={handleSendPaymentReminders}
                disabled={sendPaymentRemindersMutation.isPending || !settings?.paymentReminders}
                variant="outline"
                size="sm"
              >
                {sendPaymentRemindersMutation.isPending ? "Sending..." : "Send Payment Reminders"}
              </Button>
            </div>
            
            {!settings?.paymentReminders && (
              <p className="text-xs text-slate-600">
                Payment reminders are disabled in notification settings.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}