import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Users2, 
  UserPlus, 
  Edit, 
  Trash2, 
  Shield, 
  Eye, 
  EyeOff,
  CheckCircle,
  XCircle,
  Calendar
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[] | string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

interface CreateUserForm {
  name: string;
  email: string;
  password: string;
  role: string;
  permissions: string[];
}

const AVAILABLE_PERMISSIONS = [
  { id: 'view_dashboard', name: 'View Dashboard', description: 'Access to main dashboard' },
  { id: 'manage_events', name: 'Manage Events', description: 'Create, edit, delete events' },
  { id: 'view_events', name: 'View Events', description: 'View events only' },
  { id: 'manage_customers', name: 'Manage Customers', description: 'Create, edit, delete customers' },
  { id: 'view_customers', name: 'View Customers', description: 'View customers only' },
  { id: 'manage_venues', name: 'Manage Venues', description: 'Create, edit, delete venues' },
  { id: 'view_venues', name: 'View Venues', description: 'View venues only' },
  { id: 'manage_payments', name: 'Manage Payments', description: 'Process and view payments' },
  { id: 'view_payments', name: 'View Payments', description: 'View payments only' },
  { id: 'manage_proposals', name: 'Manage Proposals', description: 'Create and send proposals' },
  { id: 'view_proposals', name: 'View Proposals', description: 'View proposals only' },
  { id: 'manage_settings', name: 'Manage Settings', description: 'Access to system settings' },
  { id: 'view_reports', name: 'View Reports', description: 'Access to analytics and reports' },
  { id: 'manage_leads', name: 'Manage Leads', description: 'Manage customer leads' },
  { id: 'use_ai_features', name: 'AI Features', description: 'Access to AI-powered features' }
];

const ROLE_PRESETS = {
  tenant_admin: AVAILABLE_PERMISSIONS.map(p => p.id),
  tenant_user: ['view_dashboard', 'view_events', 'manage_events', 'view_customers', 'manage_customers', 'view_venues', 'view_proposals', 'manage_proposals'],
  viewer: ['view_dashboard', 'view_events', 'view_customers', 'view_venues', 'view_proposals', 'view_payments', 'view_reports']
};

