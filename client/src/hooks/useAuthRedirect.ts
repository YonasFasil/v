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
  
  const { data: user, isLoading } = useQuery<AuthUser>({
    queryKey: ['/api/auth/me'],
    retry: false,
  });

  useEffect(() => {
    if (isLoading) return;

    // Not authenticated - stay on current page (login/signup/public)
    if (!user) return;

    // Handle super admin routing
    if (user.isSuperAdmin) {
      const currentPath = window.location.pathname;
      
      // If super admin is on tenant routes, redirect to admin
      if (currentPath.startsWith('/t/') || currentPath === '/') {
        setLocation('/admin/dashboard');
        return;
      }
      
      // If super admin accessed old hidden URLs, redirect to clean URLs
      if (currentPath.includes('sys-admin')) {
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