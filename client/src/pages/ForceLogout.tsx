import { useEffect } from 'react';
import { useLocation } from 'wouter';
// Using PostgreSQL-based authentication

export default function ForceLogout() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const forceLogout = async () => {
      try {
        console.log('Force logout initiated...');
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
        });
        
        // Clear all storage
        localStorage.clear();
        sessionStorage.clear();
        
        console.log('Force logout successful, redirecting to login');
        setLocation('/login');
      } catch (error) {
        console.error('Force logout error:', error);
        
        // Force clear everything anyway
        localStorage.clear();
        sessionStorage.clear();
        
        // Redirect even if logout failed
        setLocation('/login');
      }
    };

    forceLogout();
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Signing out...</h2>
        <p className="text-gray-600 dark:text-gray-400">Please wait while we clear your session.</p>
      </div>
    </div>
  );
}