import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { apiRequest } from "@/lib/queryClient";
import { 
  Crown,
  Building2,
  Package,
  Users,
  Activity,
  Settings,
  Plus,
  Edit,
  Trash2,
  Eye,
  BarChart3,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  LogOut,
  Shield,
  Globe
} from "lucide-react";

export default function SuperAdmin() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { logout, userRoleData, isSuperAdmin, isLoading } = useUserRole();
  const [selectedTab, setSelectedTab] = useState("overview");

  // Queries - must be called before any early returns to follow React hooks rules
  const { data: stats } = useQuery({
    queryKey: ["/api/super-admin/stats"],
    staleTime: 60000,
    enabled: isSuperAdmin, // Only run query if user is super admin
  });

  const { data: tenants } = useQuery({
    queryKey: ["/api/super-admin/tenants"],
    staleTime: 30000,
    enabled: isSuperAdmin,
  });

  const { data: packages } = useQuery({
    queryKey: ["/api/super-admin/packages"],
    staleTime: 60000,
    enabled: isSuperAdmin,
  });

  const { data: activities } = useQuery({
    queryKey: ["/api/super-admin/activities"],
    staleTime: 30000,
    enabled: isSuperAdmin,
  });

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Ensure only Super Admin can access this page
  if (!isSuperAdmin) {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crown className="w-8 h-8 text-purple-600" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Super Admin</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">Platform Management Dashboard</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="default" className="bg-purple-600">
              <Crown className="w-3 h-3 mr-1" />
              {userRoleData?.name || "Super Admin"}
            </Badge>
            <Button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              variant="outline"
              size="sm"
            >
              <LogOut className="w-3 h-3 mr-1" />
              Switch Role
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tenants">Tenants</TabsTrigger>
            <TabsTrigger value="packages">Packages</TabsTrigger>
            <TabsTrigger value="activities">Activity</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(stats as any)?.totalTenants || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    +{(stats as any)?.newTenantsThisMonth || 0} this month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(stats as any)?.activeUsers || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Across all tenants
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${(stats as any)?.monthlyRevenue || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Subscription revenue
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Platform Health</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">99.9%</div>
                  <p className="text-xs text-muted-foreground">
                    Uptime this month
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Platform Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {((activities as any[]) || []).slice(0, 5).map((activity: any) => (
                    <div key={activity.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {activity.tenantName} • {new Date(activity.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )) || (
                    <p className="text-sm text-slate-600 dark:text-slate-400 text-center py-4">
                      No recent activity
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tenants Tab */}
          <TabsContent value="tenants" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Account Management</h2>
              <CreateTenantDialog />
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead>Package</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Venues</TableHead>
                      <TableHead>Users</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {((tenants as any[]) || []).map((tenant: any) => (
                      <TableRow key={tenant.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{tenant.name}</p>
                            <p className="text-sm text-slate-600">{tenant.contactEmail}</p>
                            <p className="text-xs text-slate-500 mt-1">
                              {tenant.venueCount} venues, {tenant.spaceCount} spaces
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{tenant.packageName}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={tenant.status === 'active' ? 'default' : 'secondary'}
                            className={tenant.status === 'active' ? 'bg-green-600' : ''}
                          >
                            {tenant.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {tenant.venues?.slice(0, 3).map((venue: any) => (
                              <div key={venue.id} className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                {venue.name} ({venue.spaces} spaces)
                              </div>
                            ))}
                            {tenant.venues?.length > 3 && (
                              <div className="text-xs text-slate-500">
                                +{tenant.venues.length - 3} more
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{tenant.userCount}</TableCell>
                        <TableCell>
                          <span className="font-medium text-green-600">
                            ${tenant.monthlyRevenue?.toLocaleString() || 0}
                          </span>
                        </TableCell>
                        <TableCell>
                          <TenantActions tenant={tenant} />
                        </TableCell>
                      </TableRow>
                    )) || (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-slate-600">
                          No tenant accounts found. Create the first account to get started.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Packages Tab */}
          <TabsContent value="packages" className="space-y-6">
            <PackageManagement packages={packages} />
          </TabsContent>

          {/* Activities Tab */}
          <TabsContent value="activities" className="space-y-6">
            <ActivityLog activities={activities} />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <SystemSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Tenant Actions Component
function TenantActions({ tenant }: { tenant: any }) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteTenantMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/super-admin/tenants/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/tenants"] });
      toast({
        title: "Success",
        description: "Account deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete account",
        variant: "destructive",
      });
    },
  });

  return (
    <>
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setShowViewDialog(true)}
        >
          <Eye className="w-4 h-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setShowEditDialog(true)}
        >
          <Edit className="w-4 h-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-red-600"
          onClick={() => {
            if (confirm(`Are you sure you want to delete the account "${tenant.name}"? This action cannot be undone.`)) {
              deleteTenantMutation.mutate(tenant.id);
            }
          }}
          disabled={deleteTenantMutation.isPending}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Edit Tenant Dialog */}
      <EditTenantDialog 
        isOpen={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        tenant={tenant}
      />

      {/* View Tenant Dialog */}
      <ViewTenantDialog 
        isOpen={showViewDialog}
        onClose={() => setShowViewDialog(false)}
        tenant={tenant}
      />
    </>
  );
}

// View Tenant Dialog Component
function ViewTenantDialog({ isOpen, onClose, tenant }: {
  isOpen: boolean;
  onClose: () => void;
  tenant: any;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Account Details - {tenant.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-slate-700">Business Name</Label>
              <div className="mt-1 text-sm">{tenant.name}</div>
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-700">Status</Label>
              <div className="mt-1">
                <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
                  {tenant.status}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-700">Admin Email</Label>
              <div className="mt-1 text-sm">{tenant.contactEmail}</div>
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-700">Package</Label>
              <div className="mt-1">
                <Badge variant="outline">{tenant.packageName}</Badge>
              </div>
            </div>
          </div>

          {/* Usage Statistics */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Usage Statistics</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded">
                <div className="text-2xl font-bold">{tenant.userCount}</div>
                <div className="text-sm text-slate-600">Users</div>
              </div>
              <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded">
                <div className="text-2xl font-bold">{tenant.venueCount}</div>
                <div className="text-sm text-slate-600">Venues</div>
              </div>
              <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded">
                <div className="text-2xl font-bold">{tenant.spaceCount}</div>
                <div className="text-sm text-slate-600">Spaces</div>
              </div>
            </div>
          </div>

          {/* Venues List */}
          {tenant.venues && tenant.venues.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Venues</h4>
              <div className="space-y-2">
                {tenant.venues.map((venue: any) => (
                  <div key={venue.id} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-800 rounded">
                    <span className="font-medium">{venue.name}</span>
                    <span className="text-sm text-slate-600">{venue.spaces} spaces</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Revenue Information */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Financial Information</h4>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded">
              <div className="text-3xl font-bold text-green-600">
                ${tenant.monthlyRevenue?.toLocaleString() || 0}
              </div>
              <div className="text-sm text-slate-600">Monthly Revenue</div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Edit Tenant Dialog Component
function EditTenantDialog({ isOpen, onClose, tenant }: {
  isOpen: boolean;
  onClose: () => void;
  tenant: any;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    contactEmail: "",
    contactName: "",
    packageId: "",
    status: "active"
  });

  // Get packages for dropdown
  const { data: packages } = useQuery({
    queryKey: ["/api/super-admin/packages"],
  });

  // Initialize form data when dialog opens
  React.useEffect(() => {
    if (isOpen && tenant) {
      setFormData({
        name: tenant.name || "",
        contactEmail: tenant.contactEmail || "",
        contactName: tenant.contactName || "",
        packageId: tenant.packageId || "",
        status: tenant.status || "active"
      });
    }
  }, [isOpen, tenant]);

  const updateTenantMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/super-admin/tenants/${tenant.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/tenants"] });
      toast({
        title: "Success",
        description: "Account updated successfully",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update account",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateTenantMutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Account - {tenant?.name}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-name">Business Name</Label>
            <Input 
              id="edit-name" 
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Acme Events Inc."
              required
            />
          </div>
          
          <div>
            <Label htmlFor="edit-contactEmail">Admin Email</Label>
            <Input 
              id="edit-contactEmail" 
              type="email" 
              value={formData.contactEmail}
              onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              placeholder="admin@acme.com"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="edit-contactName">Admin Name</Label>
            <Input 
              id="edit-contactName" 
              value={formData.contactName}
              onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
              placeholder="John Doe"
            />
          </div>
          
          <div>
            <Label htmlFor="edit-package">Package</Label>
            <Select 
              value={formData.packageId} 
              onValueChange={(value) => setFormData({ ...formData, packageId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select package" />
              </SelectTrigger>
              <SelectContent>
                {((packages as any[]) || []).map((pkg: any) => (
                  <SelectItem key={pkg.id} value={pkg.id}>
                    {pkg.displayName} - ${pkg.price}/{pkg.billingInterval}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="edit-status">Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateTenantMutation.isPending}>
              {updateTenantMutation.isPending ? "Updating..." : "Update Account"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Create Tenant Dialog Component
function CreateTenantDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get packages for dropdown
  const { data: packages } = useQuery({
    queryKey: ["/api/super-admin/packages"],
  });

  const [formData, setFormData] = useState({
    name: "",
    contactEmail: "",
    contactName: "",
    packageId: ""
  });

  const createTenantMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/super-admin/tenants", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/tenants"] });
      toast({
        title: "Success",
        description: "Account created successfully",
      });
      setOpen(false);
      setFormData({ name: "", contactEmail: "", contactName: "", packageId: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTenantMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Account
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Account</DialogTitle>
          <p className="text-sm text-slate-600">
            Create an account that can manage multiple venues and spaces.
          </p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Business Name</Label>
            <Input 
              id="name" 
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Acme Events Inc." 
              required
            />
          </div>
          
          <div>
            <Label htmlFor="contactEmail">Admin Email</Label>
            <Input 
              id="contactEmail" 
              type="email" 
              value={formData.contactEmail}
              onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              placeholder="admin@acme.com" 
              required
            />
          </div>
          
          <div>
            <Label htmlFor="contactName">Admin Name</Label>
            <Input 
              id="contactName" 
              value={formData.contactName}
              onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
              placeholder="John Doe" 
            />
          </div>
          
          <div>
            <Label htmlFor="package">Package</Label>
            <Select 
              value={formData.packageId} 
              onValueChange={(value) => setFormData({ ...formData, packageId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select package" />
              </SelectTrigger>
              <SelectContent>
                {((packages as any[]) || []).map((pkg: any) => (
                  <SelectItem key={pkg.id} value={pkg.id}>
                    {pkg.displayName} - ${pkg.price}/{pkg.billingInterval}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button type="submit" className="w-full" disabled={createTenantMutation.isPending}>
            {createTenantMutation.isPending ? "Creating..." : "Create Account"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Package Management Component
function PackageManagement({ packages }: { packages: any }) {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);
  const queryClient = useQueryClient();

  const togglePackageMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("PATCH", `/api/super-admin/packages/${id}/toggle`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/packages"] });
      toast({
        title: "Success",
        description: "Package status updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update package status",
        variant: "destructive",
      });
    },
  });

  const deletePackageMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/super-admin/packages/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/packages"] });
      toast({
        title: "Success",
        description: "Package deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete package",
        variant: "destructive",
      });
    },
  });

  const getPackageIcon = (pkg: any) => {
    if (pkg.id === "starter") return "🌱";
    if (pkg.id === "professional") return "💼";
    if (pkg.id === "business") return "🏢";
    if (pkg.id === "enterprise") return "👑";
    return "📦";
  };

  const getPackageColor = (pkg: any) => {
    if (pkg.id === "starter") return "border-green-200 bg-green-50";
    if (pkg.id === "professional") return "border-blue-200 bg-blue-50";
    if (pkg.id === "business") return "border-purple-200 bg-purple-50";
    if (pkg.id === "enterprise") return "border-yellow-200 bg-yellow-50";
    return "border-gray-200 bg-gray-50";
  };

  const getFeatureList = (features: any) => {
    const featureKeys = Object.keys(features).filter(key => features[key] === true);
    return featureKeys.slice(0, 6); // Show first 6 features
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Feature Packages</h2>
          <p className="text-sm text-slate-600 mt-1">Manage subscription tiers and feature access</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Package
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {((packages as any[]) || []).map((pkg: any) => (
          <Card key={pkg.id} className={`relative ${getPackageColor(pkg)} hover:shadow-lg transition-shadow`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getPackageIcon(pkg)}</span>
                  <CardTitle className="text-lg">{pkg.displayName}</CardTitle>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant={pkg.isActive ? "default" : "secondary"} className="text-xs">
                    {pkg.isActive ? "Active" : "Inactive"}
                  </Badge>
                  {!pkg.isCustom && (
                    <Badge variant="outline" className="text-xs">
                      System
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">{pkg.description}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  ${pkg.price}
                </div>
                <div className="text-sm text-slate-500">per {pkg.billingInterval}</div>
              </div>
              
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white dark:bg-slate-800 p-2 rounded">
                    <div className="font-medium">Users</div>
                    <div className="text-slate-600">{pkg.maxUsers || "∞"}</div>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-2 rounded">
                    <div className="font-medium">Venues</div>
                    <div className="text-slate-600">{pkg.maxVenues || "∞"}</div>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-2 rounded">
                    <div className="font-medium">Spaces</div>
                    <div className="text-slate-600">{pkg.maxSpaces || "∞"}</div>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-2 rounded">
                    <div className="font-medium">Storage</div>
                    <div className="text-slate-600">{pkg.storageLimit}GB</div>
                  </div>
                </div>

                {pkg.maxBookingsPerMonth && (
                  <div className="bg-white dark:bg-slate-800 p-2 rounded text-xs">
                    <div className="font-medium">Monthly Bookings</div>
                    <div className="text-slate-600">{pkg.maxBookingsPerMonth || "∞"}</div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="text-xs font-medium text-slate-700 dark:text-slate-300">Key Features:</div>
                <div className="space-y-1">
                  {getFeatureList(pkg.features).map((feature: string) => (
                    <div key={feature} className="flex items-center gap-1 text-xs text-slate-600">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span className="capitalize">{feature.replace(/([A-Z])/g, ' $1').trim()}</span>
                    </div>
                  ))}
                  {Object.keys(pkg.features).length > 6 && (
                    <div className="text-xs text-slate-500">
                      +{Object.keys(pkg.features).length - 6} more features
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => setEditingPackage(pkg)}
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => togglePackageMutation.mutate(pkg.id)}
                  disabled={togglePackageMutation.isPending}
                >
                  {pkg.isActive ? (
                    <XCircle className="w-3 h-3" />
                  ) : (
                    <CheckCircle className="w-3 h-3" />
                  )}
                </Button>
                {pkg.isCustom && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-red-600"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this package?")) {
                        deletePackageMutation.mutate(pkg.id);
                      }
                    }}
                    disabled={deletePackageMutation.isPending}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )) || (
          <Card className="col-span-full">
            <CardContent className="text-center py-8 text-slate-600">
              <Package className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              <p>No packages found. Create the first package to get started.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Package Creation/Edit Dialog would go here */}
      <PackageDialog 
        isOpen={showCreateDialog || !!editingPackage}
        onClose={() => {
          setShowCreateDialog(false);
          setEditingPackage(null);
        }}
        package={editingPackage}
        isEdit={!!editingPackage}
      />
    </div>
  );
}

// Package Creation/Edit Dialog Component
function PackageDialog({ isOpen, onClose, package: pkg, isEdit }: {
  isOpen: boolean;
  onClose: () => void;
  package?: any;
  isEdit: boolean;
}) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    displayName: "",
    description: "",
    price: "",
    billingInterval: "monthly",
    maxUsers: "",
    maxVenues: "",
    maxSpaces: "",
    maxBookingsPerMonth: "",
    storageLimit: "",
    features: {} as any
  });

  const queryClient = useQueryClient();

  // Complete list of all available features (functional features only)
  const allFeatures = {
    // Core Booking & Customer Management
    bookingManagement: "Booking Management",
    customerManagement: "Customer Management", 
    proposalSystem: "Proposal System",
    contractManagement: "Contract Management",
    taskManagement: "Task Management",
    
    // Calendar & Scheduling
    calendarView: "Calendar View",
    realTimeAvailability: "Real-Time Availability",
    conflictDetection: "Booking Conflict Detection",
    
    // Venue & Space Management
    venueManagement: "Venue Management",
    spaceManagement: "Space Management",
    floorPlanDesigner: "Floor Plan Designer",
    setupManagement: "Setup Management",
    
    // Services & Packages
    serviceManagement: "Service Management",
    packageManagement: "Package Management",
    pricingConfiguration: "Pricing Configuration",
    
    // Financial Management
    paymentProcessing: "Payment Processing",
    invoicing: "Invoicing",
    taxConfiguration: "Tax Configuration",
    
    // BEO & Documentation
    beoGeneration: "BEO Generation",
    beoTemplates: "BEO Templates",
    contractGeneration: "Contract Generation",
    
    // Reporting & Analytics
    basicReporting: "Basic Reporting",
    advancedReporting: "Advanced Reporting",
    realTimeAnalytics: "Real-Time Analytics",
    dashboardInsights: "Dashboard Insights",
    
    // AI Features
    aiInsights: "AI Insights",
    voiceBooking: "Voice-to-Text Booking",
    smartScheduling: "Smart Scheduling",
    automatedEmailReplies: "Automated Email Replies",
    leadScoring: "Lead Scoring",
    
    // Communication
    emailIntegration: "Email Integration",
    smsNotifications: "SMS Notifications",
    internalNotes: "Internal Notes",
    customerCommunication: "Customer Communication Panel",
    
    // Multi-tenant Features
    multiVenueSupport: "Multi-Venue Support",
    userRoleManagement: "User Role Management",
    
    // Data & Export
    dataExport: "Data Export",
    dataImport: "Data Import",
    bulkOperations: "Bulk Operations"
  };

  // Initialize form data when editing
  useEffect(() => {
    if (isEdit && pkg) {
      setFormData({
        name: pkg.name || "",
        displayName: pkg.displayName || "",
        description: pkg.description || "",
        price: pkg.price?.toString() || "",
        billingInterval: pkg.billingInterval || "monthly",
        maxUsers: pkg.maxUsers?.toString() || "",
        maxVenues: pkg.maxVenues?.toString() || "",
        maxSpaces: pkg.maxSpaces?.toString() || "",
        maxBookingsPerMonth: pkg.maxBookingsPerMonth?.toString() || "",
        storageLimit: pkg.storageLimit?.toString() || "",
        features: pkg.features || {}
      });
    } else {
      // Initialize with all features disabled for new packages
      const initialFeatures = Object.keys(allFeatures).reduce((acc, key) => {
        acc[key] = false;
        return acc;
      }, {} as any);
      setFormData(prev => ({ ...prev, features: initialFeatures }));
    }
  }, [isEdit, pkg]);

  const toggleFeature = (featureKey: string) => {
    setFormData(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [featureKey]: !prev.features[featureKey]
      }
    }));
  };

  const toggleAllFeatures = (enabled: boolean) => {
    const allFeaturesState = Object.keys(allFeatures).reduce((acc, key) => {
      acc[key] = enabled;
      return acc;
    }, {} as any);
    setFormData(prev => ({ ...prev, features: allFeaturesState }));
  };

  const getFeaturesByCategory = () => {
    return {
      "Core Management": {
        bookingManagement: "Booking Management",
        customerManagement: "Customer Management",
        proposalSystem: "Proposal System",
        contractManagement: "Contract Management",
        taskManagement: "Task Management"
      },
      "Calendar & Scheduling": {
        calendarView: "Calendar View",
        realTimeAvailability: "Real-Time Availability",
        conflictDetection: "Booking Conflict Detection"
      },
      "Venue & Space": {
        venueManagement: "Venue Management",
        spaceManagement: "Space Management",
        floorPlanDesigner: "Floor Plan Designer",
        setupManagement: "Setup Management"
      },
      "Services & Pricing": {
        serviceManagement: "Service Management",
        packageManagement: "Package Management",
        pricingConfiguration: "Pricing Configuration"
      },
      "Financial": {
        paymentProcessing: "Payment Processing",
        invoicing: "Invoicing",
        taxConfiguration: "Tax Configuration"
      },
      "Documentation": {
        beoGeneration: "BEO Generation",
        beoTemplates: "BEO Templates",
        contractGeneration: "Contract Generation"
      },
      "Analytics & Reporting": {
        basicReporting: "Basic Reporting",
        advancedReporting: "Advanced Reporting",
        realTimeAnalytics: "Real-Time Analytics",
        dashboardInsights: "Dashboard Insights"
      },
      "AI Features": {
        aiInsights: "AI Insights",
        voiceBooking: "Voice-to-Text Booking",
        smartScheduling: "Smart Scheduling",
        automatedEmailReplies: "Automated Email Replies",
        leadScoring: "Lead Scoring"
      },
      "Communication": {
        emailIntegration: "Email Integration",
        smsNotifications: "SMS Notifications",
        internalNotes: "Internal Notes",
        customerCommunication: "Customer Communication Panel"
      },
      "Multi-tenant & Data": {
        multiVenueSupport: "Multi-Venue Support",
        userRoleManagement: "User Role Management",
        dataExport: "Data Export",
        dataImport: "Data Import",
        bulkOperations: "Bulk Operations"
      }
    };
  };

  const createPackageMutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = isEdit ? `/api/super-admin/packages/${pkg.id}` : "/api/super-admin/packages";
      const method = isEdit ? "PUT" : "POST";
      return apiRequest(method, endpoint, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/packages"] });
      toast({
        title: "Success",
        description: `Package ${isEdit ? "updated" : "created"} successfully`,
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || `Failed to ${isEdit ? "update" : "create"} package`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      price: parseFloat(formData.price),
      maxUsers: formData.maxUsers ? parseInt(formData.maxUsers) : null,
      maxVenues: formData.maxVenues ? parseInt(formData.maxVenues) : null,
      maxSpaces: formData.maxSpaces ? parseInt(formData.maxSpaces) : null,
      maxBookingsPerMonth: formData.maxBookingsPerMonth ? parseInt(formData.maxBookingsPerMonth) : null,
      storageLimit: parseInt(formData.storageLimit)
    };

    createPackageMutation.mutate(submitData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Package" : "Create New Package"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Package Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Package Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. custom-package"
                  required
                />
              </div>
              <div>
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="e.g. Custom Package"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what this package includes..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="29.99"
                  required
                />
              </div>
              <div>
                <Label htmlFor="billingInterval">Billing Interval</Label>
                <Select 
                  value={formData.billingInterval} 
                  onValueChange={(value) => setFormData({ ...formData, billingInterval: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Package Limits */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Package Limits</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="maxUsers">Max Users (leave empty for unlimited)</Label>
                <Input
                  id="maxUsers"
                  type="number"
                  value={formData.maxUsers}
                  onChange={(e) => setFormData({ ...formData, maxUsers: e.target.value })}
                  placeholder="10"
                />
              </div>
              <div>
                <Label htmlFor="maxVenues">Max Venues (leave empty for unlimited)</Label>
                <Input
                  id="maxVenues"
                  type="number"
                  value={formData.maxVenues}
                  onChange={(e) => setFormData({ ...formData, maxVenues: e.target.value })}
                  placeholder="5"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="maxSpaces">Max Spaces (leave empty for unlimited)</Label>
                <Input
                  id="maxSpaces"
                  type="number"
                  value={formData.maxSpaces}
                  onChange={(e) => setFormData({ ...formData, maxSpaces: e.target.value })}
                  placeholder="25"
                />
              </div>
              <div>
                <Label htmlFor="storageLimit">Storage Limit (GB)</Label>
                <Input
                  id="storageLimit"
                  type="number"
                  value={formData.storageLimit}
                  onChange={(e) => setFormData({ ...formData, storageLimit: e.target.value })}
                  placeholder="50"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="maxBookingsPerMonth">Max Monthly Bookings (leave empty for unlimited)</Label>
              <Input
                id="maxBookingsPerMonth"
                type="number"
                value={formData.maxBookingsPerMonth}
                onChange={(e) => setFormData({ ...formData, maxBookingsPerMonth: e.target.value })}
                placeholder="100"
              />
            </div>
          </div>

          {/* Feature Configuration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Feature Configuration</h3>
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => toggleAllFeatures(true)}
                >
                  Enable All
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => toggleAllFeatures(false)}
                >
                  Disable All
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(getFeaturesByCategory()).map(([category, features]) => (
                <Card key={category} className="p-4">
                  <h4 className="font-medium mb-3 text-sm">{category}</h4>
                  <div className="space-y-2">
                    {Object.entries(features).map(([featureKey, featureLabel]) => (
                      <div key={featureKey} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={featureKey}
                          checked={formData.features[featureKey] || false}
                          onChange={() => toggleFeature(featureKey)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <Label 
                          htmlFor={featureKey} 
                          className="text-sm font-normal cursor-pointer"
                        >
                          {featureLabel}
                        </Label>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>

            {/* Feature Summary */}
            <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                <strong>Selected Features: </strong>
                {Object.values(formData.features).filter(Boolean).length} of {Object.keys(allFeatures).length} features enabled
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createPackageMutation.isPending}>
              {createPackageMutation.isPending ? "Saving..." : (isEdit ? "Update Package" : "Create Package")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Activity Log Component
function ActivityLog({ activities }: { activities: any }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Platform Activity Log</h2>
      
      <Card>
        <CardContent className="p-0">
          <div className="space-y-4 p-6">
            {((activities as any[]) || []).map((activity: any) => (
              <div key={activity.id} className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{activity.action}</p>
                    <span className="text-xs text-slate-500">
                      {new Date(activity.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Tenant: {activity.tenantName}
                  </p>
                  {activity.details && (
                    <p className="text-xs text-slate-500 mt-1">
                      {activity.details}
                    </p>
                  )}
                </div>
              </div>
            )) || (
              <p className="text-center py-8 text-slate-600">
                No activity logs found.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// System Settings Component
function SystemSettings() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">System Settings</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Platform Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="platformName">Platform Name</Label>
              <Input id="platformName" defaultValue="Venuine" />
            </div>
            <div>
              <Label htmlFor="supportEmail">Support Email</Label>
              <Input id="supportEmail" defaultValue="support@venuine.com" />
            </div>
            <Button>Save Settings</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Default Limits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="trialDays">Trial Period (days)</Label>
              <Input id="trialDays" type="number" defaultValue="14" />
            </div>
            <div>
              <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
              <Input id="maxFileSize" type="number" defaultValue="50" />
            </div>
            <Button>Save Limits</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}