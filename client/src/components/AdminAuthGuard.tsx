import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useEffect, ReactNode } from 'react';

interface AdminAuthGuardProps {
  children: ReactNode;
}

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const [, setLocation] = useLocation();
  
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['/api/auth/me'],
    retry: false,
  });

  useEffect(() => {
    if (isLoading) return;

    // Not authenticated - redirect to login
    if (!user || error) {
      setLocation('/login');
      return;
    }

    // Not super admin - redirect to home or tenant dashboard
    if (!(user as any).isSuperAdmin) {
      if ((user as any).currentTenant) {
        setLocation(`/t/${(user as any).currentTenant.slug}/dashboard`);
      } else {
        setLocation('/');
      }
      return;
    }
  }, [user, isLoading, error, setLocation]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Don't render anything while redirecting
  if (!user || !(user as any).isSuperAdmin) {
    return null;
  }

  // User is authenticated and is super admin
  return <>{children}</>;
}