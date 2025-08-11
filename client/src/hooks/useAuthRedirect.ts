import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useFirebaseAuth } from './useFirebaseAuth';

export function useAuthRedirect() {
  const [, setLocation] = useLocation();
  const { user, isLoading } = useFirebaseAuth();

  useEffect(() => {
    console.log('useAuthRedirect hook:', { isLoading, user, isSuperAdmin: user?.isSuperAdmin, currentPath: window.location.pathname });
    
    if (isLoading) return;

    // Not authenticated - redirect to login if on protected pages
    if (!user) {
      const currentPath = window.location.pathname;
      // If user is on a protected page (not public pages), redirect to login
      if (!currentPath.startsWith('/login') && 
          !currentPath.startsWith('/signup') && 
          !currentPath.startsWith('/') &&
          !currentPath.startsWith('/features') &&
          !currentPath.startsWith('/pricing') &&
          !currentPath.startsWith('/contact') &&
          !currentPath.startsWith('/terms') &&
          !currentPath.startsWith('/privacy')) {
        console.log('Not authenticated, redirecting to login from:', currentPath);
        setLocation('/login');
      }
      return;
    }

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