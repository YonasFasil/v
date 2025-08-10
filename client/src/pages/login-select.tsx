import { useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, UserCheck, Building2, LogOut } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";

export default function LoginSelect() {
  const [, setLocation] = useLocation();
  const { setUserRole, logout, userRole } = useUserRole();
  
  // Clear any existing role when component mounts
  useEffect(() => {
    if (userRole) {
      logout();
    }
  }, []);

  const roles = [
    {
      id: "super-admin",
      name: "Super Admin",
      title: "Platform Administrator",
      description: "Manage all tenant accounts and platform settings",
      icon: Crown,
      color: "from-purple-600 to-pink-600",
      textColor: "text-purple-600",
      permissions: [
        "Tenant Management",
        "Feature Package Control", 
        "Platform Analytics",
        "System Configuration"
      ]
    },
    {
      id: "admin",
      name: "Admin",
      title: "Venue Administrator",
      description: "Full access to venue management and settings",
      icon: Crown,
      color: "from-blue-600 to-purple-600",
      textColor: "text-purple-600",
      permissions: [
        "User Management",
        "Venue Configuration",
        "Financial Reports",
        "System Settings"
      ]
    },
    {
      id: "staff",
      name: "Staff",
      title: "Venue Staff",
      description: "Day-to-day operations and customer management",
      icon: UserCheck,
      color: "from-green-600 to-blue-600",
      textColor: "text-blue-600",
      permissions: [
        "Event Management",
        "Customer Service",
        "Booking Operations",
        "Basic Reports"
      ]
    }
  ];

  const handleRoleSelect = (roleId: string) => {
    console.log("Setting user role to:", roleId);
    setUserRole(roleId);
    
    // Add a small delay to ensure state is updated before navigation
    setTimeout(() => {
      console.log("Navigating to dashboard");
      setLocation("/");
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">V</span>
            </div>
            <span className="ml-3 text-3xl font-bold text-slate-900">Venuine</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Select Your Role</h1>
          <p className="text-slate-600">Choose how you'd like to access the platform</p>
        </div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <Card key={role.id} className="relative overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => handleRoleSelect(role.id)}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={`w-8 h-8 ${role.textColor}`} />
                    <Badge className={`bg-gradient-to-r ${role.color} text-white border-0`}>
                      {role.name}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-semibold text-slate-900">
                    {role.name}
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    {role.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-slate-900 mb-2">Key Permissions</h4>
                      <ul className="space-y-1">
                        {role.permissions.map((permission, index) => (
                          <li key={index} className="text-sm text-slate-600 flex items-center">
                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full mr-2"></div>
                            {permission}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <Button 
                      className={`w-full bg-gradient-to-r ${role.color} hover:opacity-90 text-white border-0 group-hover:scale-105 transition-transform`}
                      onClick={() => handleRoleSelect(role.id)}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      Continue as {role.name}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Demo Note */}
        <div className="text-center mt-8 p-4 bg-white/50 backdrop-blur-sm rounded-lg border border-slate-200">
          <p className="text-sm text-slate-600">
            <strong>Demo Mode:</strong> This is a demonstration of the multi-tenant SaaS platform. 
            In a real deployment, authentication would be handled through secure login systems.
          </p>
          {userRole && (
            <div className="mt-3">
              <Button variant="outline" size="sm" onClick={logout} className="text-slate-600">
                <LogOut className="w-4 h-4 mr-2" />
                Clear Current Session ({userRole})
              </Button>
            </div>
          )}
        </div>

        {/* Tenant Login Section */}
        <div className="mt-6 pt-6 border-t border-slate-200">
          <div className="text-center">
            <p className="text-sm text-slate-600 mb-4 font-medium">
              Multi-Tenant Login
            </p>
            <Button
              variant="outline"
              onClick={() => setLocation("/tenant/login")}
              className="w-full max-w-md mx-auto border-slate-300 hover:border-blue-500 hover:text-blue-600"
            >
              <Building2 className="h-4 w-4 mr-2" />
              Tenant Account Login
            </Button>
            <p className="text-xs text-slate-500 mt-2">
              For tenant accounts created by Super Admin
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}