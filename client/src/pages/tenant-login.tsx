import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, clearTenantCache } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Building, Eye, EyeOff } from "lucide-react";

export default function TenantLogin() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [credentials, setCredentials] = useState({
    email: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = useMutation({
    mutationFn: (loginData: { email: string; password: string }) =>
      apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(loginData),
      }),
    onSuccess: (response) => {
      // Clear any previous tenant cache to prevent cross-contamination
      clearTenantCache();
      
      // Store auth token
      localStorage.setItem("auth_token", response.token);
      toast({ title: "Login successful", description: `Welcome back, ${response.user.name}!` });
      // Redirect to dashboard
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({ 
        title: "Login failed", 
        description: error.message || "Invalid credentials", 
        variant: "destructive" 
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!credentials.email || !credentials.password) {
      toast({ title: "Please enter both email and password", variant: "destructive" });
      return;
    }
    
    loginMutation.mutate(credentials);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center mb-4">
            <Building className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl">Tenant Login</CardTitle>
          <p className="text-gray-600">Sign in to your venue management dashboard</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={credentials.email}
                onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                placeholder="your.email@example.com"
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>


            <Button 
              type="submit" 
              className="w-full" 
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Button
                variant="link"
                className="p-0 h-auto text-sm"
                onClick={() => setLocation("/signup")}
              >
                Sign up here
              </Button>
            </p>
            
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-gray-500">
                Super Admin?{" "}
                <Button
                  variant="link"
                  className="p-0 h-auto text-xs"
                  onClick={() => setLocation("/super-admin/login")}
                >
                  Admin Login
                </Button>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}