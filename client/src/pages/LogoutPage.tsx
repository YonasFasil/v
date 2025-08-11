import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { logOut } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export default function LogoutPage() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Auto logout when page loads
    handleLogout();
  }, []);

  const handleLogout = async () => {
    try {
      await logOut();
      console.log('Successfully logged out');
      setTimeout(() => {
        setLocation('/login');
      }, 1500);
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if logout fails
      setTimeout(() => {
        setLocation('/login');
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <LogOut className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Signing out...</CardTitle>
          <CardDescription>
            Please wait while we sign you out safely.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <Button 
            onClick={() => setLocation('/login')} 
            variant="outline"
            className="mt-4"
          >
            Go to Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}