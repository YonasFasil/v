import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Building2, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  tenantDomain: z.string().optional()
});

type LoginForm = z.infer<typeof loginSchema>;

export default function TenantLogin() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      tenantDomain: "main-account" // Default for demo
    }
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      return apiRequest("POST", "/api/auth/tenant/login", data);
    },
    onSuccess: (data: any) => {
      if (data.success) {
        // Store session data
        localStorage.setItem("tenantSession", JSON.stringify(data.session));
        localStorage.setItem("tenantUser", JSON.stringify(data.user));
        localStorage.setItem("tenant", JSON.stringify(data.tenant));
        
        toast({
          title: "Login Successful",
          description: `Welcome back, ${data.user.name}!`,
        });

        // Redirect to dashboard
        window.location.href = "/tenant/dashboard";
      }
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsLoading(false);
    }
  });

  const onSubmit = (data: LoginForm) => {
    setIsLoading(true);
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-lg mb-4">
            <Building2 size={24} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Venuine</h1>
          <p className="text-gray-600 dark:text-gray-400">Tenant Account Login</p>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
            <CardDescription>
              Enter your tenant account credentials to access your venue management system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="you@company.com"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter your password"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center space-y-3">
              <Button
                type="button"
                variant="link"
                onClick={() => setLocation("/tenant/register")}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Don't have an account? Create one
              </Button>
              <div>
                <Link href="/" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700">
                  <ArrowLeft size={16} className="mr-1" />
                  Back to Home
                </Link>
              </div>
            </div>

            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">Demo Credentials:</p>
              <p className="text-sm text-blue-600 dark:text-blue-400">Email: john@venuineevents.com</p>
              <p className="text-sm text-blue-600 dark:text-blue-400">Password: demo123</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}