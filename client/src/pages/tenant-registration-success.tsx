import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Mail, Clock, Building2 } from "lucide-react";
import { useLocation } from "wouter";

export default function TenantRegistrationSuccess() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-700">Registration Successful!</CardTitle>
          <CardDescription className="text-lg">
            Your VENUIN account has been created successfully
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start space-x-3">
              <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-800 dark:text-blue-200">Account Under Review</h3>
                <p className="text-sm text-blue-600 dark:text-blue-300">
                  Your account is currently pending approval from our team. This typically takes 1-2 business days.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-start space-x-3">
              <Mail className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-800 dark:text-green-200">Check Your Email</h3>
                <p className="text-sm text-green-600 dark:text-green-300">
                  We've sent you a confirmation email with next steps and additional information about your account.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-center">What happens next?</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-sm font-semibold text-blue-600">1</div>
                <p className="text-sm">Our team reviews your application</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-sm font-semibold text-blue-600">2</div>
                <p className="text-sm">You receive an approval notification via email</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-sm font-semibold text-blue-600">3</div>
                <p className="text-sm">You can log in and start managing your venues</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setLocation("/tenant-login")}
            >
              <Building2 className="h-4 w-4 mr-2" />
              Back to Login
            </Button>
            <Button 
              className="flex-1"
              onClick={() => window.location.href = "mailto:support@venuin.com"}
            >
              <Mail className="h-4 w-4 mr-2" />
              Contact Support
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Need help? Contact us at support@venuin.com or call 1-800-VENUIN
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}