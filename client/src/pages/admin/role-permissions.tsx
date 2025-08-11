import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Shield, Users, Settings, Eye } from "lucide-react";

const ROLES = [
  { value: 'super_admin', label: 'Super Admin', color: 'destructive' },
  { value: 'tenant_admin', label: 'Tenant Admin', color: 'default' },
  { value: 'manager', label: 'Manager', color: 'secondary' },
  { value: 'staff', label: 'Staff', color: 'outline' },
  { value: 'customer', label: 'Customer', color: 'outline' },
];

const RESOURCES = [
  'tenants', 'users', 'venues', 'bookings', 'customers', 'proposals', 
  'payments', 'tasks', 'reports', 'services', 'packages'
];

const ACTIONS = [
  'create', 'read', 'update', 'delete', 'approve', 'refund', 'discount'
];

export default function RolePermissions() {
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState('tenant_admin');
  const [editingPermissions, setEditingPermissions] = useState<Record<string, boolean>>({});

  // Fetch role permissions
  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ["/api/tenant/role-permissions", selectedRole],
    enabled: !!selectedRole,
    retry: false,
  });

  // Update permission mutation
  const updatePermissionMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PUT", `/api/tenant/role-permissions/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenant/role-permissions"] });
      toast({
        title: "Success",
        description: "Permission updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error", 
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePermissionChange = (permission: any, isAllowed: boolean) => {
    updatePermissionMutation.mutate({
      id: permission.id,
      isAllowed,
    });
  };

  // Create permission matrix for display
  const permissionMatrix = RESOURCES.map(resource => {
    const resourcePermissions = ACTIONS.map(action => {
      const permission = permissions.find((p: any) => 
        p.resource === resource && p.action === action
      );
      return {
        resource,
        action,
        permission: permission || null,
        isAllowed: permission?.isAllowed || false,
      };
    });
    return { resource, actions: resourcePermissions };
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Role & Permission Management</h1>
          <p className="text-gray-600 mt-1">Configure role-based access control for your organization</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Label>Role:</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map(role => (
                  <SelectItem key={role.value} value={role.value}>
                    <Badge variant={role.color as any} className="mr-2">
                      {role.label}
                    </Badge>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Role Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Permissions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {permissions.length}
                </p>
              </div>
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Allowed</p>
                <p className="text-2xl font-bold text-green-600">
                  {permissions.filter((p: any) => p.isAllowed).length}
                </p>
              </div>
              <Eye className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Restricted</p>
                <p className="text-2xl font-bold text-red-600">
                  {permissions.filter((p: any) => !p.isAllowed).length}
                </p>
              </div>
              <Settings className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resources</p>
                <p className="text-2xl font-bold text-purple-600">
                  {RESOURCES.length}
                </p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Permission Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Permission Matrix for {ROLES.find(r => r.value === selectedRole)?.label}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">Resource</TableHead>
                  {ACTIONS.map(action => (
                    <TableHead key={action} className="text-center capitalize">
                      {action}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissionMatrix.map(({ resource, actions }) => (
                  <TableRow key={resource}>
                    <TableCell className="font-medium capitalize">
                      <Badge variant="outline">{resource}</Badge>
                    </TableCell>
                    {actions.map(({ action, permission, isAllowed }) => (
                      <TableCell key={`${resource}-${action}`} className="text-center">
                        {permission ? (
                          <Switch
                            checked={isAllowed}
                            onCheckedChange={(checked) => 
                              handlePermissionChange(permission, checked)
                            }
                            disabled={updatePermissionMutation.isPending}
                          />
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Role Descriptions */}
      <Card>
        <CardHeader>
          <CardTitle>Role Descriptions & Hierarchy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ROLES.map(role => (
              <div key={role.value} className="p-4 border rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Badge variant={role.color as any}>{role.label}</Badge>
                </div>
                <p className="text-sm text-gray-600">
                  {role.value === 'super_admin' && 
                    "Full platform access. Can manage all tenants, users, and system settings."
                  }
                  {role.value === 'tenant_admin' && 
                    "Full access within their business tenant. Can manage users, venues, and all business operations."
                  }
                  {role.value === 'manager' && 
                    "Venue-level management. Can oversee bookings, staff, and operations for assigned venues."
                  }
                  {role.value === 'staff' && 
                    "Operational tasks based on role type (sales, events, operations). Limited to assigned responsibilities."
                  }
                  {role.value === 'customer' && 
                    "Self-service access to their own bookings, proposals, and payment information."
                  }
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}