export default function Users() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showPermissions, setShowPermissions] = useState<string | null>(null);
  
  const [createForm, setCreateForm] = useState<CreateUserForm>({
    name: "",
    email: "",
    password: "",
    role: "tenant_admin",
    permissions: ROLE_PRESETS.tenant_admin
  });

  const [editForm, setEditForm] = useState<Partial<User>>({
    name: "",
    email: "",
    role: "",
    permissions: [],
    isActive: true
  });

  // Fetch users
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/tenant/users"],
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: (userData: CreateUserForm) =>
      apiRequest("/api/tenant/users", {
        method: "POST",
        body: JSON.stringify(userData),
      }),
    onSuccess: () => {
      toast({ title: "User created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/tenant/users"] });
      // Also invalidate ALL super admin queries to ensure sync
      queryClient.invalidateQueries({ 
        predicate: (query) => query.queryKey[0]?.toString().includes("/api/super-admin/")
      });
      setShowCreateModal(false);
      resetCreateForm();
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to create user", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ userId, userData }: { userId: string; userData: Partial<User> }) =>
      apiRequest(`/api/tenant/users/${userId}`, {
        method: "PUT",
        body: JSON.stringify(userData),
      }),
    onSuccess: () => {
      toast({ title: "User updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/tenant/users"] });
      // Also invalidate ALL super admin queries to ensure sync
      queryClient.invalidateQueries({ 
        predicate: (query) => query.queryKey[0]?.toString().includes("/api/super-admin/")
      });
      setShowEditModal(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update user", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) =>
      apiRequest(`/api/tenant/users/${userId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast({ title: "User deactivated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/tenant/users"] });
      // Also invalidate ALL super admin queries to ensure sync
      queryClient.invalidateQueries({ 
        predicate: (query) => query.queryKey[0]?.toString().includes("/api/super-admin/")
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to deactivate user", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const resetCreateForm = () => {
    setCreateForm({
      name: "",
      email: "",
      password: "",
      role: "tenant_admin",
      permissions: ROLE_PRESETS.tenant_admin
    });
  };

  const handleRoleChange = (role: string) => {
    setCreateForm(prev => ({
      ...prev,
      role,
      permissions: ROLE_PRESETS[role as keyof typeof ROLE_PRESETS] || []
    }));
  };

  const handlePermissionToggle = (permissionId: string) => {
    setCreateForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  const handleEditPermissionToggle = (permissionId: string) => {
    setEditForm(prev => ({
      ...prev,
      permissions: (prev.permissions || []).includes(permissionId)
        ? (prev.permissions || []).filter(p => p !== permissionId)
        : [...(prev.permissions || []), permissionId]
    }));
  };

  const handleEditRoleChange = (role: string) => {
    setEditForm(prev => ({
      ...prev,
      role,
      permissions: ROLE_PRESETS[role as keyof typeof ROLE_PRESETS] || []
    }));
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !editForm.name || !editForm.email) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    updateUserMutation.mutate({
      userId: selectedUser.id,
      userData: editForm
    });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name || !createForm.email || !createForm.password) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    createUserMutation.mutate(createForm);
  };

  const handleEditUser = (user: User) => {
    // Ensure permissions is always an array
    let permissions = [];
    if (Array.isArray(user.permissions)) {
      permissions = user.permissions;
    } else if (typeof user.permissions === 'string') {
      try {
        // Try to parse as JSON if it's a string
        permissions = JSON.parse(user.permissions);
      } catch {
        // If not JSON, split by comma or treat as single permission
        permissions = user.permissions.split(',').map(p => p.trim()).filter(p => p);
      }
    }
    
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: permissions,
      isActive: user.isActive
    });
    setShowEditModal(true);
  };

  const handleToggleUserStatus = (user: User) => {
    updateUserMutation.mutate({
      userId: user.id,
      userData: { isActive: !user.isActive }
    });
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm("Are you sure you want to deactivate this user?")) {
      deleteUserMutation.mutate(userId);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'tenant_admin': return 'bg-red-100 text-red-800';
      case 'tenant_user': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar collapsed={sidebarCollapsed} />
      <MobileNav open={mobileNavOpen} setOpen={setMobileNavOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          onMenuClick={() => setMobileNavOpen(true)}
          onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          sidebarCollapsed={sidebarCollapsed}
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                  <Users2 className="w-8 h-8 text-blue-600" />
                  User Management
                </h1>
                <p className="text-slate-600 mt-1">Manage team members and their permissions</p>
              </div>
              <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Add User
              </Button>
            </div>

            {/* Users Grid */}
            <div className="grid gap-6">
              {isLoading ? (
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center text-slate-500">Loading users...</div>
                  </CardContent>
                </Card>
              ) : users.length === 0 ? (
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center text-slate-500">
                      <Users2 className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                      <p>No users found. Add your first team member!</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {users.map((user) => (
                    <Card key={user.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-700">
                                {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-900">{user.name}</h3>
                              <p className="text-sm text-slate-500">{user.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            {user.isActive ? (
                              <CheckCircle className="w-4 h-4 text-green-500" title="Active" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" title="Inactive" />
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">Role</span>
                            <Badge className={getRoleBadgeColor(user.role)}>
                              {user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">Permissions</span>
                            {user.role === 'tenant_admin' ? (
                              <div className="flex items-center gap-1 text-blue-600">
                                <Shield className="w-3 h-3" />
                                <span className="text-sm font-medium">Full Access</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => setShowPermissions(showPermissions === user.id ? null : user.id)}
                                className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                              >
                                {(() => {
                                  if (Array.isArray(user.permissions)) {
                                    return user.permissions.length;
                                  } else if (typeof user.permissions === 'string') {
                                    try {
                                      const parsed = JSON.parse(user.permissions);
                                      return Array.isArray(parsed) ? parsed.length : 0;
                                    } catch {
                                      return user.permissions ? user.permissions.split(',').filter(p => p.trim()).length : 0;
                                    }
                                  }
                                  return 0;
                                })()}
                                <Eye className="w-3 h-3 inline ml-1" />
                              </button>
                            )}
                          </div>

                          {user.lastLoginAt && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-slate-600">Last Login</span>
                              <span className="text-sm">{new Date(user.lastLoginAt).toLocaleDateString()}</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">Created</span>
                            <span className="text-sm">{new Date(user.createdAt).toLocaleDateString()}</span>
                          </div>

                          {showPermissions === user.id && user.role !== 'tenant_admin' && (
                            <div className="mt-3 p-3 bg-gray-50 border rounded-lg">
                              <h5 className="font-medium mb-2 text-sm">User Permissions</h5>
                              {(() => {
                                let permissions = [];
                                if (Array.isArray(user.permissions)) {
                                  permissions = user.permissions;
                                } else if (typeof user.permissions === 'string') {
                                  try {
                                    permissions = JSON.parse(user.permissions);
                                  } catch {
                                    permissions = user.permissions.split(',').map(p => p.trim()).filter(p => p);
                                  }
                                }
                                
                                return permissions && permissions.length > 0 ? (
                                  <div className="grid grid-cols-1 gap-1">
                                    {permissions.map((permission, index) => (
                                      <Badge key={index} variant="outline" className="justify-start text-xs">
                                        {permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                      </Badge>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-slate-500">
                                    No specific permissions assigned. User has {user.role === 'tenant_admin' ? 'full admin permissions' : 'role-based permissions'}.
                                  </p>
                                );
                              })()}
                            </div>
                          )}

                          <div className="flex items-center gap-2 pt-2 border-t">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleEditUser(user)}
                              className="flex-1"
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleToggleUserStatus(user)}
                              className={user.isActive ? "text-orange-600 hover:text-orange-700" : "text-green-600 hover:text-green-700"}
                            >
                              {user.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Create User Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleCreateSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="John Smith"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={createForm.password}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={createForm.role} onValueChange={handleRoleChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tenant_admin">Tenant Admin</SelectItem>
                  <SelectItem value="tenant_user">Tenant User</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Permissions</Label>
              {createForm.role === 'tenant_admin' ? (
                <div className="mt-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-800">
                    <Shield className="w-4 h-4" />
                    <span className="font-medium">Administrator Access</span>
                  </div>
                  <p className="text-sm text-blue-700 mt-1">
                    Tenant administrators automatically have access to all system features and permissions.
                  </p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-3 mt-2 max-h-60 overflow-y-auto border rounded-lg p-4">
                  {AVAILABLE_PERMISSIONS.map((permission) => (
                    <div key={permission.id} className="flex items-start space-x-2">
                      <input
                        type="checkbox"
                        id={permission.id}
                        checked={createForm.permissions.includes(permission.id)}
                        onChange={() => handlePermissionToggle(permission.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <label htmlFor={permission.id} className="text-sm font-medium cursor-pointer">
                          {permission.name}
                        </label>
                        <p className="text-xs text-slate-500">{permission.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createUserMutation.isPending}
                className="flex-1"
              >
                {createUserMutation.isPending ? "Creating..." : "Create User"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User: {selectedUser?.name}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleEditSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Full Name *</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="John Smith"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email Address *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-role">Role</Label>
              <Select value={editForm.role} onValueChange={handleEditRoleChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tenant_admin">Tenant Admin</SelectItem>
                  <SelectItem value="tenant_user">Tenant User</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={editForm.isActive}
                onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, isActive: checked }))}
              />
              <Label>User is active</Label>
            </div>

            <div>
              <Label>Permissions</Label>
              {editForm.role === 'tenant_admin' ? (
                <div className="mt-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-800">
                    <Shield className="w-4 h-4" />
                    <span className="font-medium">Administrator Access</span>
                  </div>
                  <p className="text-sm text-blue-700 mt-1">
                    Tenant administrators automatically have access to all system features and permissions.
                  </p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-3 mt-2 max-h-60 overflow-y-auto border rounded-lg p-4">
                  {AVAILABLE_PERMISSIONS.map((permission) => {
                    const isChecked = (() => {
                      const permissions = editForm.permissions || [];
                      if (Array.isArray(permissions)) {
                        return permissions.includes(permission.id);
                      }
                      return false;
                    })();
                    
                    return (
                      <div key={permission.id} className="flex items-start space-x-2">
                        <input
                          type="checkbox"
                          id={`edit-${permission.id}`}
                          checked={isChecked}
                          onChange={() => handleEditPermissionToggle(permission.id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <label htmlFor={`edit-${permission.id}`} className="text-sm font-medium cursor-pointer">
                            {permission.name}
                          </label>
                          <p className="text-xs text-slate-500">{permission.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateUserMutation.isPending}
                className="flex-1"
              >
                {updateUserMutation.isPending ? "Updating..." : "Update User"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}