import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { logOut } from '@/lib/firebase';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { Calendar, LogOut, User, Mail, Shield, CheckCircle, XCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function FirebaseDashboard() {
  const [, setLocation] = useLocation();
  const { user, isLoading } = useFirebaseAuth();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      setLocation('/firebase-login');
    }
  }, [user, isLoading, setLocation]);

  const handleSignOut = async () => {
    try {
      await logOut();
      toast({
        title: "Signed out",
        description: "You have been signed out successfully",
      });
      setLocation('/firebase-login');
    } catch (error: any) {
      toast({
        title: "Sign out failed",
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

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Calendar className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-semibold text-gray-900">VENUIN</span>
              <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                Firebase Powered
              </span>
            </div>
            <Button onClick={handleSignOut} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* User Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                User Profile
              </CardTitle>
              <CardDescription>
                Your Firebase authentication information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                  <AvatarFallback>
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-medium">{user.displayName || 'Anonymous User'}</h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {user.email}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Email Verified</span>
                  <div className="flex items-center gap-1">
                    {user.emailVerified ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-600">Verified</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="text-sm text-red-600">Not Verified</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">User ID</span>
                  <span className="text-sm text-gray-500 font-mono">{user.uid}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Firebase Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Firebase Integration
              </CardTitle>
              <CardDescription>
                Firebase services status and configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="text-sm font-medium text-green-800">Authentication</div>
                  <div className="text-xs text-green-600">Active</div>
                </div>
                <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <CheckCircle className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-sm font-medium text-blue-800">Firestore</div>
                  <div className="text-xs text-blue-600">Connected</div>
                </div>
              </div>

              <div className="pt-4 border-t space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Project ID</span>
                  <span className="text-sm text-gray-500 font-mono">
                    {import.meta.env.VITE_FIREBASE_PROJECT_ID || 'Not configured'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">API Key</span>
                  <span className="text-sm text-gray-500 font-mono">
                    {import.meta.env.VITE_FIREBASE_API_KEY ? 
                      `${import.meta.env.VITE_FIREBASE_API_KEY.substring(0, 10)}...` : 
                      'Not configured'
                    }
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Success Message */}
        <div className="mt-6">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <h3 className="font-medium text-green-800">
                    🎉 Firebase Migration Successful!
                  </h3>
                  <p className="text-sm text-green-700 mt-1">
                    Your VENUIN application is now powered by Firebase Authentication. 
                    The complex authentication issues have been resolved with Google's robust infrastructure.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </main>
    </div>
  );
}