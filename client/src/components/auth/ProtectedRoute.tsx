import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'super_admin' | 'tenant_admin' | 'tenant_user';
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredRole = 'tenant_user',
  redirectTo = '/login' 
}: ProtectedRouteProps) {
  const [, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      // Check for super admin token
      const superAdminToken = localStorage.getItem('super_admin_token');
      const regularToken = localStorage.getItem('auth_token');
      
      const token = superAdminToken || regularToken;
      
      if (!token) {
        // Add delay to prevent rapid redirects
        setTimeout(() => setIsAuthenticated(false), 100);
        return;
      }

      try {
        // Decode JWT token to get role
        const payload = JSON.parse(atob(token.split('.')[1]));
        const role = payload.role;
        const exp = payload.exp;
        
        // Check if token is expired
        if (exp && Date.now() >= exp * 1000) {
          localStorage.removeItem('super_admin_token');
          localStorage.removeItem('auth_token');
          // Add delay to prevent rapid redirects and reduce rate limiting
          setTimeout(() => setIsAuthenticated(false), 100);
          return;
        }
        
        setUserRole(role);
        setIsAuthenticated(true);
        
        // Check role permissions
        if (requiredRole === 'super_admin' && role !== 'super_admin') {
          setIsAuthenticated(false);
          return;
        }
        
        // Allow tenant_admin to access tenant_user routes
        if (requiredRole === 'tenant_user' && !['tenant_admin', 'tenant_user'].includes(role)) {
          setIsAuthenticated(false);
          return;
        }
        
        // Allow tenant_admin to access tenant_admin routes
        if (requiredRole === 'tenant_admin' && role !== 'tenant_admin') {
          setIsAuthenticated(false);
          return;
        }
        
      } catch (error) {
        console.error('Error decoding token:', error);
        localStorage.removeItem('super_admin_token');
        localStorage.removeItem('auth_token');
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, [requiredRole]);

  useEffect(() => {
    if (isAuthenticated === false) {
      // Clear any cached data to prevent cross-contamination
      sessionStorage.clear();
      setLocation(redirectTo);
    }
  }, [isAuthenticated, redirectTo, setLocation]);

  // Loading state
  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Authenticated
  return <>{children}</>;
}