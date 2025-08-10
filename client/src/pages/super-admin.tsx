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
  useEffect(() => {
    if (isOpen && tenant) {
      console.log("Initializing form with tenant data:", tenant);
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

// Billing Management Component
function PackageManagement({ packages }: { packages: any }) {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState("plans");
  const queryClient = useQueryClient();

  const togglePackageMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("PATCH", `/api/super-admin/packages/${id}/toggle`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/packages"] });
      toast({
        title: "Success",
        description: "Plan status updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update plan status",
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
        description: "Plan deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete plan",
        variant: "destructive",
      });
    },
  });

  const syncStripeProductMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/super-admin/packages/${id}/sync-stripe`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/packages"] });
      toast({
        title: "Success",
        description: "Stripe product synced successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to sync Stripe product",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Billing Management</h2>
          <p className="text-slate-600 dark:text-slate-400">
            Manage subscription plans, pricing, and billing features
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Plan
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {((packages as any[]) || []).map((pkg: any) => (
          <PlanCard 
            key={pkg.id} 
            plan={pkg} 
            onEdit={setEditingPackage}
            onToggle={togglePackageMutation.mutate}
            onDelete={deletePackageMutation.mutate}
            onSyncStripe={syncStripeProductMutation.mutate}
          />
        ))}
      </div>

      {/* Create Package Dialog */}
      {showCreateDialog && (
        <CreatePlanDialog 
          isOpen={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
        />
      )}

      {/* Edit Package Dialog */}
      {editingPackage && (
        <EditPlanDialog 
          plan={editingPackage}
          isOpen={true}
          onClose={() => setEditingPackage(null)}
        />
      )}
    </div>
  );
}

// Enhanced Plan Card Component
function PlanCard({ plan, onEdit, onToggle, onDelete, onSyncStripe }: {
  plan: any;
  onEdit: (plan: any) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onSyncStripe: (id: string) => void;
}) {
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

  return (
    <Card className={`relative ${getPackageColor(plan)} hover:shadow-lg transition-shadow`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getPackageIcon(plan)}</span>
            <CardTitle className="text-lg">{plan.displayName}</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant={plan.isActive ? "default" : "secondary"} className="text-xs">
              {plan.isActive ? "Active" : "Inactive"}
            </Badge>
            {!plan.isCustom && (
              <Badge variant="outline" className="text-xs">
                System
              </Badge>
            )}
          </div>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">{plan.description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            ${plan.price}
          </div>
          <div className="text-sm text-slate-500">per {plan.billingInterval}</div>
        </div>
        
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white dark:bg-slate-800 p-2 rounded">
              <div className="font-medium">Users</div>
              <div className="text-slate-600">{plan.maxUsers || "∞"}</div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-2 rounded">
              <div className="font-medium">Venues</div>
              <div className="text-slate-600">{plan.maxVenues || "∞"}</div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-2 rounded">
              <div className="font-medium">Bookings</div>
              <div className="text-slate-600">{plan.maxBookingsPerMonth || "∞"}</div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-2 rounded">
              <div className="font-medium">Storage</div>
              <div className="text-slate-600">{plan.storageLimit}GB</div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(plan)}
            className="flex-1"
          >
            <Edit className="w-3 h-3 mr-1" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToggle(plan.id)}
            className="flex-1"
          >
            {plan.isActive ? "Disable" : "Enable"}
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSyncStripe(plan.id)}
            className="flex-1"
          >
            <DollarSign className="w-3 h-3 mr-1" />
            Sync Stripe
          </Button>
          {plan.isCustom && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (confirm(`Delete plan "${plan.displayName}"?`)) {
                  onDelete(plan.id);
                }
              }}
              className="text-red-600"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Create Plan Dialog Component
function CreatePlanDialog({ isOpen, onClose }: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: "",
    displayName: "",
    description: "",
    slug: "",
    price: "",
    billingInterval: "month",
    maxUsers: "",
    maxVenues: "",
    maxBookingsPerMonth: "",
    storageLimit: "",
    features: {} as any
  });

  const createPlanMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/super-admin/packages", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/packages"] });
      toast({
        title: "Success",
        description: "Plan created successfully",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create plan",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPlanMutation.mutate({
      ...formData,
      price: parseFloat(formData.price),
      maxUsers: formData.maxUsers ? parseInt(formData.maxUsers) : null,
      maxVenues: formData.maxVenues ? parseInt(formData.maxVenues) : null,
      maxBookingsPerMonth: formData.maxBookingsPerMonth ? parseInt(formData.maxBookingsPerMonth) : null,
      storageLimit: formData.storageLimit ? parseInt(formData.storageLimit) : null,
      isCustom: true,
      isActive: true
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Plan</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Internal Name</Label>
              <Input 
                id="name" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="premium-plan" 
                required
              />
            </div>
            <div>
              <Label htmlFor="displayName">Display Name</Label>
              <Input 
                id="displayName" 
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="Premium Plan" 
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
              placeholder="Plan description..." 
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input 
                id="slug" 
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="premium" 
                required
              />
            </div>
            <div>
              <Label htmlFor="price">Price</Label>
              <Input 
                id="price" 
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="99.00" 
                required
              />
            </div>
            <div>
              <Label htmlFor="billingInterval">Billing</Label>
              <Select 
                value={formData.billingInterval} 
                onValueChange={(value) => setFormData({ ...formData, billingInterval: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Monthly</SelectItem>
                  <SelectItem value="year">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="maxUsers">Max Users</Label>
              <Input 
                id="maxUsers" 
                type="number"
                value={formData.maxUsers}
                onChange={(e) => setFormData({ ...formData, maxUsers: e.target.value })}
                placeholder="10" 
              />
            </div>
            <div>
              <Label htmlFor="maxVenues">Max Venues</Label>
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
              <Label htmlFor="maxBookingsPerMonth">Monthly Bookings</Label>
              <Input 
                id="maxBookingsPerMonth" 
                type="number"
                value={formData.maxBookingsPerMonth}
                onChange={(e) => setFormData({ ...formData, maxBookingsPerMonth: e.target.value })}
                placeholder="100" 
              />
            </div>
            <div>
              <Label htmlFor="storageLimit">Storage (GB)</Label>
              <Input 
                id="storageLimit" 
                type="number"
                value={formData.storageLimit}
                onChange={(e) => setFormData({ ...formData, storageLimit: e.target.value })}
                placeholder="10" 
              />
            </div>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createPlanMutation.isPending}>
              {createPlanMutation.isPending ? "Creating..." : "Create Plan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Edit Plan Dialog Component  
function EditPlanDialog({ plan, isOpen, onClose }: {
  plan: any;
  isOpen: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: plan?.name || "",
    displayName: plan?.displayName || "",
    description: plan?.description || "",
    price: plan?.price?.toString() || "",
    billingInterval: plan?.billingInterval || "month",
    maxUsers: plan?.maxUsers?.toString() || "",
    maxVenues: plan?.maxVenues?.toString() || "",
    maxBookingsPerMonth: plan?.maxBookingsPerMonth?.toString() || "",
    storageLimit: plan?.storageLimit?.toString() || "",
  });

  const updatePlanMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/super-admin/packages/${plan.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/packages"] });
      toast({
        title: "Success",
        description: "Plan updated successfully",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update plan",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePlanMutation.mutate({
      ...formData,
      price: parseFloat(formData.price),
      maxUsers: formData.maxUsers ? parseInt(formData.maxUsers) : null,
      maxVenues: formData.maxVenues ? parseInt(formData.maxVenues) : null,
      maxBookingsPerMonth: formData.maxBookingsPerMonth ? parseInt(formData.maxBookingsPerMonth) : null,
      storageLimit: formData.storageLimit ? parseInt(formData.storageLimit) : null,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Plan - {plan?.displayName}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-name">Internal Name</Label>
              <Input 
                id="edit-name" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-displayName">Display Name</Label>
              <Input 
                id="edit-displayName" 
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="edit-description">Description</Label>
            <Textarea 
              id="edit-description" 
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-price">Price</Label>
              <Input 
                id="edit-price" 
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-billingInterval">Billing</Label>
              <Select 
                value={formData.billingInterval} 
                onValueChange={(value) => setFormData({ ...formData, billingInterval: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Monthly</SelectItem>
                  <SelectItem value="year">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-maxUsers">Max Users</Label>
              <Input 
                id="edit-maxUsers" 
                type="number"
                value={formData.maxUsers}
                onChange={(e) => setFormData({ ...formData, maxUsers: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-maxVenues">Max Venues</Label>
              <Input 
                id="edit-maxVenues" 
                type="number"
                value={formData.maxVenues}
                onChange={(e) => setFormData({ ...formData, maxVenues: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-maxBookingsPerMonth">Monthly Bookings</Label>
              <Input 
                id="edit-maxBookingsPerMonth" 
                type="number"
                value={formData.maxBookingsPerMonth}
                onChange={(e) => setFormData({ ...formData, maxBookingsPerMonth: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-storageLimit">Storage (GB)</Label>
              <Input 
                id="edit-storageLimit" 
                type="number"
                value={formData.storageLimit}
                onChange={(e) => setFormData({ ...formData, storageLimit: e.target.value })}
              />
            </div>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={updatePlanMutation.isPending}>
              {updatePlanMutation.isPending ? "Updating..." : "Update Plan"}
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
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <p className="text-sm text-slate-600">Platform events and system activities</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {((activities as any[]) || []).map((activity: any, index: number) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <div className="mt-0.5">
                <Activity className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {activity.action}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {activity.description}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {new Date(activity.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          )) || (
            <div className="text-center py-8 text-slate-600">
              <Activity className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              <p>No recent activity to display.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// System Settings Component
function SystemSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">System Settings</h2>
        <p className="text-slate-600 dark:text-slate-400">
          Configure platform-wide settings and preferences
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
              <Input id="sessionTimeout" type="number" defaultValue="60" />
            </div>
            <div>
              <Label htmlFor="passwordPolicy">Password Policy</Label>
              <Select defaultValue="strong">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="strong">Strong</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button>Save Security Settings</Button>
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
