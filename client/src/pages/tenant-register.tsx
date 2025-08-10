import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Building2, User, Mail, Lock, AlertCircle, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const registerSchema = z.object({
  tenantName: z.string().min(2, "Company name must be at least 2 characters"),
  contactName: z.string().min(2, "Contact name must be at least 2 characters"),
  contactEmail: z.string().email("Please enter a valid email address"),
  contactPhone: z.string().min(10, "Please enter a valid phone number"),
  adminName: z.string().min(2, "Admin name must be at least 2 characters"),
  adminEmail: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password")
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function TenantRegister() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      tenantName: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      adminName: "",
      adminEmail: "",
      password: "",
      confirmPassword: ""
    }
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    setError("");
    
    try {
      const response = await apiRequest("POST", "/api/auth/tenant/register", {
        tenant: {
          name: data.tenantName,
          contactName: data.contactName,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone
        },
        admin: {
          name: data.adminName,
          email: data.adminEmail,
          password: data.password
        }
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          setLocation("/tenant/login");
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Registration failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-700">Account Created!</CardTitle>
            <CardDescription>
              Your tenant account has been successfully created. Redirecting to login...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Building2 className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Create Your Venue Account</CardTitle>
          <CardDescription>
            Set up your venue management account to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Company Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tenantName">Company Name</Label>
                  <Input
                    id="tenantName"
                    placeholder="Your Venue Company"
                    {...form.register("tenantName")}
                  />
                  {form.formState.errors.tenantName && (
                    <p className="text-sm text-red-600">{form.formState.errors.tenantName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactName">Contact Person</Label>
                  <Input
                    id="contactName"
                    placeholder="Primary contact name"
                    {...form.register("contactName")}
                  />
                  {form.formState.errors.contactName && (
                    <p className="text-sm text-red-600">{form.formState.errors.contactName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Company Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="company@example.com"
                    {...form.register("contactEmail")}
                  />
                  {form.formState.errors.contactEmail && (
                    <p className="text-sm text-red-600">{form.formState.errors.contactEmail.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Phone Number</Label>
                  <Input
                    id="contactPhone"
                    placeholder="+1 (555) 123-4567"
                    {...form.register("contactPhone")}
                  />
                  {form.formState.errors.contactPhone && (
                    <p className="text-sm text-red-600">{form.formState.errors.contactPhone.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Admin Account */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <User className="h-5 w-5" />
                Admin Account
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="adminName">Admin Name</Label>
                  <Input
                    id="adminName"
                    placeholder="Your full name"
                    {...form.register("adminName")}
                  />
                  {form.formState.errors.adminName && (
                    <p className="text-sm text-red-600">{form.formState.errors.adminName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Admin Email</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    placeholder="your.email@example.com"
                    {...form.register("adminEmail")}
                  />
                  {form.formState.errors.adminEmail && (
                    <p className="text-sm text-red-600">{form.formState.errors.adminEmail.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a secure password"
                    {...form.register("password")}
                  />
                  {form.formState.errors.password && (
                    <p className="text-sm text-red-600">{form.formState.errors.password.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    {...form.register("confirmPassword")}
                  />
                  {form.formState.errors.confirmPassword && (
                    <p className="text-sm text-red-600">{form.formState.errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Account...
                  </>
                ) : (
                  <>
                    <Building2 className="mr-2 h-4 w-4" />
                    Create Account
                  </>
                )}
              </Button>
              
              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setLocation("/tenant/login")}
                  className="text-sm"
                >
                  Already have an account? Sign in
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}