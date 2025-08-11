import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect } from "react";

export function useSuperAdmin() {
  const [, setLocation] = useLocation();
  
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const { data: superAdminData, isLoading: isSuperAdminLoading, error: superAdminError } = useQuery({
    queryKey: ["/api/superadmin/analytics"],
    enabled: !!user,
    retry: false,
  });

  const isSuperAdmin = !!(user as any)?.isSuperAdmin && !superAdminError;
  const isAuthenticated = !!user;

  // Redirect non-super-admins away from super admin routes
  useEffect(() => {
    if (!isLoading && !isSuperAdminLoading) {
      if (!isAuthenticated) {
        setLocation("/sys-admin-login-x7k9p2w4");
        return;
      }
      
      if (!isSuperAdmin && window.location.pathname.includes("sys-admin")) {
        // Redirect regular users away from super admin routes
        setLocation("/");
        return;
      }
    }
  }, [isAuthenticated, isSuperAdmin, isLoading, isSuperAdminLoading, setLocation]);

  return {
    user,
    isSuperAdmin,
    isAuthenticated,
    isLoading: isLoading || isSuperAdminLoading,
    hasAccess: isAuthenticated && isSuperAdmin,
  };
}