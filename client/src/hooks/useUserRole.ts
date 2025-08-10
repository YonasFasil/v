import { useState, useEffect } from "react";

export interface UserRoleData {
  id: string;
  name: string;
  title: string;
  description: string;
  permissions: string[];
  color: string;
}

export function useUserRole() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userRoleData, setUserRoleData] = useState<UserRoleData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user has already selected a role
    const savedRole = localStorage.getItem("userRole");
    const savedRoleData = localStorage.getItem("userRoleData");
    
    if (savedRole && savedRoleData) {
      setUserRole(savedRole);
      try {
        setUserRoleData(JSON.parse(savedRoleData));
      } catch (error) {
        console.error("Failed to parse user role data:", error);
        localStorage.removeItem("userRole");
        localStorage.removeItem("userRoleData");
      }
    }
    
    setIsLoading(false);
  }, []);

  const isSuperAdmin = userRole === "super_admin";
  const isAdmin = userRole === "admin";
  const isStaff = userRole === "staff";
  const isAuthenticated = !!userRole;

  const logout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("userRoleData");
    setUserRole(null);
    setUserRoleData(null);
    window.location.href = "/login";
  };

  const hasPermission = (feature: string): boolean => {
    if (isSuperAdmin || isAdmin) return true; // Super Admin and Admin have all permissions
    
    if (!userRoleData) return false;
    
    // Define staff permissions mapping
    const staffPermissions: Record<string, boolean> = {
      // Core access
      "view_dashboard": true,
      "view_bookings": true,
      "view_calendar": true,
      "view_customers": true,
      
      // Limited modification
      "create_bookings": true,
      "edit_bookings": true,
      "create_proposals": true,
      "customer_communication": true,
      
      // Restricted access
      "manage_venues": false,
      "manage_staff": false,
      "system_settings": false,
      "payment_settings": false,
      "advanced_reports": false,
      "ai_insights": false,
      "manage_services": false,
      "manage_packages": false,
      "tax_settings": false,
      "beo_templates": false,
      
      // Read-only access
      "view_services": true,
      "view_packages": true,
      "view_venues": true,
      "basic_reports": true
    };

    return staffPermissions[feature] ?? false;
  };

  return {
    userRole,
    userRoleData,
    isLoading,
    isAuthenticated,
    isSuperAdmin,
    isAdmin,
    isStaff,
    hasPermission,
    logout
  };
}