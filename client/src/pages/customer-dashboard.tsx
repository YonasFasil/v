import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Clock,
  Search,
  LogOut,
  Settings,
  Bell,
  MessageSquare,
  Star,
  Eye
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string;
}

interface BookingInquiry {
  id: string;
  venue_name: string;
  event_type: string;
  event_date: string;
  guest_count: number;
  status: 'pending' | 'responded' | 'confirmed' | 'cancelled';
  message: string;
  created_at: string;
  response_message?: string;
  venue_response_at?: string;
}

export default function CustomerDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [customer, setCustomer] = useState<Customer | null>(null);

  // Check authentication and load customer data
  useEffect(() => {
    const token = localStorage.getItem("customer_token");
    const customerData = localStorage.getItem("customer_data");

    if (!token || !customerData) {
      setLocation("/customer/login");
      return;
    }

    try {
      const parsedCustomer = JSON.parse(customerData);
      setCustomer(parsedCustomer);
    } catch (error) {
      console.error("Error parsing customer data:", error);
      setLocation("/customer/login");
    }
  }, [setLocation]);

  // Fetch booking inquiries
  const { data: inquiries = [], isLoading: inquiriesLoading } = useQuery({
    queryKey: ["/api/public/customer/inquiries"],
    queryFn: () => {
      const token = localStorage.getItem("customer_token");
      return apiRequest("/api/public/customer/inquiries", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
    },
    enabled: !!customer
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      localStorage.removeItem("customer_token");
      localStorage.removeItem("customer_data");
      return Promise.resolve();
    },
    onSuccess: () => {
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account."
      });
      setLocation("/");
    }
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pending", variant: "secondary" as const },
      responded: { label: "Responded", variant: "default" as const },
      confirmed: { label: "Confirmed", variant: "success" as const },
      cancelled: { label: "Cancelled", variant: "destructive" as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  if (!customer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-2xl font-bold text-blue-600">
                VenuinePro
              </Link>
              <span className="text-gray-300">|</span>
              <span className="text-gray-600">Customer Portal</span>
            </div>

            <div className="flex items-center space-x-4">
              <Link href="/explore/venues" className="text-gray-600 hover:text-gray-900">
                <Search className="w-5 h-5" />
              </Link>

              <div className="flex items-center space-x-2">
                <Avatar>
                  <AvatarFallback>
                    {customer.firstName[0]}{customer.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">
                    {customer.firstName} {customer.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{customer.email}</p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {customer.firstName}!
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your venue inquiries and discover new spaces for your events.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/explore/venues">
              <CardContent className="p-6 text-center">
                <Search className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900">Explore Venues</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Discover amazing venues for your next event
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <MessageSquare className="w-8 h-8 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900">
                {inquiries.length} Inquiries
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Track your venue inquiries and responses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Star className="w-8 h-8 text-yellow-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900">Account Status</h3>
              <p className="text-sm text-gray-600 mt-1">
                {customer.isVerified ? "Verified Account" : "Pending Verification"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="inquiries" className="space-y-6">
          <TabsList>
            <TabsTrigger value="inquiries">My Inquiries</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="inquiries">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Venue Inquiries
                </CardTitle>
                <CardDescription>
                  Track the status of your venue inquiries and communications
                </CardDescription>
              </CardHeader>
              <CardContent>
                {inquiriesLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : inquiries.length > 0 ? (
                  <div className="space-y-4">
                    {inquiries.map((inquiry: BookingInquiry) => (
                      <div key={inquiry.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900">{inquiry.venue_name}</h4>
                            <p className="text-sm text-gray-600">
                              {inquiry.event_type} • {new Date(inquiry.event_date).toLocaleDateString()} • {inquiry.guest_count} guests
                            </p>
                          </div>
                          {getStatusBadge(inquiry.status)}
                        </div>

                        <p className="text-gray-700 mb-3">{inquiry.message}</p>

                        {inquiry.response_message && (
                          <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-3">
                            <p className="text-sm font-medium text-blue-900">Venue Response:</p>
                            <p className="text-blue-800">{inquiry.response_message}</p>
                            <p className="text-xs text-blue-600 mt-1">
                              Responded on {new Date(inquiry.venue_response_at || '').toLocaleDateString()}
                            </p>
                          </div>
                        )}

                        <div className="flex justify-between items-center text-sm text-gray-500">
                          <span>Submitted {new Date(inquiry.created_at).toLocaleDateString()}</span>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{new Date(inquiry.created_at).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No inquiries yet</h3>
                    <p className="text-gray-600 mb-4">
                      Start exploring venues and send your first inquiry to get started!
                    </p>
                    <Link href="/explore/venues">
                      <Button>
                        <Search className="w-4 h-4 mr-2" />
                        Explore Venues
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Your account details and settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">First Name</label>
                      <p className="mt-1 text-gray-900">{customer.firstName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Last Name</label>
                      <p className="mt-1 text-gray-900">{customer.lastName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Email</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <p className="text-gray-900">{customer.email}</p>
                        {customer.isVerified ? (
                          <Badge variant="success">Verified</Badge>
                        ) : (
                          <Badge variant="secondary">Unverified</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Phone</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <p className="text-gray-900">{customer.phone}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Member Since</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <p className="text-gray-900">
                          {new Date(customer.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Last Login</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <p className="text-gray-900">
                          {customer.lastLoginAt
                            ? new Date(customer.lastLoginAt).toLocaleDateString()
                            : 'Never'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {!customer.isVerified && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Bell className="w-5 h-5 text-yellow-600" />
                      <h4 className="font-medium text-yellow-800">Email Verification Required</h4>
                    </div>
                    <p className="text-yellow-700 text-sm">
                      Please check your email and click the verification link to activate your account.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}