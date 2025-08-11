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
// Using PostgreSQL-based authentication
import { FeaturePackageForm } from './FeaturePackageForm';
import UsersManagement from './UsersManagement';
import { AdminAuthGuard } from "@/components/AdminAuthGuard";

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
  features: any;
  limits: any;
  priceMonthly: number;
  price_monthly: number;
  status: string;
  isActive: boolean;
}

interface Analytics {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  recentActivity: any[];
}

function SuperAdminDashboardContent({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isCreateTenantOpen, setIsCreateTenantOpen] = useState(false);
  const [isCreatePackageOpen, setIsCreatePackageOpen] = useState(false);
  const [isEditPackageOpen, setIsEditPackageOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);
  const [, setLocation] = useLocation();
  
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens  
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      .trim();
  };
  const queryClient = useQueryClient();

  // PostgreSQL logout
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of the superadmin console.",
      });
      setLocation("/auth/login");
    } catch (error: any) {
      toast({
        title: "Logout failed", 
        description: error.message || "Failed to logout",
        variant: "destructive",
      });
    }
  };

  // Analytics query
  const { data: analytics, isLoading: analyticsLoading } = useQuery<Analytics>({
    queryKey: ['/api/admin/analytics'],
  });

  // Tenants query with search and filter
  const { data: tenants = [], isLoading: tenantsLoading } = useQuery<Tenant[]>({
    queryKey: ['/api/admin/tenants', searchTerm, statusFilter],
  });

  // Users query
  const { data: users = [], isLoading: usersLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/users'],
  });

  // Feature packages query
  const { data: featurePackages = [], isLoading: packagesLoading } = useQuery<FeaturePackage[]>({
    queryKey: ['/api/admin/packages'],
  });

  // Create tenant mutation
  const createTenantMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/admin/tenants', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tenants'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/analytics'] });
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
      return await apiRequest('POST', '/api/admin/packages', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/packages'] });
      setIsCreatePackageOpen(false);
      toast({ title: "Success", description: "Feature package created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create feature package", variant: "destructive" });
    },
  });

  // Update feature package mutation
  const updatePackageMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest('PUT', `/api/admin/packages/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/packages'] });
      setIsEditPackageOpen(false);
      setEditingPackage(null);
      toast({ title: "Success", description: "Feature package updated successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update feature package", 
        variant: "destructive" 
      });
    },
  });

  // Delete feature package mutation
  const deletePackageMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/admin/packages/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/packages'] });
      toast({ title: "Success", description: "Feature package deleted successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to delete feature package", 
        variant: "destructive" 
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest('DELETE', `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/analytics'] });
      toast({ title: "Success", description: "User deleted successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to delete user", 
        variant: "destructive" 
      });
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

  const handleEditPackage = (pkg: any) => {
    setEditingPackage(pkg);
    setIsEditPackageOpen(true);
  };

  const handleUpdatePackage = (data: any) => {
    if (editingPackage) {
      updatePackageMutation.mutate({
        id: editingPackage.id,
        data
      });
    }
  };

  const handleDeletePackage = (pkg: any) => {
    if (confirm(`Are you sure you want to delete the feature package "${pkg.name}"? This action cannot be undone.`)) {
      deletePackageMutation.mutate(pkg.id);
    }
  };



  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      suspended: 'destructive',
      pending: 'secondary',
    };
    return <Badge variant={variants[status as keyof typeof variants] as any}>{status}</Badge>;
  };

  // Loading state for dashboard data
  if (tenantsLoading || analyticsLoading || packagesLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950">
      <div className="container mx-auto p-6 space-y-8">
        {/* Stunning Header Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative flex justify-between items-center">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-3 inline-block">
                🚀 Super Admin Console
              </h1>
              <p className="text-white/90 text-lg font-medium">
                Platform command center • Manage everything from one place
              </p>
            </div>
            <Button 
              variant="secondary"
              onClick={handleLogout}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border-white/30 text-white hover:text-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
          
          {/* Floating decorative elements */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-purple-400/20 rounded-full blur-3xl"></div>
        </div>

        {/* Enhanced Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="flex justify-center">
            <TabsList className="bg-white/60 backdrop-blur-lg shadow-xl border-0 p-2 rounded-2xl">
              <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-xl px-6 py-3 font-medium transition-all duration-300">
                <Activity className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="users" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white rounded-xl px-6 py-3 font-medium transition-all duration-300">
                <Users className="w-4 h-4 mr-2" />
                Users
              </TabsTrigger>
              <TabsTrigger value="tenants" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white rounded-xl px-6 py-3 font-medium transition-all duration-300">
                <Building2 className="w-4 h-4 mr-2" />
                Tenants
              </TabsTrigger>
              <TabsTrigger value="packages" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white rounded-xl px-6 py-3 font-medium transition-all duration-300">
                <TrendingUp className="w-4 h-4 mr-2" />
                Packages
              </TabsTrigger>
              <TabsTrigger value="activity" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-rose-600 data-[state=active]:text-white rounded-xl px-6 py-3 font-medium transition-all duration-300">
                <Activity className="w-4 h-4 mr-2" />
                Activity
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-8">
            {analyticsLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="bg-white/60 backdrop-blur-lg shadow-xl border-0 rounded-2xl overflow-hidden">
                    <CardContent className="p-8">
                      <div className="animate-pulse">
                        <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full mb-4"></div>
                        <div className="h-8 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="group bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-2xl border-0 rounded-2xl overflow-hidden hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-2">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10"></div>
                  <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle className="text-sm font-semibold text-white/90">Total Tenants</CardTitle>
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="text-4xl font-bold text-white mb-2">{analytics?.totalTenants || 0}</div>
                    <p className="text-white/80 text-sm">Active organizations</p>
                  </CardContent>
                </Card>
                
                <Card className="group bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-2xl border-0 rounded-2xl overflow-hidden hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-2">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10"></div>
                  <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle className="text-sm font-semibold text-white/90">Active Tenants</CardTitle>
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="text-4xl font-bold text-white mb-2">{analytics?.activeTenants || 0}</div>
                    <p className="text-white/80 text-sm">Currently paying</p>
                  </CardContent>
                </Card>
                
                <Card className="group bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-2xl border-0 rounded-2xl overflow-hidden hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-2">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10"></div>
                  <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle className="text-sm font-semibold text-white/90">Total Users</CardTitle>
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="text-4xl font-bold text-white mb-2">{analytics?.totalUsers || 0}</div>
                    <p className="text-white/80 text-sm">Platform members</p>
                  </CardContent>
                </Card>
                
                <Card className="group bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-2xl border-0 rounded-2xl overflow-hidden hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-2">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10"></div>
                  <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle className="text-sm font-semibold text-white/90">Recent Activity</CardTitle>
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                      <Activity className="h-6 w-6 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="text-4xl font-bold text-white mb-2">{analytics?.recentActivity?.length || 0}</div>
                    <p className="text-white/80 text-sm">System events</p>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* Quick Actions Section */}
            <div className="bg-white/60 backdrop-blur-lg rounded-2xl shadow-xl border-0 p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Quick Actions
                  </h3>
                  <p className="text-gray-600 mt-1">Common administrative tasks</p>
                </div>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Button 
                  onClick={() => setIsCreateTenantOpen(true)}
                  className="h-20 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 rounded-xl"
                >
                  <div className="flex flex-col items-center space-y-2">
                    <Plus className="h-6 w-6" />
                    <span className="font-semibold">Create Tenant</span>
                  </div>
                </Button>
                
                <Button 
                  onClick={() => setIsCreatePackageOpen(true)}
                  className="h-20 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 rounded-xl"
                >
                  <div className="flex flex-col items-center space-y-2">
                    <Plus className="h-6 w-6" />
                    <span className="font-semibold">New Package</span>
                  </div>
                </Button>
                
                <Button 
                  onClick={() => setActiveTab("users")}
                  className="h-20 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 rounded-xl"
                >
                  <div className="flex flex-col items-center space-y-2">
                    <Search className="h-6 w-6" />
                    <span className="font-semibold">Manage Users</span>
                  </div>
                </Button>
              </div>
            </div>
          </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Users Management</h2>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Tenants</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(5)].map((_, j) => (
                        <TableCell key={j}>
                          <div className="animate-pulse bg-gray-300 h-4 rounded"></div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : users && users.length > 0 ? (
                  users.map((user: any) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.firstName} {user.lastName}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.isSuperAdmin ? (
                          <Badge variant="destructive">Super Admin</Badge>
                        ) : (
                          <Badge variant="outline">User</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.tenantCount || 0} tenants
                      </TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {!user.isSuperAdmin && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => deleteUserMutation.mutate(user.id)}
                            disabled={deleteUserMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
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
                ) : tenants && tenants.length > 0 ? (
                  tenants.map((tenant: Tenant) => (
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
                        {tenant.planId ? (
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

          {/* Edit Feature Package Dialog */}
          <Dialog open={isEditPackageOpen} onOpenChange={setIsEditPackageOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Feature Package</DialogTitle>
                <DialogDescription>
                  Update the feature package settings, pricing, and capabilities.
                </DialogDescription>
              </DialogHeader>
              <FeaturePackageForm 
                initialData={editingPackage}
                onSubmit={handleUpdatePackage}
                isPending={updatePackageMutation.isPending}
                onCancel={() => {
                  setIsEditPackageOpen(false);
                  setEditingPackage(null);
                }}
              />
            </DialogContent>
          </Dialog>

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
                      <Badge variant={pkg.status === 'active' ? "default" : "secondary"}>
                        {pkg.status === 'active' ? "Active" : "Inactive"}
                      </Badge>
                    </CardTitle>
                    <CardDescription>{pkg.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="text-2xl font-bold">${pkg.price_monthly}/month</div>
                        <div className="text-sm text-muted-foreground">
                          {pkg.limits?.staff && `Max ${pkg.limits.staff} staff`}
                          {pkg.limits?.venues && ` • ${pkg.limits.venues} venues`}
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">Features:</div>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {Object.entries(pkg.features || {}).filter(([key, value]) => value).map(([feature, value], index) => (
                              <li key={index} className="flex items-center">
                                <span className="w-1 h-1 bg-current rounded-full mr-2"></span>
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditPackage(pkg)}
                          className="flex-1"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePackage(pkg)}
                          className="text-red-600 hover:text-red-700 hover:border-red-300"
                          disabled={deletePackageMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
    </div>
  );
}

// Main component with authentication
export default function SuperAdminDashboard() {
  const [, setLocation] = useLocation();
  
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  useEffect(() => {
    if (!isLoading && (!user || !user.isSuperAdmin)) {
      console.log('User not authorized for super admin, redirecting to login');
      setLocation('/login');
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user || !user.isSuperAdmin) {
    return null;
  }

  return <SuperAdminDashboardContent user={user} />;
}