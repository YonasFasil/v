import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Shield, User, Key, CheckCircle } from "lucide-react";

export default function DevAdmin() {
  const { toast } = useToast();
  const [currentRole, setCurrentRole] = useState<string | null>(null);

  const setDevRole = (role: string) => {
    // Store the role in localStorage for automatic header injection
    localStorage.setItem('dev-admin-role', role);
    setCurrentRole(role);
    
    // Show notification
    toast({
      title: "Development Mode Enabled",
      description: `You are now authenticated as ${role.replace('_', ' ').toUpperCase()}`,
    });

    // Reload the page to apply the new role
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const clearDevRole = () => {
    localStorage.removeItem('dev-admin-role');
    setCurrentRole(null);
    
    toast({
      title: "Development Mode Disabled",
      description: "Returned to normal authentication",
    });
    
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  // Check current dev role from localStorage on component mount
  React.useEffect(() => {
    const savedRole = localStorage.getItem('dev-admin-role');
    if (savedRole) {
      setCurrentRole(savedRole);
    }
  }, []);

  const roleOptions = [
    {
      role: 'super_admin',
      name: 'Super Admin',
      description: 'Full platform access - manage all tenants and system settings',
      color: 'destructive',
      pages: ['Tenant Management', 'All Admin Pages']
    },
    {
      role: 'tenant_admin', 
      name: 'Tenant Admin',
      description: 'Full business tenant access - manage users, venues, operations',
      color: 'default',
      pages: ['Role Permissions', 'Approval Center', 'Audit Logs']
    },
    {
      role: 'manager',
      name: 'Manager',
      description: 'Venue-level management - oversee bookings, staff, operations', 
      color: 'secondary',
      pages: ['Approval Center', 'Some Admin Features']
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Development Authentication</h1>
          <p className="text-gray-600 mt-1">Switch roles to test the admin interface and RBAC system</p>
        </div>
        
        {currentRole && (
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <Badge variant="outline" className="bg-green-50">
                Active: {currentRole.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            <Button variant="outline" onClick={clearDevRole}>
              Clear Role
            </Button>
          </div>
        )}
      </div>

      {/* Warning Card */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Key className="w-5 h-5 text-orange-600" />
            <div>
              <p className="font-medium text-orange-900">Development Mode Only</p>
              <p className="text-sm text-orange-700">
                This authentication bypass only works in development mode. In production, proper authentication will be required.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Status */}
      {currentRole && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Current Authentication Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Role</p>
                <p className="text-lg font-semibold">{currentRole.replace('_', ' ').toUpperCase()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">User ID</p>
                <p className="text-lg font-semibold">dev-{currentRole.replace('_', '-')}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Email</p>
                <p className="text-lg font-semibold">{currentRole.replace('_', '')}@venuin.dev</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Role Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {roleOptions.map((option) => (
          <Card key={option.role} className={currentRole === option.role ? 'border-blue-500 bg-blue-50' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>{option.name}</span>
                </CardTitle>
                <Badge variant={option.color as any}>
                  {option.role}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">{option.description}</p>
              
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Available Pages:</p>
                <div className="flex flex-wrap gap-1">
                  {option.pages.map((page) => (
                    <Badge key={page} variant="outline" className="text-xs">
                      {page}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => setDevRole(option.role)}
                disabled={currentRole === option.role}
                className="w-full"
                variant={currentRole === option.role ? "outline" : "default"}
              >
                {currentRole === option.role ? "Currently Active" : `Login as ${option.name}`}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">1</div>
              <div>
                <p className="font-medium">Select a Role</p>
                <p className="text-gray-600">Choose the role you want to test with from the cards above.</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">2</div>
              <div>
                <p className="font-medium">Automatic Headers</p>
                <p className="text-gray-600">The system will automatically add the "X-Dev-Admin" header to all API requests.</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">3</div>
              <div>
                <p className="font-medium">Access Admin Pages</p>
                <p className="text-gray-600">Navigate to the Administration section in the sidebar to test role-based access.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}