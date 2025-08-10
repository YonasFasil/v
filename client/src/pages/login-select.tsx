import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Users, 
  Settings, 
  CreditCard, 
  Calendar, 
  FileText,
  BarChart3,
  Building2,
  Crown,
  UserCheck
} from "lucide-react";

interface UserRole {
  id: string;
  name: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  permissions: string[];
  color: string;
}

const roles: UserRole[] = [
  {
    id: "admin",
    name: "Admin",
    title: "System Administrator",
    description: "Full access to all features and settings. Can manage staff permissions and view all data.",
    icon: Crown,
    permissions: [
      "All venue management",
      "Customer & booking management", 
      "Payment processing",
      "Staff management",
      "System settings",
      "Reports & analytics",
      "AI insights",
      "BEO management"
    ],
    color: "bg-purple-600 hover:bg-purple-700"
  },
  {
    id: "staff",
    name: "Staff",
    title: "Staff Member",
    description: "Limited access to day-to-day operations as configured by admin. Cannot modify system settings.",
    icon: UserCheck,
    permissions: [
      "View bookings & events",
      "Customer communication",
      "Basic proposal creation",
      "Calendar access",
      "Limited reporting"
    ],
    color: "bg-blue-600 hover:bg-blue-700"
  }
];

export default function LoginSelect() {
  const [, navigate] = useLocation();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const handleRoleSelect = (roleId: string) => {
    // Store the role in localStorage for the session
    localStorage.setItem("userRole", roleId);
    localStorage.setItem("userRoleData", JSON.stringify(roles.find(r => r.id === roleId)));
    
    // Navigate to the main dashboard
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Building2 className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Venuine</h1>
          </div>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Select your role to access the venue management system
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {roles.map((role) => {
            const IconComponent = role.icon;
            const isSelected = selectedRole === role.id;
            
            return (
              <Card 
                key={role.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  isSelected ? 'ring-2 ring-purple-600 shadow-lg' : ''
                }`}
                onClick={() => setSelectedRole(role.id)}
              >
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${role.color} text-white`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{role.name}</CardTitle>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{role.title}</p>
                    </div>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300">{role.description}</p>
                </CardHeader>
                
                <CardContent>
                  <div>
                    <h4 className="font-medium mb-3 text-slate-900 dark:text-slate-100">Available Features:</h4>
                    <div className="space-y-2">
                      {role.permissions.map((permission, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                          <span className="text-sm text-slate-600 dark:text-slate-400">{permission}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Continue Button */}
        <div className="text-center">
          <Button
            onClick={() => selectedRole && handleRoleSelect(selectedRole)}
            disabled={!selectedRole}
            className="px-8 py-3 text-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
          >
            Continue as {selectedRole ? roles.find(r => r.id === selectedRole)?.name : "..."}
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-slate-500 dark:text-slate-400">
          <p>This is a demo environment. In production, proper authentication would be required.</p>
        </div>
      </div>
    </div>
  );
}