import { useState } from "react";
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
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
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

// Create Tenant Dialog Component
function CreateTenantDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const createTenantMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/super-admin/tenants", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Tenant created successfully",
      });
      setOpen(false);
    },
  });

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
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Business Name</Label>
            <Input id="name" placeholder="Acme Events Inc." />
          </div>
          <div>
            <Label htmlFor="contactEmail">Admin Email</Label>
            <Input id="contactEmail" type="email" placeholder="admin@acme.com" />
          </div>
          <div>
            <Label htmlFor="contactName">Admin Name</Label>
            <Input id="contactName" placeholder="John Doe" />
          </div>
          <div>
            <Label htmlFor="package">Package</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select package" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full" disabled={createTenantMutation.isPending}>
            {createTenantMutation.isPending ? "Creating..." : "Create Account"}
          </Button>
        </div>
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

  // Initialize form data when editing
  useState(() => {
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
    }
  });

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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Package" : "Create New Package"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="flex gap-2 pt-4">
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