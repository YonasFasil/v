import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Package,
  Settings,
  Crown,
  Check,
  X,
  Plus,
  Trash2,
  Edit3,
  AlertTriangle,
  Building,
  Eye,
  Edit,
  CreditCard,
  DollarSign,
  Calendar,
  TrendingUp
} from "lucide-react";
import { type Tenant, type SubscriptionPackage, type User } from "@shared/schema";

interface Props {
  tenant: Tenant | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TenantUser extends User {
  permissions: string[];
}

interface FeatureAccess {
  [featureId: string]: boolean;
}

interface BillingRecord {
  id: string;
  tenant_id: string;
  subscription_package_id: string;
  package_name: string;
  amount: number;
  billing_period_start: string;
  billing_period_end: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  payment_method?: string;
  transaction_id?: string;
  invoice_url?: string;
  notes?: string;
  processed_at?: string;
  due_date?: string;
  created_at: string;
}

interface BillingSummary {
  total_bills: number;
  paid_bills: number;
  pending_bills: number;
  overdue_bills: number;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
}

const FEATURE_DESCRIPTIONS = {
  // Default features (always available)
  dashboard_analytics: "Core dashboard with basic metrics and insights",
  venue_management: "Create and manage venue spaces and amenities", 
  customer_management: "Manage customer profiles and contact information",
  payment_processing: "Accept payments and manage transactions",
  event_booking: "Create and manage events (table view) - Default feature",
  
  // Optional features (package-dependent)
  calendar_view: "Visual calendar interface for event management",
  proposal_system: "Generate and send event proposals to customers",
  leads_management: "Advanced lead tracking and conversion tools",
  ai_analytics: "Smart insights and predictive analytics",
  voice_booking: "Create bookings using voice commands",
  floor_plans: "Interactive floor plan designer and setup templates",
  advanced_reports: "Detailed revenue and performance reports",
  task_management: "Team collaboration and task tracking",
  custom_fields: "Create custom booking and customer fields"
};

// Get permissions based on tenant's package features
const getAvailablePermissions = (packageFeatures: string[]) => {
  const basePermissions = [
    "dashboard_view",
    "dashboard_edit",
    "venue_view", 
    "venue_create",
    "venue_edit",
    "venue_delete",
    "customer_view",
    "customer_create", 
    "customer_edit",
    "customer_delete",
    "payment_view",
    "payment_process",
    "user_view",
    "user_create",
    "user_edit", 
    "user_delete",
    "settings_view",
    "settings_edit"
  ];
  
  const featurePermissions: {[key: string]: string[]} = {
    calendar_view: ["calendar_view_access", "calendar_navigation"],
    proposal_system: ["proposal_view", "proposal_create", "proposal_edit", "proposal_delete"],
    leads_management: ["lead_view", "lead_create", "lead_edit", "lead_delete"],
    ai_analytics: ["ai_analytics_view", "ai_insights_access"],
    voice_booking: ["voice_booking_access"],
    floor_plans: ["floor_plan_view", "floor_plan_edit"],
    advanced_reports: ["report_view", "report_export", "advanced_report_access"],
    task_management: ["task_view", "task_create", "task_edit", "task_delete"],
    custom_fields: ["custom_field_create", "custom_field_edit"]
  };
  
  let availablePermissions = [...basePermissions];
  packageFeatures.forEach(feature => {
    if (featurePermissions[feature]) {
      availablePermissions.push(...featurePermissions[feature]);
    }
  });
  
  return availablePermissions;
};

export function TenantDetailModal({ tenant, open, onOpenChange }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [editData, setEditData] = useState({
    name: "",
    status: "active",
    subscriptionPackageId: "",
    primaryColor: "#3b82f6",
    notes: ""
  });

  const [newUserData, setNewUserData] = useState({
    username: "",
    name: "",
    email: "",
    password: "",
    role: "tenant_user"
  });

  const [showAddUser, setShowAddUser] = useState(false);
  const [showPermissions, setShowPermissions] = useState<string | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<{[userId: string]: string[]}>({});
  const [showAddBilling, setShowAddBilling] = useState(false);
  const [editingBilling, setEditingBilling] = useState<string | null>(null);
  const [newBillingData, setNewBillingData] = useState({
    amount: "",
    packageId: "",
    billingPeriodStart: "",
    billingPeriodEnd: "",
    dueDate: "",
    notes: ""
  });
  const [billingSettings, setBillingSettings] = useState({
    subscriptionStartedAt: "",
    subscriptionEndsAt: "",
    lastBillingDate: "",
    autoRenewal: true,
    billingCycle: "monthly"
  });

  // Fetch tenant details including users
  const { data: tenantUsers = [] } = useQuery<TenantUser[]>({
    queryKey: [`/api/super-admin/tenants?action=users&tenantId=${tenant?.id}`],
    queryFn: () => apiRequest(`/api/super-admin/tenants?action=users&tenantId=${tenant?.id}`),
    enabled: !!tenant?.id && open
  });

  // Fetch available packages
  const { data: packages = [] } = useQuery<SubscriptionPackage[]>({
    queryKey: ["/api/super-admin/packages"],
    enabled: open
  });

  // Fetch billing history
  const { data: billingHistory = [] } = useQuery<BillingRecord[]>({
    queryKey: [`/api/super-admin/tenants?action=billing&tenantId=${tenant?.id}`],
    queryFn: () => apiRequest(`/api/super-admin/tenants?action=billing&tenantId=${tenant?.id}`),
    enabled: !!tenant?.id && open
  });

  // Fetch billing summary
  const { data: billingSummaryData } = useQuery<{summary: BillingSummary; recentPayments: any[]}>({
    queryKey: [`/api/super-admin/tenants?action=billing-summary&tenantId=${tenant?.id}`],
    queryFn: () => apiRequest(`/api/super-admin/tenants?action=billing-summary&tenantId=${tenant?.id}`),
    enabled: !!tenant?.id && open
  });

  // Get current package for this tenant (handle both camelCase and snake_case)
  const tenantPackageId = tenant?.subscriptionPackageId || tenant?.subscription_package_id;
  const currentPackage = packages.find(pkg => pkg.id === tenantPackageId);
  const packageFeatures = Array.isArray(currentPackage?.features) ? currentPackage.features : [];

  // Update local state when tenant changes
  useEffect(() => {
    if (tenant) {
      const packageId = tenant.subscriptionPackageId || tenant.subscription_package_id || "none";
      setEditData({
        name: tenant.name || "",
        status: tenant.status || "active",
        subscriptionPackageId: packageId,
        primaryColor: tenant.primaryColor || tenant.primary_color || "#3b82f6",
        notes: ""
      });
    }
  }, [tenant]);

  // Initialize user permissions when users data changes
  useEffect(() => {
    if (tenantUsers.length > 0) {
      const permissionsMap: {[userId: string]: string[]} = {};
      tenantUsers.forEach(user => {
        permissionsMap[user.id] = user.permissions || [];
      });
      setUserPermissions(permissionsMap);
    }
  }, [tenantUsers]);

  // Update tenant mutation
  const updateTenantMutation = useMutation({
    mutationFn: (data: Partial<Tenant>) =>
      apiRequest(`/api/super-admin/tenants?action=tenant&tenantId=${tenant?.id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({ title: "Tenant updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/tenants"] });
      queryClient.invalidateQueries({ queryKey: [`/api/super-admin/tenants?action=users&tenantId=${tenant?.id}`] });
    },
    onError: (error: any) => {
      toast({ title: "Error updating tenant", description: error.message, variant: "destructive" });
    },
  });

  // Add user mutation
  const addUserMutation = useMutation({
    mutationFn: (userData: typeof newUserData) =>
      apiRequest(`/api/super-admin/tenants?action=createUser&tenantId=${tenant?.id}`, {
        method: "POST",
        body: JSON.stringify({...userData, tenantId: tenant?.id}),
      }),
    onSuccess: () => {
      toast({ title: "User added successfully" });
      queryClient.invalidateQueries({ queryKey: [`/api/super-admin/tenants?action=users&tenantId=${tenant?.id}`] });
      // Also invalidate ALL tenant-level queries to ensure sync
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0]?.toString().includes("/api/tenant/")
      });
      setNewUserData({ username: "", name: "", email: "", password: "", role: "tenant_user" });
      setShowAddUser(false);
    },
    onError: (error: any) => {
      toast({ title: "Error adding user", description: error.message, variant: "destructive" });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) =>
      apiRequest(`/api/super-admin/tenants?action=user&tenantId=${tenant?.id}&userId=${userId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast({ title: "User removed successfully" });
      queryClient.invalidateQueries({ queryKey: [`/api/super-admin/tenants?action=users&tenantId=${tenant?.id}`] });
      // Also invalidate ALL tenant-level queries to ensure sync
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0]?.toString().includes("/api/tenant/")
      });
    },
    onError: (error: any) => {
      toast({ title: "Error removing user", description: error.message, variant: "destructive" });
    },
  });

  // Update user permissions mutation
  const updatePermissionsMutation = useMutation({
    mutationFn: ({ userId, permissions }: { userId: string; permissions: string[] }) =>
      apiRequest(`/api/super-admin/tenants?action=permissions&tenantId=${tenant?.id}&userId=${userId}`, {
        method: "PUT",
        body: JSON.stringify({ permissions }),
      }),
    onSuccess: () => {
      toast({ title: "Permissions updated successfully" });
      queryClient.invalidateQueries({ queryKey: [`/api/super-admin/tenants?action=users&tenantId=${tenant?.id}`] });
      // Also invalidate ALL tenant-level queries to ensure sync
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0]?.toString().includes("/api/tenant/")
      });
      setEditingPermissions(null);
    },
    onError: (error: any) => {
      toast({ title: "Error updating permissions", description: error.message, variant: "destructive" });
    },
  });

  // Add billing record mutation
  const addBillingMutation = useMutation({
    mutationFn: (billingData: typeof newBillingData) =>
      apiRequest(`/api/super-admin/tenants?action=billing&tenantId=${tenant?.id}`, {
        method: "POST",
        body: JSON.stringify({
          amount: parseFloat(billingData.amount),
          packageId: billingData.packageId || null,
          billingPeriodStart: billingData.billingPeriodStart,
          billingPeriodEnd: billingData.billingPeriodEnd,
          dueDate: billingData.dueDate,
          notes: billingData.notes
        }),
      }),
    onSuccess: () => {
      toast({ title: "Billing record added successfully" });
      queryClient.invalidateQueries({ queryKey: [`/api/super-admin/tenants?action=billing&tenantId=${tenant?.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/super-admin/tenants?action=billing-summary&tenantId=${tenant?.id}`] });
      setNewBillingData({ amount: "", packageId: "", billingPeriodStart: "", billingPeriodEnd: "", dueDate: "", notes: "" });
      setShowAddBilling(false);
    },
    onError: (error: any) => {
      toast({ title: "Error adding billing record", description: error.message, variant: "destructive" });
    },
  });

  // Update billing record mutation
  const updateBillingMutation = useMutation({
    mutationFn: ({ billingId, updates }: { billingId: string; updates: any }) =>
      apiRequest(`/api/super-admin/tenants?action=billing&tenantId=${tenant?.id}&billingId=${billingId}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      }),
    onSuccess: () => {
      toast({ title: "Billing record updated successfully" });
      queryClient.invalidateQueries({ queryKey: [`/api/super-admin/tenants?action=billing&tenantId=${tenant?.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/super-admin/tenants?action=billing-summary&tenantId=${tenant?.id}`] });
      setEditingBilling(null);
    },
    onError: (error: any) => {
      toast({ title: "Error updating billing record", description: error.message, variant: "destructive" });
    },
  });

  const handleUpdateTenant = () => {
    const payload = {
      ...editData,
      subscriptionPackageId: editData.subscriptionPackageId === "none" ? null : editData.subscriptionPackageId,
      billingSettings: billingSettings.subscriptionStartedAt || billingSettings.subscriptionEndsAt || billingSettings.lastBillingDate ? billingSettings : undefined
    };
    updateTenantMutation.mutate(payload);
  };

  const handleAddBilling = () => {
    if (!newBillingData.amount || !newBillingData.billingPeriodStart || !newBillingData.billingPeriodEnd) {
      toast({ title: "Please fill in amount and billing period", variant: "destructive" });
      return;
    }
    addBillingMutation.mutate(newBillingData);
  };

  const handleMarkAsPaid = (billing: BillingRecord) => {
    updateBillingMutation.mutate({
      billingId: billing.id,
      updates: {
        status: 'paid',
        processedAt: new Date().toISOString(),
        paymentMethod: 'manual'
      }
    });
  };

  

  const handleAddUser = () => {
    if (!newUserData.username || !newUserData.name || !newUserData.email || !newUserData.password) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    addUserMutation.mutate(newUserData);
  };

  const handlePermissionToggle = (userId: string, permission: string) => {
    setUserPermissions(prev => {
      const currentPermissions = prev[userId] || [];
      const hasPermission = currentPermissions.includes(permission);
      
      if (hasPermission) {
        return {
          ...prev,
          [userId]: currentPermissions.filter(p => p !== permission)
        };
      } else {
        return {
          ...prev,
          [userId]: [...currentPermissions, permission]
        };
      }
    });
  };

  const handleSavePermissions = (userId: string) => {
    const user = tenantUsers.find(u => u.id === userId);
    const isAdmin = user?.role === 'tenant_admin';
    const availablePermissions = getAvailablePermissions(packageFeatures);
    
    let permissions = userPermissions[userId] || [];
    
    // For admin users, automatically grant all available permissions within their package scope
    if (isAdmin) {
      permissions = availablePermissions;
    }
    
    updatePermissionsMutation.mutate({ userId, permissions });
  };

  const handleCancelPermissions = (userId: string) => {
    // Reset to original permissions
    const originalUser = tenantUsers.find(u => u.id === userId);
    if (originalUser) {
      setUserPermissions(prev => ({
        ...prev,
        [userId]: originalUser.permissions || []
      }));
    }
    setEditingPermissions(null);
  };

  const formatFeatureName = (featureId: string) => {
    return featureId.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  

  

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'overdue': return 'danger';
      case 'cancelled': return 'secondary';
      default: return 'secondary';
    }
  };

  const getTenantStatusVariant = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'suspended': return 'warning';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  };

  const getRoleVariant = (role: string) => {
    switch (role) {
      case 'tenant_admin': return 'purple';
      case 'tenant_user': return 'info';
      default: return 'secondary';
    }
  };

  if (!tenant) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            {tenant.name} - Tenant Details
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="package">Package & Features</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Organization Name</Label>
                    <Input
                      id="name"
                      value={editData.name}
                      onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      value={editData.status} 
                      onValueChange={(value) => setEditData(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Usage Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Current Users:</span>
                    <Badge variant="outline">{tenant.currentUsers || 0}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Current Venues:</span>
                    <Badge variant="outline">{tenant.currentVenues || 0}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Monthly Bookings:</span>
                    <Badge variant="outline">{tenant.monthlyBookings || 0}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge variant={getTenantStatusVariant(editData.status)}>
                      {editData.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Created:</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(tenant.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateTenant}
                disabled={updateTenantMutation.isPending}
              >
                {updateTenantMutation.isPending ? "Updating..." : "Update Tenant"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="package" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current Package Assignment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="packageId">Subscription Package</Label>
                  <Select 
                    value={editData.subscriptionPackageId} 
                    onValueChange={(value) => setEditData(prev => ({ ...prev, subscriptionPackageId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a package" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Package (Basic Access)</SelectItem>
                      {packages.map((pkg) => (
                        <SelectItem key={pkg.id} value={pkg.id}>
                          {pkg.name} - ${pkg.price}/{pkg.billingInterval}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {currentPackage && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-4">Package Details: {currentPackage.name}</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <span className="font-medium">Price:</span> ${currentPackage.price}/{currentPackage.billingInterval}
                      </div>
                      <div>
                        <span className="font-medium">Max Venues:</span> {currentPackage.maxVenues}
                      </div>
                      <div>
                        <span className="font-medium">Max Users:</span> {currentPackage.maxUsers}
                      </div>
                      <div>
                        <span className="font-medium">Max Bookings:</span> Unlimited
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Feature Access:</h4>
                      
                      {/* Default Features */}
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-green-700 mb-2">Default Features (Always Available)</h5>
                        <div className="grid grid-cols-1 gap-2">
                          {['dashboard_analytics', 'venue_management', 'customer_management', 'payment_processing'].map((featureId) => (
                            <div key={featureId} className="p-2 border border-green-200 bg-green-50 rounded flex items-center justify-between">
                              <div>
                                <div className="font-medium text-sm">{formatFeatureName(featureId)}</div>
                                <div className="text-xs text-muted-foreground">
                                  {FEATURE_DESCRIPTIONS[featureId as keyof typeof FEATURE_DESCRIPTIONS]}
                                </div>
                              </div>
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                <Check className="w-3 h-3 mr-1" />
                                Always On
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Optional Features */}
                      <div>
                        <h5 className="text-sm font-medium text-blue-700 mb-2">Package Features</h5>
                        <div className="grid grid-cols-1 gap-2">
                          {['calendar_view', 'proposal_system', 'leads_management', 'ai_analytics', 'voice_booking', 'floor_plans', 'advanced_reports', 'task_management', 'custom_fields'].map((featureId) => {
                            const isIncluded = packageFeatures.includes(featureId);
                            return (
                              <div
                                key={featureId}
                                className={`p-2 border rounded flex items-center justify-between ${
                                  isIncluded ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'
                                }`}
                              >
                                <div>
                                  <div className="font-medium text-sm">{formatFeatureName(featureId)}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {FEATURE_DESCRIPTIONS[featureId as keyof typeof FEATURE_DESCRIPTIONS]}
                                  </div>
                                </div>
                                <div className="flex items-center">
                                  {isIncluded ? (
                                    <Badge className="bg-blue-100 text-blue-800 text-xs">
                                      <Check className="w-3 h-3 mr-1" />
                                      Enabled
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="text-xs">
                                      <X className="w-3 h-3 mr-1" />
                                      Blocked
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {!currentPackage && (editData.subscriptionPackageId === "" || editData.subscriptionPackageId === "none") && (
                  <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-800">Basic Access</span>
                    </div>
                    <p className="text-sm text-blue-700 mt-1">
                      This tenant has basic access with default features only. Assign a package to enable additional features.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateTenant}
                disabled={updateTenantMutation.isPending}
              >
                {updateTenantMutation.isPending ? "Updating..." : "Update Tenant"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Tenant Users</CardTitle>
                  <Button onClick={() => setShowAddUser(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add User
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tenantUsers.map((user) => (
                    <div key={user.id} className="space-y-2">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                            <div className="text-sm text-muted-foreground">@{user.username}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <Badge variant={getRoleVariant(user.role)}>
                            {user.role === 'tenant_admin' ? (
                              <>
                                <Crown className="w-3 h-3 mr-1" />
                                Admin
                              </>
                            ) : (
                              'User'
                            )}
                          </Badge>
                          <Badge variant={user.isActive ? "default" : "secondary"}>
                            {user.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setShowPermissions(showPermissions === user.id ? null : user.id)}
                            title="View Permissions"
                          >
                            <Eye className="w-4 h-4 text-blue-500" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              if (editingPermissions === user.id) {
                                setEditingPermissions(null);
                              } else {
                                const availablePermissions = getAvailablePermissions(packageFeatures);
                                const isAdmin = user.role === 'tenant_admin';
                                
                                // Initialize permissions - for admins, start with all available permissions
                                const initialPermissions = isAdmin 
                                  ? availablePermissions 
                                  : (user.permissions || []);
                                  
                                setUserPermissions(prev => ({
                                  ...prev,
                                  [user.id]: initialPermissions
                                }));
                                setEditingPermissions(user.id);
                              }
                            }}
                            title="Edit Permissions"
                          >
                            <Edit className="w-4 h-4 text-green-500" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => deleteUserMutation.mutate(user.id)}
                            disabled={deleteUserMutation.isPending}
                            title="Remove User"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                      {showPermissions === user.id && (
                        <div className="ml-14 p-4 bg-gray-50 border rounded-lg">
                          <h5 className="font-medium mb-3">User Permissions</h5>
                          {(() => {
                            const availablePermissions = getAvailablePermissions(packageFeatures);
                            const isAdmin = user.role === 'tenant_admin';
                            const displayPermissions = isAdmin ? availablePermissions : (user.permissions || []);
                            
                            return displayPermissions.length > 0 ? (
                              <div>
                                {isAdmin && (
                                  <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                                    <strong>Admin User:</strong> Automatically has all permissions within package scope ({availablePermissions.length} permissions)
                                  </div>
                                )}
                                <div className="grid grid-cols-2 gap-2">
                                  {displayPermissions.map((permission, index) => (
                                    <Badge 
                                      key={index} 
                                      variant={isAdmin ? "default" : "outline"} 
                                      className={`justify-start ${isAdmin ? 'bg-green-100 text-green-800' : ''}`}
                                    >
                                      {permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                      {isAdmin && <span className="ml-1 text-xs">(Auto)</span>}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                This user has {user.role === 'tenant_admin' ? 'admin permissions within their package scope' : 'basic user permissions'}.
                              </p>
                            );
                          })()}
                        </div>
                      )}
                      {editingPermissions === user.id && (
                        <div className="ml-14 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex justify-between items-center mb-3">
                            <h5 className="font-medium">Edit User Permissions</h5>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleCancelPermissions(user.id)}
                              >
                                Cancel
                              </Button>
                              <Button 
                                size="sm"
                                onClick={() => handleSavePermissions(user.id)}
                                disabled={updatePermissionsMutation.isPending}
                              >
                                {updatePermissionsMutation.isPending ? "Saving..." : "Save"}
                              </Button>
                            </div>
                          </div>
                          {(() => {
                            const availablePermissions = getAvailablePermissions(packageFeatures);
                            const isAdmin = user.role === 'tenant_admin';
                            const userCurrentPermissions = userPermissions[user.id] || [];
                            
                            return (
                              <div>
                                <div className="mb-3 space-y-2">
                                  <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                                    <p className="text-sm text-blue-700">
                                      <strong>Package Features:</strong> Permissions are limited by the tenant's package features. 
                                      Only permissions for enabled features can be granted.
                                    </p>
                                  </div>
                                  {isAdmin && (
                                    <div className="p-2 bg-green-50 border border-green-200 rounded">
                                      <p className="text-sm text-green-700">
                                        <strong>Admin User:</strong> This user automatically gets all permissions within their package scope. 
                                        Individual permissions are pre-selected but can be customized if needed.
                                      </p>
                                    </div>
                                  )}
                                </div>
                                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                                  {availablePermissions.map((permission) => {
                                    const hasPermission = userCurrentPermissions.includes(permission);
                                    const shouldBeAutoGranted = isAdmin; // Admins get all available permissions by default
                                    
                                    return (
                                      <div key={permission} className="flex items-center space-x-2">
                                        <Switch
                                          checked={hasPermission || shouldBeAutoGranted}
                                          onCheckedChange={() => {
                                            if (!shouldBeAutoGranted) {
                                              handlePermissionToggle(user.id, permission);
                                            }
                                          }}
                                          disabled={shouldBeAutoGranted}
                                        />
                                        <label className={`text-sm ${
                                          shouldBeAutoGranted ? 'text-green-700 font-medium' : ''
                                        }`}>
                                          {permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                          {shouldBeAutoGranted && (
                                            <span className="text-xs text-green-600 ml-1">(Auto)</span>
                                          )}
                                        </label>
                                      </div>
                                    );
                                  })}
                                </div>
                                {isAdmin && (
                                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                                    <p className="text-xs text-yellow-700">
                                      💡 <strong>Tip:</strong> Admin users automatically receive all permissions available within their package. 
                                      The toggles above are disabled because admins have full access to all enabled features.
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  ))}

                  {showAddUser && (
                    <div className="p-4 border rounded-lg bg-gray-50">
                      <h4 className="font-medium mb-3">Add New User</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="newUsername">Username</Label>
                          <Input
                            id="newUsername"
                            value={newUserData.username}
                            onChange={(e) => setNewUserData(prev => ({ ...prev, username: e.target.value }))}
                            placeholder="john_doe"
                          />
                        </div>
                        <div>
                          <Label htmlFor="newName">Full Name</Label>
                          <Input
                            id="newName"
                            value={newUserData.name}
                            onChange={(e) => setNewUserData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="John Doe"
                          />
                        </div>
                        <div>
                          <Label htmlFor="newEmail">Email</Label>
                          <Input
                            id="newEmail"
                            type="email"
                            value={newUserData.email}
                            onChange={(e) => setNewUserData(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="john@example.com"
                          />
                        </div>
                        <div>
                          <Label htmlFor="newPassword">Password</Label>
                          <Input
                            id="newPassword"
                            type="password"
                            value={newUserData.password}
                            onChange={(e) => setNewUserData(prev => ({ ...prev, password: e.target.value }))}
                            placeholder="••••••••"
                          />
                        </div>
                        <div>
                          <Label htmlFor="newRole">Role</Label>
                          <Select 
                            value={newUserData.role} 
                            onValueChange={(value) => setNewUserData(prev => ({ ...prev, role: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="tenant_user">User</SelectItem>
                              <SelectItem value="tenant_admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2 mt-4">
                        <Button variant="outline" onClick={() => setShowAddUser(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleAddUser}
                          disabled={addUserMutation.isPending}
                        >
                          {addUserMutation.isPending ? "Adding..." : "Add User"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateTenant}
                disabled={updateTenantMutation.isPending}
              >
                {updateTenantMutation.isPending ? "Updating..." : "Update Tenant"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="billing" className="space-y-4">
            {/* Billing Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Total Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${billingSummaryData?.summary?.paid_amount?.toFixed(2) || '0.00'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    From {billingSummaryData?.summary?.paid_bills || 0} paid bills
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Pending Amount
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    ${billingSummaryData?.summary?.pending_amount?.toFixed(2) || '0.00'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {billingSummaryData?.summary?.pending_bills || 0} pending bills
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Total Bills
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {billingSummaryData?.summary?.total_bills || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    All time billing records
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recurring Billing Settings */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Recurring Billing Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="subscriptionStarted">Subscription Started</Label>
                    <Input
                      id="subscriptionStarted"
                      type="date"
                      value={billingSettings.subscriptionStartedAt}
                      onChange={(e) => setBillingSettings(prev => ({ ...prev, subscriptionStartedAt: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="subscriptionEnds">Subscription Ends</Label>
                    <Input
                      id="subscriptionEnds"
                      type="date"
                      value={billingSettings.subscriptionEndsAt}
                      onChange={(e) => setBillingSettings(prev => ({ ...prev, subscriptionEndsAt: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastBilling">Last Billing Date</Label>
                    <Input
                      id="lastBilling"
                      type="date"
                      value={billingSettings.lastBillingDate}
                      onChange={(e) => setBillingSettings(prev => ({ ...prev, lastBillingDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="billingCycle">Billing Cycle</Label>
                    <Select
                      value={billingSettings.billingCycle}
                      onValueChange={(value) => setBillingSettings(prev => ({ ...prev, billingCycle: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="annual">Annual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={billingSettings.autoRenewal}
                    onCheckedChange={(checked) => setBillingSettings(prev => ({ ...prev, autoRenewal: checked }))}
                  />
                  <Label>Auto-renewal enabled</Label>
                </div>
              </CardContent>
            </Card>

            {/* Billing History */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Billing History</CardTitle>
                  <Button onClick={() => setShowAddBilling(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Billing Record
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {billingHistory.map((billing) => (
                    <div key={billing.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">${billing.amount}</div>
                          <div className="text-sm text-muted-foreground">
                            {billing.package_name || 'Custom Billing'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(billing.billing_period_start).toLocaleDateString()} - {new Date(billing.billing_period_end).toLocaleDateString()}
                          </div>
                          {billing.notes && (
                            <div className="text-xs text-muted-foreground">{billing.notes}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge variant={getStatusVariant(billing.status)}>
                          {billing.status}
                        </Badge>
                        {billing.due_date && (
                          <div className="text-sm text-muted-foreground">
                            Due: {new Date(billing.due_date).toLocaleDateString()}
                          </div>
                        )}
                        {billing.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => handleMarkAsPaid(billing)}
                            disabled={updateBillingMutation.isPending}
                          >
                            Mark as Paid
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingBilling(editingBilling === billing.id ? null : billing.id)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {billingHistory.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No billing records found. Click "Add Billing Record" to create the first one.
                    </div>
                  )}

                  {showAddBilling && (
                    <div className="p-4 border rounded-lg bg-gray-50">
                      <h4 className="font-medium mb-3">Add New Billing Record</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="billingAmount">Amount ($)</Label>
                          <Input
                            id="billingAmount"
                            type="number"
                            step="0.01"
                            value={newBillingData.amount}
                            onChange={(e) => setNewBillingData(prev => ({ ...prev, amount: e.target.value }))}
                            placeholder="29.99"
                          />
                        </div>
                        <div>
                          <Label htmlFor="billingPackage">Package (Optional)</Label>
                          <Select
                            value={newBillingData.packageId}
                            onValueChange={(value) => setNewBillingData(prev => ({ ...prev, packageId: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select package" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">No Package</SelectItem>
                              {packages.map((pkg) => (
                                <SelectItem key={pkg.id} value={pkg.id}>
                                  {pkg.name} - ${pkg.price}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="billingPeriodStart">Billing Period Start</Label>
                          <Input
                            id="billingPeriodStart"
                            type="date"
                            value={newBillingData.billingPeriodStart}
                            onChange={(e) => setNewBillingData(prev => ({ ...prev, billingPeriodStart: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="billingPeriodEnd">Billing Period End</Label>
                          <Input
                            id="billingPeriodEnd"
                            type="date"
                            value={newBillingData.billingPeriodEnd}
                            onChange={(e) => setNewBillingData(prev => ({ ...prev, billingPeriodEnd: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="billingDueDate">Due Date (Optional)</Label>
                          <Input
                            id="billingDueDate"
                            type="date"
                            value={newBillingData.dueDate}
                            onChange={(e) => setNewBillingData(prev => ({ ...prev, dueDate: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="billingNotes">Notes (Optional)</Label>
                          <Input
                            id="billingNotes"
                            value={newBillingData.notes}
                            onChange={(e) => setNewBillingData(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Additional notes..."
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2 mt-4">
                        <Button variant="outline" onClick={() => setShowAddBilling(false)}>
                          Cancel
                        </Button>
                        <Button
                          onClick={handleAddBilling}
                          disabled={addBillingMutation.isPending}
                        >
                          {addBillingMutation.isPending ? "Adding..." : "Add Billing Record"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleUpdateTenant}
                disabled={updateTenantMutation.isPending}
              >
                {updateTenantMutation.isPending ? "Updating..." : "Update Tenant"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Advanced Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <Input
                    id="primaryColor"
                    type="color"
                    value={editData.primaryColor}
                    onChange={(e) => setEditData(prev => ({ ...prev, primaryColor: e.target.value }))}
                    className="w-20 h-10"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Admin Notes</Label>
                  <Textarea
                    id="notes"
                    value={editData.notes}
                    onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Internal notes about this tenant..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateTenant}
                disabled={updateTenantMutation.isPending}
              >
                {updateTenantMutation.isPending ? "Updating..." : "Update Tenant"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}