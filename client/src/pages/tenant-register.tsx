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
import { Building2, User, Mail, Lock, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { apiRequest } from "@/lib/queryClient";

const registerSchema = z.object({
  tenantName: z.string().min(2, "Company name must be at least 2 characters"),
  contactName: z.string().min(2, "Contact name must be at least 2 characters"),
  contactEmail: z.string().email("Please enter a valid email address"),
  contactPhone: z.string().min(10, "Please enter a valid phone number"),
  adminName: z.string().min(2, "Admin name must be at least 2 characters"),
  adminEmail: z.string().email("Please enter a valid email address"),
  passwordOption: z.enum(["custom", "generated"]),
  password: z.string().optional(),
  confirmPassword: z.string().optional()
}).refine(data => {
  if (data.passwordOption === "custom") {
    return data.password && data.password.length >= 6;
  }
  return true;
}, {
  message: "Password must be at least 6 characters",
  path: ["password"]
}).refine(data => {
  if (data.passwordOption === "custom") {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function TenantRegister() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [showGeneratedPassword, setShowGeneratedPassword] = useState(false);

  // Generate a secure random password
  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleGeneratePassword = () => {
    const newPassword = generatePassword();
    setGeneratedPassword(newPassword);
    setShowGeneratedPassword(true);
  };

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      tenantName: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      adminName: "",
      adminEmail: "",
      passwordOption: "custom",
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
          password: data.passwordOption === "generated" ? generatedPassword : data.password,
          isTemporary: data.passwordOption === "generated"
        }
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          setLocation("/tenant/login");
        }, data.passwordOption === "generated" ? 10000 : 2000); // Give more time to copy password
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
              Your tenant account has been successfully created.
            </CardDescription>
          </CardHeader>
          {showGeneratedPassword && generatedPassword && (
            <CardContent>
              <Alert className="mb-4">
                <Lock className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p><strong>Important:</strong> Your temporary password has been generated. Please save it now!</p>
                    <div className="bg-gray-100 p-3 rounded font-mono text-sm break-all">
                      {generatedPassword}
                    </div>
                    <p className="text-sm text-gray-600">
                      You'll need to change this password when you first log in.
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            </CardContent>
          )}
          <CardContent className="text-center">
            <p className="text-sm text-gray-600">
              Redirecting to login page...
            </p>
          </CardContent>
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
              </div>
              
              {/* Password Option */}
              <div className="space-y-4">
                <Label>Password Setup</Label>
                <RadioGroup
                  value={form.watch("passwordOption")}
                  onValueChange={(value: "custom" | "generated") => {
                    form.setValue("passwordOption", value);
                    if (value === "generated") {
                      handleGeneratePassword();
                    } else {
                      setShowGeneratedPassword(false);
                      setGeneratedPassword("");
                    }
                  }}
                  className="flex flex-col space-y-3"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="custom" id="custom" />
                    <Label htmlFor="custom" className="cursor-pointer">I'll set my own password</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="generated" id="generated" />
                    <Label htmlFor="generated" className="cursor-pointer">Generate a secure password for me</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Custom Password Fields */}
              {form.watch("passwordOption") === "custom" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              )}

              {/* Generated Password Display */}
              {form.watch("passwordOption") === "generated" && showGeneratedPassword && (
                <Alert>
                  <Lock className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Generated Password:</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleGeneratePassword}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          New Password
                        </Button>
                      </div>
                      <div className="bg-gray-100 p-3 rounded font-mono text-sm break-all border">
                        {generatedPassword}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Save this password! You'll need to change it when you first log in.
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
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