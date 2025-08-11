import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';

interface AuthUser {
  id: string;
  email: string;
  isSuperAdmin: boolean;
  currentTenant?: {
    id: string;
    slug: string;
    role: string;
  };
}

export function useAuthRedirect() {
  const [, setLocation] = useLocation();
  
  const { data: authResponse, isLoading } = useQuery<{user: AuthUser}>({
    queryKey: ['/api/auth/me'],
    retry: false,
  });

  const user = authResponse?.user;

  useEffect(() => {
    console.log('useAuthRedirect hook:', { isLoading, user, isSuperAdmin: user?.isSuperAdmin, currentPath: window.location.pathname });
    
    if (isLoading) return;

    // Not authenticated - stay on current page (login/signup/public)
    if (!user) return;

    // Handle super admin routing - they get redirected immediately to admin dashboard
    if (user.isSuperAdmin) {
      const currentPath = window.location.pathname;
      
      // Super admins should NEVER see onboarding, tenant routes, or public pages
      if (!currentPath.startsWith('/admin')) {
        console.log('Super admin redirected from:', currentPath, 'to /admin/dashboard');
        setLocation('/admin/dashboard');
        return;
      }
      
      return;
    }

    // Handle regular user routing
    if (user.currentTenant) {
      const currentPath = window.location.pathname;
      
      // If user is on admin routes, redirect to their tenant
      if (currentPath.startsWith('/admin')) {
        setLocation(`/t/${user.currentTenant.slug}/dashboard`);
        return;
      }
      
      // If user is on public routes after login, redirect to tenant
      if (currentPath === '/' || currentPath === '/login' || currentPath === '/signup') {
        setLocation(`/t/${user.currentTenant.slug}/dashboard`);
        return;
      }
      
      return;
    }

    // User has no tenant - redirect to onboarding
    const currentPath = window.location.pathname;
    if (!currentPath.startsWith('/onboarding') && !currentPath.startsWith('/verify-email')) {
      setLocation('/onboarding');
    }
  }, [user, isLoading, setLocation]);

  return { user, isLoading };
}