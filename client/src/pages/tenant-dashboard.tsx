import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Calendar, DollarSign, Settings, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TenantSession {
  tenantId: string;
  userId: string;
  userRole: string;
  tenantName: string;
  packageFeatures: any;
}

interface TenantUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Tenant {
  id: string;
  name: string;
  status: string;
  packageId: string;
}

export default function TenantDashboard() {
  const { toast } = useToast();
  const [session, setSession] = useState<TenantSession | null>(null);
  const [user, setUser] = useState<TenantUser | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);

  useEffect(() => {
    // Check if user is authenticated
    const sessionData = localStorage.getItem("tenantSession");
    const userData = localStorage.getItem("tenantUser");
    const tenantData = localStorage.getItem("tenant");

    if (!sessionData || !userData || !tenantData) {
      // Redirect to login if no session
      window.location.href = "/tenant/login";
      return;
    }

    try {
      setSession(JSON.parse(sessionData));
      setUser(JSON.parse(userData));
      setTenant(JSON.parse(tenantData));
    } catch (error) {
      console.error("Error parsing session data:", error);
      handleLogout();
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("tenantSession");
    localStorage.removeItem("tenantUser");
    localStorage.removeItem("tenant");
    
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });

    window.location.href = "/tenant/login";
  };

  if (!session || !user || !tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {tenant.name}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Venue Management Dashboard
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Badge variant={tenant.status === "active" ? "default" : "secondary"}>
                {tenant.status}
              </Badge>
              
              <div className="flex items-center space-x-2">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {user.role}
                  </p>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <LogOut size={16} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user.name}!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Here's what's happening with your venues today.
          </p>
        </div>

        {/* Feature Access Information */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Your current subscription and feature access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Building2 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">Tenant ID</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{tenant.id}</p>
              </div>
              
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">Role</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.role}</p>
              </div>
              
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <Calendar className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">Package</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{tenant.packageId}</p>
              </div>
              
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <DollarSign className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">Status</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{tenant.status}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Bookings
              </CardTitle>
              <CardDescription>
                Manage your venue bookings and events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => window.location.href = '/bookings'}>
                View Bookings
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Customers
              </CardTitle>
              <CardDescription>
                View and manage your customer database
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => window.location.href = '/customers'}>
                View Customers
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="h-5 w-5 mr-2" />
                Venues
              </CardTitle>
              <CardDescription>
                Configure your venues and spaces
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => window.location.href = '/venues'}>
                Manage Venues
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Feature Access Details */}
        {session.packageFeatures && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Available Features</CardTitle>
              <CardDescription>
                Features included in your current package
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Object.entries(session.packageFeatures).map(([feature, enabled]) => (
                  <div key={feature} className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                      {feature.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}