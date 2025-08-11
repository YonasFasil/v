import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Building2, Globe, ArrowRight, Sparkles, LogOut } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isSuperAdmin: boolean;
  currentTenant?: {
    id: string;
    slug: string;
    role: string;
  };
}

const tenantSetupSchema = z.object({
  tenantName: z.string().min(2, "Business name must be at least 2 characters"),
  tenantSlug: z.string()
    .min(3, "Slug must be at least 3 characters")
    .max(30, "Slug must be less than 30 characters")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  industry: z.string().min(1, "Please select an industry"),
});

type TenantSetupData = z.infer<typeof tenantSetupSchema>;

const industries = [
  "Wedding Venues",
  "Corporate Events",
  "Party Halls",
  "Conference Centers",
  "Hotels & Resorts",
  "Restaurants & Catering",
  "Event Planning",
  "Other"
];

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/logout");
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Signed out",
        description: "You have been signed out successfully",
      });
      setLocation("/login");
    },
    onError: (error: Error) => {
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Check user info
  const { data: authResponse, isLoading: userLoading } = useQuery<{user: AuthUser}>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const user = authResponse?.user;

  // Super admin should NEVER reach onboarding - this is for tenant setup only
  useEffect(() => {
    if (!userLoading && user?.isSuperAdmin) {
      console.log('Super admin incorrectly reached onboarding, redirecting immediately');
      setLocation('/admin/dashboard');
      return;
    }
  }, [user, userLoading, setLocation]);

  const form = useForm<TenantSetupData>({
    resolver: zodResolver(tenantSetupSchema),
    defaultValues: {
      tenantName: "",
      tenantSlug: "",
      industry: "",
    },
  });

  // Auto-generate slug from business name
  const watchTenantName = form.watch("tenantName");
  
  // Use useEffect to avoid setState during render
  useEffect(() => {
    if (watchTenantName && !form.getValues("tenantSlug")) {
      const slug = watchTenantName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .substring(0, 30);
      form.setValue("tenantSlug", slug);
    }
  }, [watchTenantName, form]);

  const createTenantMutation = useMutation({
    mutationFn: async (data: TenantSetupData) => {
      const response = await apiRequest("POST", "/api/onboarding/create-tenant", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Welcome to VENUIN!",
        description: "Your venue management system is ready to use.",
      });
      // Redirect to tenant app
      setLocation(`/t/${data.tenantSlug}/app`);
    },
    onError: (error: Error) => {
      toast({
        title: "Setup failed",
        description: error.message.includes("409") ? "Business name or URL is already taken" : "Please try again",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TenantSetupData) => {
    createTenantMutation.mutate(data);
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Logout */}
        <div className="flex justify-between items-start mb-8">
          <div className="flex-1" />
          <div className="text-center flex-1">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="h-8 w-8 text-blue-600" />
              <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                VENUIN
              </span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Welcome, {user?.firstName || "there"}!
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Let's set up your venue management system in just a few steps
            </p>
          </div>
          <div className="flex-1 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              className="text-gray-600 hover:text-gray-900"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {logoutMutation.isPending ? "Signing out..." : "Sign out"}
            </Button>
          </div>
        </div>



        {/* Progress */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round((currentStep / totalSteps) * 100)}% complete
            </span>
          </div>
          <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
        </div>

        {/* Main Content */}
        <div className="max-w-2xl mx-auto">
          {currentStep === 1 && (
            <Card className="border-0 shadow-xl">
              <CardHeader className="text-center pb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-2xl">Tell us about your business</CardTitle>
                <CardDescription className="text-lg">
                  We'll use this information to customize your experience
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="tenantName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">Business Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Grand Oak Event Center"
                              className="h-12 text-base"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tenantSlug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">Your VENUIN URL</FormLabel>
                          <FormControl>
                            <div className="flex items-center">
                              <span className="text-gray-500 bg-gray-50 border border-r-0 rounded-l-md px-3 py-3 text-sm">
                                venuin.com/
                              </span>
                              <Input
                                placeholder="grand-oak-events"
                                className="h-12 text-base rounded-l-none"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end">
                      <Button 
                        type="button" 
                        onClick={nextStep}
                        disabled={!form.getValues("tenantName") || !form.getValues("tenantSlug")}
                        className="h-12 px-8"
                      >
                        Continue <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {currentStep === 2 && (
            <Card className="border-0 shadow-xl">
              <CardHeader className="text-center pb-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Globe className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle className="text-2xl">What's your industry?</CardTitle>
                <CardDescription className="text-lg">
                  This helps us provide relevant features and templates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form className="space-y-4">
                    <FormField
                      control={form.control}
                      name="industry"
                      render={({ field }) => (
                        <FormItem>
                          <div className="grid grid-cols-2 gap-3">
                            {industries.map((industry) => (
                              <button
                                key={industry}
                                type="button"
                                onClick={() => {
                                  field.onChange(industry);
                                  nextStep();
                                }}
                                className={`p-4 text-left border rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors ${
                                  field.value === industry 
                                    ? "bg-blue-50 border-blue-200 text-blue-700" 
                                    : "bg-white border-gray-200"
                                }`}
                              >
                                <div className="font-medium">{industry}</div>
                              </button>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-between pt-4">
                      <Button type="button" variant="outline" onClick={prevStep} className="h-12 px-8">
                        Back
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {currentStep === 3 && (
            <Card className="border-0 shadow-xl">
              <CardHeader className="text-center pb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl">Ready to launch!</CardTitle>
                <CardDescription className="text-lg">
                  Let's create your venue management system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-6">
                  <div className="bg-gray-50 rounded-lg p-6 text-left">
                    <h3 className="font-semibold mb-4">Your Setup Summary:</h3>
                    <div className="space-y-2 text-sm">
                      <div><strong>Business:</strong> {form.getValues("tenantName")}</div>
                      <div><strong>URL:</strong> venuin.com/{form.getValues("tenantSlug")}</div>
                      <div><strong>Industry:</strong> {form.getValues("industry")}</div>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={prevStep} className="h-12 px-8">
                      Back
                    </Button>
                    <Button 
                      onClick={() => onSubmit(form.getValues())}
                      disabled={createTenantMutation.isPending}
                      className="h-12 px-8"
                    >
                      {createTenantMutation.isPending ? "Creating..." : "Create My VENUIN System"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}