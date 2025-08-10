import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit3, Trash2, Users, Check, XCircle, Save } from "lucide-react";
import type { TenantUser } from "@shared/schema";

interface FeatureAccess {
  [key: string]: boolean | number | null;
}

export function UserManagementSection() {
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<TenantUser | null>(null);
  const [newUserData, setNewUserData] = useState({
    name: "",
    email: "",
    role: "staff"
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Assuming we have the tenant ID (in a real app, this would come from auth context)
  const tenantId = "main-account";

  // Fetch tenant users
  const { data: users = [], isLoading } = useQuery<TenantUser[]>({
    queryKey: [`/api/tenant/${tenantId}/users`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/tenant/${tenantId}/users`);
      return Array.isArray(response) ? response : [];
    }
  });

  // Fetch package features for permission display
  const { data: packageFeatures = {} } = useQuery<FeatureAccess>({
    queryKey: [`/api/tenant/${tenantId}/package-features`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/tenant/${tenantId}/package-features`);
      return response || {};
    }
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: (userData: any) => apiRequest("POST", "/api/tenant/users", userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenant/${tenantId}/users`] });
      setIsAddUserOpen(false);
      setNewUserData({ name: "", email: "", role: "staff" });
      toast({ title: "User created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create user", variant: "destructive" });
    }
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      apiRequest("PUT", `/api/tenant/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenant/${tenantId}/users`] });
      setEditingUser(null);
      toast({ title: "User updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update user", variant: "destructive" });
    }
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/tenant/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenant/${tenantId}/users`] });
      toast({ title: "User deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete user", variant: "destructive" });
    }
  });

  const handleCreateUser = () => {
    if (!newUserData.name || !newUserData.email) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }

    createUserMutation.mutate({
      ...newUserData,
      tenantId,
      invitedBy: null, // Would be current user ID in real app
      invitedAt: new Date().toISOString(),
      isActive: true
    });
  };

  const handleUpdateUser = (user: TenantUser, updates: Partial<TenantUser>) => {
    updateUserMutation.mutate({ id: user.id, data: updates });
  };

  const handleDeleteUser = (id: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      deleteUserMutation.mutate(id);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-blue-100 text-blue-800";
      case "staff":
        return "bg-green-100 text-green-800";
      case "viewer":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRolePermissions = (role: string): { [key: string]: boolean } => {
    const basePermissions = {
      "View bookings": true,
      "View venues": true,
      "View reports": role !== "viewer",
      "Manage bookings": role !== "viewer",
      "Create proposals": role !== "viewer" && Boolean(packageFeatures.proposals),
      "Process payments": role !== "viewer" && Boolean(packageFeatures.stripe),
      "Use AI features": role !== "viewer" && Boolean(packageFeatures.ai),
      "Manage venues": role === "admin",
      "Manage users": role === "admin",
      "Access BEO": role !== "viewer" && Boolean(packageFeatures.beo),
      "Lead management": role !== "viewer" && Boolean(packageFeatures.leadManagement)
    };

    return Object.fromEntries(
      Object.entries(basePermissions).filter(([, hasAccess]) => hasAccess !== undefined)
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading users...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-600" />
          User Management
        </CardTitle>
        <p className="text-sm text-slate-600 mt-2">
          Manage user accounts and permissions for your venue
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Users List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Team Members</h3>
            <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={newUserData.name}
                      onChange={(e) => setNewUserData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter user's full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUserData.email}
                      onChange={(e) => setNewUserData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter user's email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={newUserData.role}
                      onValueChange={(value) => setNewUserData(prev => ({ ...prev, role: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateUser} disabled={createUserMutation.isPending}>
                      Create User
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Users List */}
          <div className="border rounded-lg divide-y">
            <div className="p-4 bg-slate-50 border-b">
              <div className="grid grid-cols-4 gap-4 text-sm font-medium text-slate-600">
                <span>Name</span>
                <span>Email</span>
                <span>Role</span>
                <span>Actions</span>
              </div>
            </div>
            
            {Array.isArray(users) && users.map((user: TenantUser) => (
              <div key={user.id} className="p-4">
                <div className="grid grid-cols-4 gap-4 items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {getInitials(user.name)}
                      </span>
                    </div>
                    <span className="font-medium">{user.name}</span>
                  </div>
                  <span className="text-slate-600">{user.email}</span>
                  <Badge className={getRoleColor(user.role)}>{user.role}</Badge>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingUser(user)}
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {(!Array.isArray(users) || users.length === 0) && (
              <div className="p-8 text-center text-slate-500">
                No users found. Add your first team member to get started.
              </div>
            )}
          </div>
        </div>

        {/* Role Permissions */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Role Permissions</h3>
          <p className="text-sm text-slate-600">
            Permissions are automatically assigned based on your subscription package and user roles.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {["admin", "staff", "viewer"].map((role) => (
              <Card key={role}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base capitalize">{role}</CardTitle>
                  <p className="text-sm text-slate-600">
                    {role === "admin" && "Full system access"}
                    {role === "staff" && "Day-to-day operations"}
                    {role === "viewer" && "Read-only access"}
                  </p>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 text-sm">
                    {Object.entries(getRolePermissions(role)).map(([permission, hasAccess]) => (
                      <div key={permission} className="flex items-center gap-2">
                        {hasAccess ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span>{permission}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Edit User Modal */}
        {editingUser && (
          <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="editName">Name</Label>
                  <Input
                    id="editName"
                    value={editingUser.name}
                    onChange={(e) => setEditingUser(prev => prev ? { ...prev, name: e.target.value } : null)}
                    placeholder="Enter user's full name"
                  />
                </div>
                <div>
                  <Label htmlFor="editEmail">Email</Label>
                  <Input
                    id="editEmail"
                    type="email"
                    value={editingUser.email}
                    onChange={(e) => setEditingUser(prev => prev ? { ...prev, email: e.target.value } : null)}
                    placeholder="Enter user's email"
                  />
                </div>
                <div>
                  <Label htmlFor="editRole">Role</Label>
                  <Select
                    value={editingUser.role}
                    onValueChange={(value) => setEditingUser(prev => prev ? { ...prev, role: value } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditingUser(null)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => handleUpdateUser(editingUser, {
                      name: editingUser.name,
                      email: editingUser.email,
                      role: editingUser.role
                    })}
                    disabled={updateUserMutation.isPending}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}