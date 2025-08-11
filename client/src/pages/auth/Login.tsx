import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { signInWithGoogle, handleAuthRedirect } from '@/lib/firebase';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { Calendar, LogIn } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function Login() {
  const [, setLocation] = useLocation();
  const { user, isLoading } = useFirebaseAuth();

  // Handle redirect result on page load
  useEffect(() => {
    handleAuthRedirect()
      .then((result) => {
        if (result?.user) {
          console.log('Redirect result user:', result.user);
          toast({
            title: "Welcome!",
            description: `Signed in as ${result.user.displayName || result.user.email}`,
          });
          
          // Check if user is super admin by email
          const userEmail = result.user.email;
          console.log('Checking user email:', userEmail);
          if (userEmail === 'yonasfasil.sl@gmail.com') {
            console.log('Super admin login detected, redirecting to /admin/dashboard');
            setLocation('/admin/dashboard');
          } else {
            console.log('Regular user login, redirecting to /onboarding');
            setLocation('/onboarding');
          }
        }
      })
      .catch((error) => {
        console.error('Auth redirect error:', error);
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive",
        });
      });
  }, [setLocation]);

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && user) {
      console.log('User authenticated via Firebase:', user);
      const userEmail = user.email;
      if (userEmail === 'yonasfasil.sl@gmail.com') {
        console.log('Super admin detected, redirecting to /admin/dashboard');
        setLocation('/admin/dashboard');
      } else {
        console.log('Regular user, redirecting to /onboarding');
        setLocation('/onboarding');
      }
    }
  }, [user, isLoading, setLocation]);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Calendar className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to VENUIN</CardTitle>
          <CardDescription>
            Sign in with Google to access your venue management platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleGoogleSignIn} 
            className="w-full" 
            size="lg"
          >
            <LogIn className="mr-2 h-4 w-4" />
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}