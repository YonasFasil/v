import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Mail, ArrowRight } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function EmailVerification() {
  const [location, navigate] = useLocation();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('No verification token provided');
      return;
    }

    // Verify email
    const verifyEmail = async () => {
      try {
        const response = await apiRequest('GET', `/api/auth/verify-email?token=${token}`);
        const data = await response.json();
        
        if (response.ok) {
          setStatus('success');
          setMessage(data.message || 'Email verified successfully');
        } else {
          setStatus('error');
          setMessage(data.message || 'Verification failed');
        }
      } catch (error) {
        setStatus('error');
        setMessage('Failed to verify email. Please try again.');
      }
    };

    verifyEmail();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === 'verifying' && (
              <div className="animate-spin w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
            )}
            {status === 'success' && (
              <CheckCircle className="w-12 h-12 text-green-600" />
            )}
            {status === 'error' && (
              <XCircle className="w-12 h-12 text-red-600" />
            )}
          </div>
          
          <CardTitle className="text-2xl">
            {status === 'verifying' && 'Verifying Email...'}
            {status === 'success' && 'Email Verified!'}
            {status === 'error' && 'Verification Failed'}
          </CardTitle>
          
          <CardDescription>
            {status === 'verifying' && 'Please wait while we verify your email address.'}
            {status === 'success' && 'Your email has been successfully verified. You can now sign in to your account.'}
            {status === 'error' && message}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {status === 'success' && (
            <Link href="/login">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Sign In to Your Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          )}
          
          {status === 'error' && (
            <div className="space-y-3">
              <Link href="/signup">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Try Signing Up Again
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              
              <Link href="/contact">
                <Button variant="outline" className="w-full">
                  Contact Support
                  <Mail className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}
          
          <div className="text-center pt-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                ← Back to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}