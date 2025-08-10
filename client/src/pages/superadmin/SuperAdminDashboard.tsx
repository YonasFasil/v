import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Building2, 
  Users, 
  Activity, 
  TrendingUp, 
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  LogOut
} from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { FeaturePackageForm } from './FeaturePackageForm';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'suspended' | 'pending';
  featurePackageId: string | null;
  contactName: string;
  contactEmail: string;
  createdAt: string;
  updatedAt: string;
}

interface FeaturePackage {
  id: string;
  name: string;
  description: string;
  features: string[];
  maxUsers: number;
  priceMonthly: number;
  isActive: boolean;
}

interface Analytics {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  recentActivity: any[];
}

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isCreateTenantOpen, setIsCreateTenantOpen] = useState(false);
  const [isCreatePackageOpen, setIsCreatePackageOpen] = useState(false);
  
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens  
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      .trim();
  };
  const [, navigate] = useLocation();
  
  const queryClient = useQueryClient();

  // Check authentication status first
  const { data: authUser, isLoading: authLoading, error: authError } = useQuery({
    queryKey: ['/api/auth/me'],
    retry: false,
  });

  // Redirect to superadmin login if not authenticated
  useEffect(() => {
    if (!authLoading && (!authUser || authError)) {
      navigate('/sys-admin-login-x7k9p2w4');
      return;
    }
  }, [authUser, authLoading, authError, navigate]);

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/logout"),
    onSuccess: () => {
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of the superadmin console.",
      });
      // Redirect to login or home page
      window.location.href = "/";
    },
    onError: (error: any) => {
      toast({
        title: "Logout failed", 
        description: error.message || "Failed to logout",
        variant: "destructive",
      });
    }
  });

  // Analytics query - only run if authenticated
  const { data: analytics, isLoading: analyticsLoading } = useQuery<Analytics>({
    queryKey: ['/api/superadmin/analytics'],
    enabled: !!authUser,
  });

  // Tenants query with search and filter - only run if authenticated
  const { data: tenantsResponse, isLoading: tenantsLoading } = useQuery<{
    data: Tenant[];
    pagination: any;
  }>({
    queryKey: ['/api/superadmin/tenants', searchTerm, statusFilter],
    enabled: !!authUser,
  });

  // Feature packages query - only run if authenticated
  const { data: featurePackages = [], isLoading: packagesLoading } = useQuery<FeaturePackage[]>({
    queryKey: ['/api/superadmin/feature-packages'],
    enabled: !!authUser,
  });

  // Create tenant mutation
  const createTenantMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/superadmin/tenants', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/superadmin/tenants'] });
      queryClient.invalidateQueries({ queryKey: ['/api/superadmin/analytics'] });
      setIsCreateTenantOpen(false);
      toast({ title: "Success", description: "Tenant created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create tenant", variant: "destructive" });
    },
  });

  // Create feature package mutation
  const createPackageMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/superadmin/feature-packages', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/superadmin/feature-packages'] });
      setIsCreatePackageOpen(false);
      toast({ title: "Success", description: "Feature package created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create feature package", variant: "destructive" });
    },
  });

  const handleCreateTenant = (event: React.FormEvent) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget as HTMLFormElement);
    const featurePackageId = formData.get('featurePackageId');
    createTenantMutation.mutate({
      name: formData.get('name'),
      slug: formData.get('slug'),
      contactName: formData.get('contactName'),
      contactEmail: formData.get('contactEmail'),
      featurePackageId: featurePackageId === 'no-package' ? null : featurePackageId,
      status: 'active',
    });
  };

  const handleCreatePackage = (event: React.FormEvent) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget as HTMLFormElement);
    const features = (formData.get('features') as string).split('\n').filter(f => f.trim());
    createPackageMutation.mutate({
      name: formData.get('name'),
      description: formData.get('description'),
      features,
      maxUsers: parseInt(formData.get('maxUsers') as string),
      priceMonthly: parseFloat(formData.get('priceMonthly') as string),
      isActive: true,
    });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      suspended: 'destructive',
      pending: 'secondary',
    };
    return <Badge variant={variants[status as keyof typeof variants] as any}>{status}</Badge>;
  };

  // Show loading screen while checking authentication
  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  // Don't render dashboard if not authenticated (will redirect)
  if (!authUser) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage tenants, packages, and platform analytics</p>
        </div>
        <Button 
          variant="outline"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="h-4 w-4 mr-2" />
          {logoutMutation.isPending ? "Logging out..." : "Logout"}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tenants">Tenants</TabsTrigger>
          <TabsTrigger value="packages">Feature Packages</TabsTrigger>
          <TabsTrigger value="activity">Activity Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {analyticsLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-300 rounded mb-2"></div>
                      <div className="h-8 bg-gray-300 rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.totalTenants || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.activeTenants || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.totalUsers || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.recentActivity?.length || 0}</div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="tenants" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search tenants..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Dialog open={isCreateTenantOpen} onOpenChange={setIsCreateTenantOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Tenant
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Tenant</DialogTitle>
                  <DialogDescription>
                    Create a new tenant organization on the platform.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateTenant} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Organization Name</Label>
                    <Input 
                      name="name" 
                      required 
                      onChange={(e) => {
                        const slugField = e.target.form?.querySelector('input[name="slug"]') as HTMLInputElement;
                        if (slugField) {
                          slugField.value = generateSlug(e.target.value);
                        }
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="slug">URL Identifier</Label>
                    <Input 
                      name="slug" 
                      placeholder="Auto-generated from organization name" 
                      required 
                      readOnly
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Automatically created from the organization name. Creates: /t/[slug]/app
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="contactName">Contact Name</Label>
                    <Input name="contactName" required />
                  </div>
                  <div>
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input name="contactEmail" type="email" required />
                  </div>
                  <div>
                    <Label htmlFor="featurePackageId">Feature Package</Label>
                    <Select name="featurePackageId">
                      <SelectTrigger>
                        <SelectValue placeholder="Select package (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no-package">No package</SelectItem>
                        {featurePackages?.map(pkg => (
                          <SelectItem key={pkg.id} value={pkg.id}>
                            {pkg.name} - ${pkg.priceMonthly}/month
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsCreateTenantOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createTenantMutation.isPending}>
                      {createTenantMutation.isPending ? "Creating..." : "Create Tenant"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenantsLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(6)].map((_, j) => (
                        <TableCell key={j}>
                          <div className="animate-pulse bg-gray-300 h-4 rounded"></div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : tenantsResponse?.data && tenantsResponse.data.length > 0 ? (
                  tenantsResponse.data.map((tenant: Tenant) => (
                    <TableRow key={tenant.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{tenant.name}</div>
                          <div className="text-sm text-muted-foreground">{tenant.slug}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{tenant.contactName}</div>
                          <div className="text-sm text-muted-foreground">{tenant.contactEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(tenant.status)}</TableCell>
                      <TableCell>
                        {tenant.featurePackageId ? (
                          <Badge variant="outline">Package Assigned</Badge>
                        ) : (
                          <span className="text-muted-foreground">No package</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(tenant.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      No tenants found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="packages" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Feature Packages</h2>
            <Dialog open={isCreatePackageOpen} onOpenChange={setIsCreatePackageOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Package
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Feature Package</DialogTitle>
                  <DialogDescription>
                    Define a new feature package with specific VENUIN features, usage limits, and pricing.
                  </DialogDescription>
                </DialogHeader>
                <FeaturePackageForm 
                  onSubmit={(data: any) => createPackageMutation.mutate(data)}
                  isPending={createPackageMutation.isPending}
                  onCancel={() => setIsCreatePackageOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {packagesLoading ? (
              [...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-2">
                      <div className="h-6 bg-gray-300 rounded"></div>
                      <div className="h-4 bg-gray-300 rounded"></div>
                      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : featurePackages?.length > 0 ? (
              featurePackages.map((pkg) => (
                <Card key={pkg.id}>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      {pkg.name}
                      <Badge variant={pkg.isActive ? "default" : "secondary"}>
                        {pkg.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </CardTitle>
                    <CardDescription>{pkg.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold">${pkg.priceMonthly}/month</div>
                      <div className="text-sm text-muted-foreground">Max {pkg.maxUsers} users</div>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">Features:</div>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {(pkg.features || []).map((feature, index) => (
                            <li key={index} className="flex items-center">
                              <span className="w-1 h-1 bg-current rounded-full mr-2"></span>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-muted-foreground">No feature packages found</div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>System Activity Logs</CardTitle>
              <CardDescription>Recent platform-wide activity and changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground p-8">
                Activity logs will be displayed here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}