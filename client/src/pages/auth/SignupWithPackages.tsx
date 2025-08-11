import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Calendar, AlertCircle, Eye, EyeOff, Check, Zap, Users, Building, Crown } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

const signupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  packageId: z.string().min(1, "Please select a package"),
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupData = z.infer<typeof signupSchema>;

interface FeaturePackage {
  id: string;
  name: string;
  description: string;
  price: number;
  billingCycle: string;
  features: Record<string, boolean>;
  limits: Record<string, number>;
}

export default function SignupWithPackages() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const { data: packages = [], isLoading: packagesLoading } = useQuery({
    queryKey: ['/api/public/plans'],
  });

  const form = useForm<SignupData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      packageId: "",
      companyName: "",
    },
  });

  const selectedPackage = (packages as FeaturePackage[]).find((pkg: FeaturePackage) => pkg.id === form.watch('packageId'));

  const onSubmit = async (data: SignupData) => {
    setIsSubmitting(true);
    setError("");
    
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Account created!",
          description: "Welcome to VENUIN. Redirecting to your dashboard...",
        });
        // Redirect to tenant dashboard
        if (result.tenant?.slug) {
          setLocation(`/t/${result.tenant.slug}/app`);
        } else {
          setLocation('/');
        }
      } else {
        const result = await response.json();
        setError(result.message || "Failed to create account");
      }
    } catch (error) {
      console.error('Signup error:', error);
      setError("Failed to create account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPackageIcon = (packageId: string) => {
    switch (packageId) {
      case 'starter': return <Building className="w-6 h-6" />;
      case 'professional': return <Zap className="w-6 h-6" />;
      case 'enterprise': return <Crown className="w-6 h-6" />;
      default: return <Building className="w-6 h-6" />;
    }
  };

  const getPackageColor = (packageId: string) => {
    switch (packageId) {
      case 'starter': return 'border-blue-200 bg-blue-50 hover:border-blue-300';
      case 'professional': return 'border-purple-200 bg-purple-50 hover:border-purple-300';
      case 'enterprise': return 'border-orange-200 bg-orange-50 hover:border-orange-300';
      default: return 'border-gray-200 bg-gray-50 hover:border-gray-300';
    }
  };

  const renderPackageSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Choose Your Plan</h2>
        <p className="text-gray-600 mt-2">Select the perfect plan for your venue business</p>
      </div>

      {packagesLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
          ))}
        </div>
      ) : (
        <FormField
          control={form.control}
          name="packageId"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  {(packages as FeaturePackage[]).map((pkg: FeaturePackage) => (
                    <div key={pkg.id} className="relative">
                      <RadioGroupItem
                        value={pkg.id}
                        id={pkg.id}
                        className="sr-only"
                      />
                      <Label
                        htmlFor={pkg.id}
                        className={`block cursor-pointer rounded-lg border-2 p-6 transition-all ${
                          field.value === pkg.id 
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                            : getPackageColor(pkg.id)
                        }`}
                      >
                        <div className="text-center">
                          <div className="flex justify-center mb-4">
                            {getPackageIcon(pkg.id)}
                          </div>
                          <h3 className="text-xl font-semibold">{pkg.name}</h3>
                          <div className="mt-2">
                            <span className="text-3xl font-bold">${pkg.price}</span>
                            <span className="text-gray-500">/{pkg.billingCycle}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-2">{pkg.description}</p>
                          
                          <div className="mt-4 space-y-2">
                            {Object.entries(pkg.features || {})
                              .filter(([_, enabled]) => enabled)
                              .slice(0, 5)
                              .map(([feature, _]) => (
                                <div key={feature} className="flex items-center text-sm">
                                  <Check className="w-4 h-4 text-green-500 mr-2" />
                                  <span className="capitalize">
                                    {feature.replace(/_/g, ' ')}
                                  </span>
                                </div>
                              ))}
                          </div>

                          {pkg.limits && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <div className="text-sm text-gray-600">
                                {pkg.limits.max_bookings_per_month === -1 ? (
                                  <span>Unlimited bookings</span>
                                ) : (
                                  <span>{pkg.limits.max_bookings_per_month} bookings/month</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {field.value === pkg.id && (
                          <div className="absolute top-2 right-2">
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        )}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <div className="flex justify-between">
        <div></div>
        <Button 
          type="button" 
          onClick={() => setCurrentStep(2)}
          disabled={!form.watch('packageId')}
        >
          Continue to Account Details
        </Button>
      </div>
    </div>
  );

  const renderAccountForm = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Create Your Account</h2>
        <p className="text-gray-600 mt-2">
          Set up your account for the <strong>{selectedPackage?.name}</strong> plan
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Enter your first name"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last Name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Enter your last name"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input
                {...field}
                type="email"
                placeholder="Enter your email"
                disabled={isSubmitting}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="companyName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Company Name</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder="Enter your company/venue name"
                disabled={isSubmitting}
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
              <div className="relative">
                <Input
                  {...field}
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password (min 6 characters)"
                  disabled={isSubmitting}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="confirmPassword"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Confirm Password</FormLabel>
            <FormControl>
              <div className="relative">
                <Input
                  {...field}
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  disabled={isSubmitting}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isSubmitting}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="flex justify-between">
        <Button 
          type="button" 
          variant="outline"
          onClick={() => setCurrentStep(1)}
        >
          Back to Plans
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating account..." : "Create Account"}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Calendar className="w-6 h-6" />
            Join VENUIN
          </CardTitle>
          <CardDescription>
            Create your account to start managing your venue
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {currentStep === 1 && renderPackageSelection()}
              {currentStep === 2 && renderAccountForm()}
            </form>
          </Form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-600 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}