import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link, useLocation } from "wouter";
import {
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  ArrowRight,
  RefreshCw,
  AlertCircle
} from "lucide-react";

interface VerificationResult {
  message: string;
  success?: boolean;
  alreadyVerified?: boolean;
  expired?: boolean;
  customer?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    isVerified: boolean;
  };
}

export default function CustomerVerifyEmail() {
  const [, setLocation] = useLocation();
  const [urlParams, setUrlParams] = useState<URLSearchParams | null>(null);

  useEffect(() => {
    setUrlParams(new URLSearchParams(window.location.search));
  }, []);

  const token = urlParams?.get('token');

  const { data: result, isLoading, error } = useQuery<VerificationResult>({
    queryKey: [`/api/public/auth/verify-email?token=${token}`],
    queryFn: () => apiRequest(`/api/public/auth/verify-email?token=${token}`),
    enabled: !!token,
    retry: false
  });

  const getStatusIcon = () => {
    if (isLoading) {
      return <RefreshCw className="w-16 h-16 text-blue-500 animate-spin" />;
    }

    if (error) {
      return <XCircle className="w-16 h-16 text-red-500" />;
    }

    if (result?.success || result?.alreadyVerified) {
      return <CheckCircle className="w-16 h-16 text-green-500" />;
    }

    if (result?.expired) {
      return <Clock className="w-16 h-16 text-yellow-500" />;
    }

    return <AlertCircle className="w-16 h-16 text-red-500" />;
  };

  const getStatusMessage = () => {
    if (isLoading) {
      return {
        title: "Verifying your email...",
        description: "Please wait while we verify your email address."
      };
    }

    if (error) {
      return {
        title: "Verification Failed",
        description: "There was an error verifying your email address. Please try again or contact support."
      };
    }

    if (result?.success) {
      return {
        title: "Email Verified Successfully!",
        description: `Welcome to VenuinePro, ${result.customer?.firstName}! Your email has been verified and you can now login to your account.`
      };
    }

    if (result?.alreadyVerified) {
      return {
        title: "Already Verified",
        description: "Your email address has already been verified. You can login to your account."
      };
    }

    if (result?.expired) {
      return {
        title: "Verification Link Expired",
        description: "Your verification link has expired. Please request a new verification email."
      };
    }

    return {
      title: "Verification Failed",
      description: result?.message || "Invalid or expired verification token."
    };
  };

  const statusInfo = getStatusMessage();

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <XCircle className="w-16 h-16 text-red-500" />
              </div>
              <CardTitle>Invalid Verification Link</CardTitle>
              <CardDescription>
                The verification link is missing required information
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-6">
                This verification link appears to be invalid or corrupted. Please check your email and try clicking the verification link again.
              </p>
              <div className="space-y-3">
                <Link href="/customer/login">
                  <Button className="w-full">
                    Go to Login
                  </Button>
                </Link>
                <Link href="/customer/signup">
                  <Button variant="outline" className="w-full">
                    Create New Account
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-blue-600">
            VenuinePro
          </Link>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Email Verification
          </h2>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {getStatusIcon()}
            </div>
            <CardTitle>{statusInfo.title}</CardTitle>
            <CardDescription>
              {statusInfo.description}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {result?.success && (
              <Alert className="mb-6 border-green-200 bg-green-50">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Your account is now fully activated! You can explore venues, send inquiries, and manage your bookings.
                </AlertDescription>
              </Alert>
            )}

            {result?.expired && (
              <Alert className="mb-6 border-yellow-200 bg-yellow-50">
                <Clock className="w-4 h-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  Verification links expire after 24 hours for security. You'll need to request a new verification email.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              {(result?.success || result?.alreadyVerified) && (
                <>
                  <Link href="/customer/login">
                    <Button className="w-full">
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Login to Your Account
                    </Button>
                  </Link>
                  <Link href="/explore/venues">
                    <Button variant="outline" className="w-full">
                      Explore Venues
                    </Button>
                  </Link>
                </>
              )}

              {result?.expired && (
                <>
                  <Button className="w-full" disabled>
                    <Mail className="w-4 h-4 mr-2" />
                    Request New Verification Email
                  </Button>
                  <p className="text-sm text-gray-600 text-center">
                    Feature coming soon. Please contact support for a new verification email.
                  </p>
                </>
              )}

              {(error || (!result?.success && !result?.alreadyVerified && !result?.expired)) && (
                <>
                  <Link href="/customer/signup">
                    <Button className="w-full">
                      Create New Account
                    </Button>
                  </Link>
                  <Link href="/customer/login">
                    <Button variant="outline" className="w-full">
                      Try to Login
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Help section */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-3">
                  Need help with verification?
                </p>
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">
                    • Check your spam/junk folder for the verification email
                  </p>
                  <p className="text-xs text-gray-500">
                    • Make sure you clicked the most recent verification link
                  </p>
                  <p className="text-xs text-gray-500">
                    • Verification links expire after 24 hours
                  </p>
                </div>
                <div className="mt-4">
                  <Link href="/explore/venues" className="text-sm text-blue-600 hover:text-blue-500">
                    Continue browsing venues →
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}