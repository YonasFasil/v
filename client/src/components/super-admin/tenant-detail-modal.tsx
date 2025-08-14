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
  Building
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

const FEATURE_DESCRIPTIONS = {
  dashboard_analytics: "Core dashboard with basic metrics and insights",
  venue_management: "Create and manage venue spaces and amenities", 
  event_booking: "Calendar view and event booking system",
  customer_management: "Manage customer profiles and contact information",
  proposal_system: "Generate and send event proposals to customers",
  payment_processing: "Accept payments and manage transactions",
  leads_management: "Advanced lead tracking and conversion tools",
  ai_analytics: "Smart insights and predictive analytics",
  voice_booking: "Create bookings using voice commands",
  floor_plans: "Interactive floor plan designer and setup templates",
  advanced_reports: "Detailed revenue and performance reports",
  task_management: "Team collaboration and task tracking",
  custom_branding: "White-label your venue platform",
  api_access: "Full REST API access for integrations",
  priority_support: "24/7 premium customer support",
  advanced_integrations: "Connect to external CRM and marketing tools",
  multi_location: "Manage multiple venue locations",
  custom_fields: "Create custom booking and customer fields"
};

export function TenantDetailModal({ tenant, open, onOpenChange }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [editData, setEditData] = useState({
    name: "",
    subdomain: "",
    customDomain: "",
    status: "trial",
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

  // Fetch tenant details including users
  const { data: tenantUsers = [] } = useQuery<TenantUser[]>({
    queryKey: [`/api/super-admin/tenants/${tenant?.id}/users`],
    enabled: !!tenant?.id && open
  });

  // Fetch available packages
  const { data: packages = [] } = useQuery<SubscriptionPackage[]>({
    queryKey: ["/api/super-admin/packages"],
    enabled: open
  });

  // Get current package for this tenant
  const currentPackage = packages.find(pkg => pkg.id === tenant?.subscriptionPackageId);
  const packageFeatures = Array.isArray(currentPackage?.features) ? currentPackage.features : [];

  // Update local state when tenant changes
  useEffect(() => {
    if (tenant) {
      setEditData({
        name: tenant.name || "",
        subdomain: tenant.subdomain || "",
        customDomain: tenant.customDomain || "",
        status: tenant.status || "trial",
        subscriptionPackageId: tenant.subscriptionPackageId || "",
        primaryColor: tenant.primaryColor || "#3b82f6",
        notes: ""
      });
    }
  }, [tenant]);

  // Update tenant mutation
  const updateTenantMutation = useMutation({
    mutationFn: (data: Partial<Tenant>) =>
      apiRequest(`/api/super-admin/tenants/${tenant?.id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({ title: "Tenant updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/tenants"] });
      queryClient.invalidateQueries({ queryKey: [`/api/super-admin/tenants/${tenant?.id}/users`] });
    },
    onError: (error: any) => {
      toast({ title: "Error updating tenant", description: error.message, variant: "destructive" });
    },
  });

  // Add user mutation
  const addUserMutation = useMutation({
    mutationFn: (userData: typeof newUserData) =>
      apiRequest(`/api/super-admin/tenants/${tenant?.id}/users`, {
        method: "POST",
        body: JSON.stringify(userData),
      }),
    onSuccess: () => {
      toast({ title: "User added successfully" });
      queryClient.invalidateQueries({ queryKey: [`/api/super-admin/tenants/${tenant?.id}/users`] });
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
      apiRequest(`/api/super-admin/tenants/${tenant?.id}/users/${userId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast({ title: "User removed successfully" });
      queryClient.invalidateQueries({ queryKey: [`/api/super-admin/tenants/${tenant?.id}/users`] });
    },
    onError: (error: any) => {
      toast({ title: "Error removing user", description: error.message, variant: "destructive" });
    },
  });

  const handleUpdateTenant = () => {
    updateTenantMutation.mutate(editData);
  };

  const handleAddUser = () => {
    if (!newUserData.username || !newUserData.name || !newUserData.email || !newUserData.password) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    addUserMutation.mutate({ ...newUserData, tenantId: tenant?.id });
  };

  const formatFeatureName = (featureId: string) => {
    return featureId.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'trial': return 'bg-blue-100 text-blue-800';
      case 'suspended': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'tenant_admin': return 'bg-purple-100 text-purple-800';
      case 'tenant_user': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="package">Package & Features</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
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
                    <Label htmlFor="subdomain">Subdomain</Label>
                    <Input
                      id="subdomain"
                      value={editData.subdomain}
                      onChange={(e) => setEditData(prev => ({ ...prev, subdomain: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      URL: /api/tenant/{editData.subdomain}/dashboard
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="customDomain">Custom Domain</Label>
                    <Input
                      id="customDomain"
                      value={editData.customDomain}
                      onChange={(e) => setEditData(prev => ({ ...prev, customDomain: e.target.value }))}
                      placeholder="bookings.company.com"
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
                        <SelectItem value="trial">Trial</SelectItem>
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
                    <Badge className={getStatusColor(tenant.status)}>
                      {tenant.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Created:</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(tenant.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {tenant.trialEndsAt && (
                    <div className="flex justify-between">
                      <span>Trial Ends:</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(tenant.trialEndsAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
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
                      <SelectItem value="">No Package (Trial)</SelectItem>
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
                        <span className="font-medium">Trial Days:</span> {currentPackage.trialDays}
                      </div>
                      <div>
                        <span className="font-medium">Max Venues:</span> {currentPackage.maxVenues}
                      </div>
                      <div>
                        <span className="font-medium">Max Users:</span> {currentPackage.maxUsers}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Included Features:</h4>
                      <div className="grid grid-cols-1 gap-2">
                        {Object.keys(FEATURE_DESCRIPTIONS).map((featureId) => {
                          const isIncluded = packageFeatures.includes(featureId);
                          return (
                            <div
                              key={featureId}
                              className={`p-3 border rounded-lg flex items-center justify-between ${
                                isIncluded ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                              }`}
                            >
                              <div>
                                <div className="font-medium">
                                  {formatFeatureName(featureId)}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {FEATURE_DESCRIPTIONS[featureId as keyof typeof FEATURE_DESCRIPTIONS]}
                                </div>
                              </div>
                              <div className="flex items-center">
                                {isIncluded ? (
                                  <Badge className="bg-green-100 text-green-800">
                                    <Check className="w-4 h-4 mr-1" />
                                    Included
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">
                                    <X className="w-4 h-4 mr-1" />
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
                )}

                {!currentPackage && editData.subscriptionPackageId === "" && (
                  <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      <span className="font-medium text-yellow-800">Trial Mode</span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">
                      This tenant is in trial mode with basic features only.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
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
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
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
                        <Badge className={getRoleColor(user.role)}>
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
                          onClick={() => deleteUserMutation.mutate(user.id)}
                          disabled={deleteUserMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
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
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}