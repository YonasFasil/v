import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { signInWithEmailPassword } from '@/lib/firebase';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { Calendar, LogIn } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function FirebaseLogin() {
  const [, setLocation] = useLocation();
  const { user, isLoading } = useFirebaseAuth();

  // This component is deprecated - use /login instead

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && user) {
      setLocation('/firebase-dashboard');
    }
  }, [user, isLoading, setLocation]);

  const handleEmailSignIn = async () => {
    try {
      // This is a deprecated component - redirect to new login
      setLocation('/login');
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
            Sign in with Google to access your venue management dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleGoogleSignIn}
            className="w-full flex items-center gap-2"
            size="lg"
          >
            <LogIn className="h-5 w-5" />
            Sign in with Google
          </Button>
          
          {/* Status Message */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Firebase Setup Status:</strong> 
              {import.meta.env.VITE_FIREBASE_API_KEY ? 
                " ✅ Firebase configured and ready!" : 
                " ⚠️ Waiting for Firebase configuration..."
              }
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}