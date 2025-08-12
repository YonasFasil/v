import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, CalendarCheck, Users, DollarSign } from "lucide-react";
import { Redirect } from "wouter";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });

  const { user, loginMutation, registerMutation, isAuthenticated } = useAuth();

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Redirect to="/" />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      loginMutation.mutate({
        username: formData.username,
        password: formData.password,
      });
    } else {
      registerMutation.mutate(formData);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-6xl w-full grid md:grid-cols-2 gap-8 items-center">
        {/* Left side - Form */}
        <div className="w-full max-w-md mx-auto">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">
                {isLogin ? "Sign In" : "Create Account"}
              </CardTitle>
              <CardDescription>
                {isLogin 
                  ? "Enter your credentials to access your venue management dashboard" 
                  : "Create your account to start managing your venue"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4">
                  {!isLogin && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            type="text"
                            value={formData.firstName}
                            onChange={(e) => handleInputChange("firstName", e.target.value)}
                            data-testid="input-firstName"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            type="text"
                            value={formData.lastName}
                            onChange={(e) => handleInputChange("lastName", e.target.value)}
                            data-testid="input-lastName"
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          required={!isLogin}
                          data-testid="input-email"
                        />
                      </div>
                    </>
                  )}
                  <div className="grid gap-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      value={formData.username}
                      onChange={(e) => handleInputChange("username", e.target.value)}
                      required
                      data-testid="input-username"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      required
                      data-testid="input-password"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loginMutation.isPending || registerMutation.isPending}
                  data-testid="button-submit"
                >
                  {(loginMutation.isPending || registerMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isLogin ? "Sign In" : "Create Account"}
                </Button>
              </form>
              <div className="mt-4 text-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setFormData({
                      username: "",
                      email: "",
                      password: "",
                      firstName: "",
                      lastName: "",
                    });
                  }}
                  data-testid="button-toggle-mode"
                >
                  {isLogin 
                    ? "Don't have an account? Create one" 
                    : "Already have an account? Sign in"
                  }
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right side - Hero */}
        <div className="text-center md:text-left space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Venuine
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              Complete venue management system to streamline your event operations, bookings, and customer relationships.
            </p>
          </div>

          <div className="grid gap-6">
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 p-2 rounded-lg">
                <CalendarCheck className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Smart Booking Management</h3>
                <p className="text-gray-600">Manage events, track availability, and handle conflicts with our intelligent booking system.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-green-100 p-2 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Customer Relationship Management</h3>
                <p className="text-gray-600">Keep track of clients, leads, and communications all in one place.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-purple-100 p-2 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Payment & Proposal System</h3>
                <p className="text-gray-600">Create proposals, manage payments, and track revenue with integrated financial tools.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}