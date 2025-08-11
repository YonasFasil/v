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
// Using PostgreSQL-based authentication

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
  contactName: z.string().min(2, "Contact name must be at least 2 characters"),
  contactEmail: z.string().email("Please enter a valid email address"),
  businessPhone: z.string().min(10, "Please enter a valid phone number"),
  businessAddress: z.string().min(10, "Please enter your business address"),
  businessDescription: z.string().min(10, "Please describe your business in at least 10 characters"),
  featurePackageSlug: z.string().min(1, "Please select a plan"),
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
  const totalSteps = 5;

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      return await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    },
    onSuccess: () => {
      toast({
        title: "Signed out",
        description: "You have been signed out successfully",
      });
      // Redirect to login page after logout
      window.location.href = "/login";
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

  // Use auth API to get user info
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  // Fetch available feature packages (public endpoint)
  const { data: featurePackages, isLoading: packagesLoading } = useQuery<any[]>({
    queryKey: ["/api/public/plans"],
    retry: false,
  });

  // Super admin should NEVER reach onboarding - this is for tenant setup only
  useEffect(() => {
    if (!userLoading && user) {
      console.log('Onboarding: checking user status', { 
        email: user.email, 
        isSuperAdmin: user.isSuperAdmin, 
        type: typeof user.isSuperAdmin 
      });
      
      // Never redirect regular users - they should complete onboarding
      // Only super admin accounts (like yonasfasil.sl@gmail.com) should redirect away
      if (user.isSuperAdmin === true && user.email === 'yonasfasil.sl@gmail.com') {
        console.log('Confirmed super admin at onboarding, redirecting to admin dashboard');
        setLocation('/admin/dashboard');
        return;
      }
      
      console.log('Regular user at onboarding - showing tenant setup form');
    }
  }, [user, userLoading, setLocation]);

  const form = useForm<TenantSetupData>({
    resolver: zodResolver(tenantSetupSchema),
    defaultValues: {
      tenantName: "",
      tenantSlug: "",
      industry: "",
      contactName: "",
      contactEmail: "",
      businessPhone: "",
      businessAddress: "",
      businessDescription: "",
      featurePackageSlug: "",
    },
  });

  // Auto-generate slug from business name
  const watchTenantName = form.watch("tenantName");
  
  // Use useEffect to avoid setState during render
  useEffect(() => {
    if (watchTenantName && watchTenantName.length > 0) {
      const slug = watchTenantName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/^-+|-+$/g, "") // Remove leading/trailing hyphens
        .substring(0, 30);
      
      // Only update if it's different and meets minimum length
      const currentSlug = form.getValues("tenantSlug");
      if (slug !== currentSlug && slug.length >= 3) {
        form.setValue("tenantSlug", slug);
      }
    }
  }, [watchTenantName, form]);

  const createTenantMutation = useMutation({
    mutationFn: async (data: TenantSetupData) => {
      console.log('Sending tenant creation data:', data);
      const response = await apiRequest("POST", "/api/onboarding/create-tenant", data);
      const result = await response.json();
      console.log('Server response:', result);
      return result;
    },
    onSuccess: async (data) => {
      // The server already handles user updates, no need for additional client-side updates
      
      toast({
        title: "Welcome to VENUIN!",
        description: "Your venue management system is ready to use.",
      });
      
      // Redirect to tenant dashboard
      window.location.href = `/t/${data.tenantSlug}/app`;
    },
    onError: (error: Error) => {
      console.error('Tenant creation error:', error);
      let description = "Please try again";
      
      if (error.message.includes("409")) {
        description = "Business name or URL is already taken";
      } else if (error.message.includes("Validation error")) {
        description = "Please check all fields are filled out correctly";
      }
      
      toast({
        title: "Setup failed",
        description: description,
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

  if (userLoading || packagesLoading) {
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

          {/* Step 3: Choose Your Plan */}
          {currentStep === 3 && (
            <Card className="border-0 shadow-xl">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Choose Your Perfect Plan</CardTitle>
                <CardDescription className="text-lg">
                  Select the features that best fit your venue's needs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  {featurePackages?.map((pkg: any) => (
                    <div 
                      key={pkg.id}
                      className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                        form.watch("featurePackageSlug") === pkg.slug
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => form.setValue("featurePackageSlug", pkg.slug)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-xl font-semibold">{pkg.name}</h3>
                            {pkg.popular && (
                              <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                                Most Popular
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 mt-2">{pkg.description}</p>
                          <div className="mt-4">
                            <div className="text-2xl font-bold">${pkg.priceMonthly}/month</div>
                            <div className="text-sm text-gray-500">
                              ${pkg.priceYearly}/year (save ${(pkg.priceMonthly * 12) - pkg.priceYearly})
                            </div>
                          </div>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          form.watch("featurePackageSlug") === pkg.slug
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {form.watch("featurePackageSlug") === pkg.slug && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>
                      </div>
                      
                      {/* Feature highlights */}
                      <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-gray-600">
                        {Object.entries(pkg.features || {})
                          .filter(([, enabled]: [string, any]) => enabled)
                          .slice(0, 6)
                          .map(([feature, ]: [string, any]) => (
                            <div key={feature} className="flex items-center gap-2">
                              <div className="w-4 h-4 text-green-500">✓</div>
                              <span>{feature.replace(/-/g, ' ').replace(/^\w/, c => c.toUpperCase())}</span>
                            </div>
                          ))
                        }
                        {Object.keys(pkg.features || {}).filter(([, enabled]: [string, any]) => enabled).length > 6 && (
                          <div className="text-gray-500 col-span-2">
                            + {Object.keys(pkg.features || {}).filter(([, enabled]: [string, any]) => enabled).length - 6} more features
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <Form {...form}>
                  <FormField
                    control={form.control}
                    name="featurePackageSlug"
                    render={({ field }) => (
                      <FormItem className="mt-4">
                        <FormMessage />
                        <input type="hidden" {...field} />
                      </FormItem>
                    )}
                  />
                </Form>
                
                <div className="flex justify-between mt-8">
                  <Button type="button" variant="outline" onClick={prevStep} className="h-12 px-8">
                    Back
                  </Button>
                  <Button type="button" onClick={nextStep} className="h-12 px-8">
                    Continue
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Business Details */}
          {currentStep === 4 && (
            <Card className="border-0 shadow-xl">
              <CardHeader className="text-center pb-6">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="h-8 w-8 text-orange-600" />
                </div>
                <CardTitle className="text-2xl">Business Details</CardTitle>
                <CardDescription className="text-lg">
                  Tell us more about your business so we can customize your experience
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form className="space-y-6">
                    <FormField
                      control={form.control}
                      name="contactName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">Primary Contact Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="John Smith"
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
                      name="contactEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">Contact Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="john@grandoakevents.com"
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
                      name="businessPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">Business Phone</FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              placeholder="+1 (555) 123-4567"
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
                      name="businessAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">Business Address</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="123 Main Street, City, State 12345"
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
                      name="businessDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">Business Description</FormLabel>
                          <FormControl>
                            <textarea
                              placeholder="Describe your venue, services, and what makes your business special..."
                              className="w-full h-24 px-3 py-3 text-base border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-between">
                      <Button type="button" variant="outline" onClick={prevStep} className="h-12 px-8">
                        Back
                      </Button>
                      <Button 
                        type="button" 
                        onClick={nextStep}
                        disabled={!form.getValues("contactName") || !form.getValues("contactEmail") || !form.getValues("businessPhone") || !form.getValues("businessAddress") || !form.getValues("businessDescription")}
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

          {/* Step 5: Ready to Launch */}
          {currentStep === 5 && (
            <Card className="border-0 shadow-xl">
              <CardHeader className="text-center pb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl">Ready to launch!</CardTitle>
                <CardDescription className="text-lg">
                  Review your information and create your venue management system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-6">
                  <div className="bg-gray-50 rounded-lg p-6 text-left">
                    <h3 className="font-semibold mb-4">Your Setup Summary:</h3>
                    <div className="space-y-3 text-sm">
                      <div><strong>Business:</strong> {form.getValues("tenantName")}</div>
                      <div><strong>URL:</strong> venuin.com/{form.getValues("tenantSlug")}</div>
                      <div><strong>Industry:</strong> {form.getValues("industry")}</div>
                      <div><strong>Plan:</strong> {featurePackages?.find((pkg: any) => pkg.slug === form.getValues("featurePackageSlug"))?.name || form.getValues("featurePackageSlug")}</div>
                      <div><strong>Contact:</strong> {form.getValues("contactName")} ({form.getValues("contactEmail")})</div>
                      <div><strong>Phone:</strong> {form.getValues("businessPhone")}</div>
                      <div><strong>Address:</strong> {form.getValues("businessAddress")}</div>
                      <div><strong>Description:</strong> {form.getValues("businessDescription")}</div>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={prevStep} className="h-12 px-8">
                      Back
                    </Button>
                    <Button 
                      onClick={async () => {
                        const isValid = await form.trigger();
                        if (isValid) {
                          onSubmit(form.getValues());
                        } else {
                          console.log('Form validation errors:', form.formState.errors);
                          toast({
                            title: "Please check your information",
                            description: "Some fields need to be completed correctly before proceeding.",
                            variant: "destructive",
                          });
                        }
                      }}
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