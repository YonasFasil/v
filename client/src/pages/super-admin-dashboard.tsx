import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Building, 
  CreditCard, 
  TrendingUp, 
  Settings,
  Plus,
  Search,
  MoreVertical,
  CheckCircle,
  AlertCircle,
  Trash2,
  XCircle,
  LogOut
} from "lucide-react";
import { type Tenant, type SubscriptionPackage } from "@shared/schema";
import { PackageManagementModal } from "@/components/super-admin/package-management-modal";
import { TenantManagementModal } from "@/components/super-admin/tenant-management-modal";
import { TenantDetailModal } from "@/components/super-admin/tenant-detail-modal";
import SuperAdminSettings from "@/components/super-admin/super-admin-settings";

export default function SuperAdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<SubscriptionPackage | undefined>();
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [showTenantDetail, setShowTenantDetail] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('super_admin_token');
    setLocation('/super-admin/login');
  };

  // Fetch data
  const { data: tenants = [] } = useQuery<Tenant[]>({
    queryKey: ["/api/super-admin/tenants"],
  });

  const { data: packages = [] } = useQuery<SubscriptionPackage[]>({
    queryKey: ["/api/super-admin/packages"],
  });

  const { data: analytics } = useQuery({
    queryKey: ["/api/super-admin/analytics"],
    select: (data) => data || {
      totalTenants: tenants.length,
      activeTenants: tenants.filter(t => t.status === 'active').length,
      monthlyRevenue: 12450,
      growthRate: 15.2
    }
  });

  // Delete package mutation
  const deletePackageMutation = useMutation({
    mutationFn: (packageId: string) => 
      apiRequest(`/api/super-admin/packages/${packageId}`, {
        method: "DELETE"
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/packages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/tenants"] });
      toast({ title: "Package deleted successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to delete package", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleDeletePackage = (pkg: SubscriptionPackage) => {
    if (window.confirm(`Are you sure you want to delete the "${pkg.name}" package? This action cannot be undone.`)) {
      deletePackageMutation.mutate(pkg.id);
    }
  };

  // Delete tenant mutation
  const deleteTenantMutation = useMutation({
    mutationFn: (tenantId: string) => 
      apiRequest(`/api/super-admin/tenants/${tenantId}`, {
        method: "DELETE"
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/tenants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/analytics"] });
      toast({ title: "Tenant deleted successfully" });
      setShowTenantDetail(false);
      setSelectedTenant(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to delete tenant", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleDeleteTenant = (tenant: Tenant) => {
    if (window.confirm(`Are you sure you want to delete tenant "${tenant.name}"? This will permanently delete all their data including users, venues, bookings, and cannot be undone.`)) {
      deleteTenantMutation.mutate(tenant.id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'suspended': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'suspended': return <AlertCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const filteredTenants = tenants.filter(tenant =>
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your SaaS platform</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowTenantModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Tenant
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalTenants || 0}</div>
            <p className="text-xs text-muted-foreground">All organizations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.activeTenants || 0}</div>
            <p className="text-xs text-muted-foreground">Paying customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics?.monthlyRevenue?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">Recurring revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.growthRate || 0}%</div>
            <p className="text-xs text-muted-foreground">Month over month</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="tenants" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tenants">Tenants</TabsTrigger>
          <TabsTrigger value="packages">Packages</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="tenants" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Tenant Management</CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      placeholder="Search tenants..."
                      className="pl-8 pr-4 py-2 border rounded-md"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button onClick={() => setShowTenantModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Tenant
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredTenants.map((tenant) => (
                  <div key={tenant.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Building className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">{tenant.name}</div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div>ID: {tenant.id}</div>
                          <div>Slug: {tenant.slug || 'N/A'}</div>
                          <div>Created: {tenant.createdAt || tenant.created_at ? new Date(tenant.createdAt || tenant.created_at).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : `N/A (Debug: ${JSON.stringify(Object.keys(tenant))})`}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge className={getStatusColor(tenant.status)}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(tenant.status)}
                          <span className="capitalize">{tenant.status}</span>
                        </div>
                      </Badge>
                      <div className="text-sm text-muted-foreground">
                        {tenant.currentUsers || 0} users
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedTenant(tenant);
                            setShowTenantDetail(true);
                          }}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteTenant(tenant)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="packages" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Subscription Packages</CardTitle>
                <Button onClick={() => setShowPackageModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Package
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {packages.map((pkg) => (
                  <Card key={pkg.id} className="relative">
                    <CardHeader>
                      <CardTitle className="text-lg">{pkg.name}</CardTitle>
                      <div className="text-2xl font-bold">
                        ${pkg.price}
                        <span className="text-sm font-normal text-muted-foreground">
                          /{pkg.billingInterval}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div>• {pkg.maxVenues} venues</div>
                        <div>• {pkg.maxUsers} users</div>
                        <div>• Unlimited bookings</div>
                      </div>
                      <div className="mt-4 flex justify-between items-center">
                        <Badge variant={pkg.isActive ? "default" : "secondary"}>
                          {pkg.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setEditingPackage(pkg);
                              setShowPackageModal(true);
                            }}
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeletePackage(pkg)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Platform Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Analytics dashboard coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <SuperAdminSettings />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <PackageManagementModal
        open={showPackageModal}
        onOpenChange={(open) => {
          setShowPackageModal(open);
          if (!open) setEditingPackage(undefined);
        }}
        package={editingPackage}
      />
      
      <TenantManagementModal
        open={showTenantModal}
        onOpenChange={setShowTenantModal}
      />

      <TenantDetailModal
        tenant={selectedTenant}
        open={showTenantDetail}
        onOpenChange={(open) => {
          setShowTenantDetail(open);
          if (!open) setSelectedTenant(null);
        }}
      />
    </div>
  );
}