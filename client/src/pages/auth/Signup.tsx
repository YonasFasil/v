import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Calendar, AlertCircle, Eye, EyeOff, Check, Star } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const signupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one uppercase letter, one lowercase letter, and one number"),
  companyName: z.string().min(1, "Company name is required"),
  planSlug: z.string().min(1, "Please select a plan"),
  billingInterval: z.enum(["monthly", "yearly"]),
  agreeToTerms: z.boolean().refine((val) => val === true, "You must agree to the terms of service"),
});

type SignupData = z.infer<typeof signupSchema>;

interface Plan {
  id: string;
  name: string;
  slug: string;
  billingModes: {
    monthly: { amount: number; currency: string };
    yearly?: { amount: number; currency: string };
  };
  limits: {
    venues: number;
    staff: number;
    monthlyBookings: number;
  };
  flags: Record<string, boolean>;
  trialDays?: number;
  features?: string[];
}

export default function Signup() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>("");
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");

  const form = useForm<SignupData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      companyName: "",
      planSlug: "",
      billingInterval: "monthly",
      agreeToTerms: false,
    },
  });

  // Watch billing interval changes
  useEffect(() => {
    form.setValue("billingInterval", billingInterval);
  }, [billingInterval, form]);

  // Fetch available plans
  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ["/api/public/plans"],
    retry: false,
  });

  const signupMutation = useMutation({
    mutationFn: async (data: SignupData) => {
      const response = await apiRequest("POST", "/api/auth/signup", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Account created successfully!",
        description: "Please check your email to verify your account before signing in.",
      });
      setLocation("/verify-email-sent");
    },
    onError: (error: Error) => {
      if (error.message.includes("409")) {
        setError("An account with this email already exists");
      } else if (error.message.includes("400")) {
        setError("Please check your information and try again");
      } else {
        setError("An error occurred while creating your account");
      }
    },
  });

  const onSubmit = (data: SignupData) => {
    setError("");
    signupMutation.mutate(data);
  };

  const formatPrice = (amount: number, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount / 100);
  };

  const getYearlyDiscount = (monthly: number, yearly: number) => {
    const monthlyYearly = monthly * 12;
    const discount = ((monthlyYearly - yearly) / monthlyYearly) * 100;
    return Math.round(discount);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Calendar className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">VENUIN</span>
          </div>
          <h1 className="text-3xl font-bold">Start Your Free Trial</h1>
          <p className="text-muted-foreground">Join hundreds of venue owners growing their business with VENUIN</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Signup Form */}
          <Card>
            <CardHeader>
              <CardTitle>Create Your Account</CardTitle>
              <CardDescription>
                Set up your venue management account in minutes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John" {...field} />
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
                            <Input placeholder="Doe" {...field} />
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
                            placeholder="john@company.com"
                            type="email"
                            autoComplete="email"
                            {...field}
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
                        <FormLabel>Company/Venue Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Acme Events" {...field} />
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
                              placeholder="Create a strong password"
                              type={showPassword ? "text" : "password"}
                              autoComplete="new-password"
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
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

                  {!plansLoading && plans.length > 0 && (
                    <FormField
                      control={form.control}
                      name="planSlug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Plan</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose your plan" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {plans.map((plan: Plan) => (
                                <SelectItem key={plan.slug} value={plan.slug}>
                                  {plan.name} - {formatPrice(
                                    billingInterval === "yearly" && plan.billingModes.yearly
                                      ? plan.billingModes.yearly.amount / 12
                                      : plan.billingModes.monthly.amount
                                  )}/month
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="agreeToTerms"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-normal">
                            I agree to the{" "}
                            <Link href="/terms">
                              <a className="text-primary hover:underline">Terms of Service</a>
                            </Link>
                            {" "}and{" "}
                            <Link href="/privacy">
                              <a className="text-primary hover:underline">Privacy Policy</a>
                            </Link>
                          </FormLabel>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={signupMutation.isPending}
                  >
                    {signupMutation.isPending ? "Creating Account..." : "Start Free Trial"}
                  </Button>
                </form>
              </Form>

              <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">Already have an account? </span>
                <Link href="/login">
                  <a className="text-primary hover:underline font-medium">
                    Sign in
                  </a>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Plan Selection */}
          <div className="space-y-6">
            {/* Billing Toggle */}
            <div className="flex items-center justify-center space-x-4">
              <Button
                variant={billingInterval === "monthly" ? "default" : "outline"}
                onClick={() => setBillingInterval("monthly")}
              >
                Monthly
              </Button>
              <Button
                variant={billingInterval === "yearly" ? "default" : "outline"}
                onClick={() => setBillingInterval("yearly")}
              >
                Yearly
                <Badge variant="secondary" className="ml-2">
                  Save 20%
                </Badge>
              </Button>
            </div>

            {/* Plans */}
            <div className="space-y-4">
              {plansLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                  <p className="mt-2 text-muted-foreground">Loading plans...</p>
                </div>
              ) : plans.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Plans are coming soon. Please check back later.
                  </AlertDescription>
                </Alert>
              ) : (
                plans.map((plan: Plan) => {
                  const selectedPlan = form.watch("planSlug") === plan.slug;
                  const monthlyPrice = plan.billingModes.monthly.amount;
                  const yearlyPrice = plan.billingModes.yearly?.amount;
                  const currentPrice = billingInterval === "yearly" && yearlyPrice
                    ? yearlyPrice / 12
                    : monthlyPrice;
                  const discount = yearlyPrice && billingInterval === "yearly"
                    ? getYearlyDiscount(monthlyPrice, yearlyPrice)
                    : 0;

                  return (
                    <Card
                      key={plan.slug}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedPlan ? "ring-2 ring-primary" : ""
                      }`}
                      onClick={() => form.setValue("planSlug", plan.slug)}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{plan.name}</h3>
                              {plan.trialDays && (
                                <Badge variant="outline">
                                  {plan.trialDays} day trial
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-2xl font-bold">
                                {formatPrice(currentPrice)}
                              </span>
                              <span className="text-muted-foreground">/month</span>
                              {discount > 0 && (
                                <Badge variant="secondary">
                                  {discount}% off
                                </Badge>
                              )}
                            </div>
                            
                            <div className="mt-4 space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-500" />
                                <span>{plan.limits.venues} venue{plan.limits.venues !== 1 ? 's' : ''}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-500" />
                                <span>{plan.limits.staff} team member{plan.limits.staff !== 1 ? 's' : ''}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-500" />
                                <span>{plan.limits.monthlyBookings} bookings/month</span>
                              </div>
                              {plan.features?.map((feature, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <Check className="h-4 w-4 text-green-500" />
                                  <span>{feature}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          {selectedPlan && (
                            <div className="text-primary">
                              <Check className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>

            {/* Trust Indicators */}
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="font-semibold">Trusted by 500+ venue owners</p>
                  <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Check className="h-4 w-4 text-green-500" />
                      14-day free trial
                    </div>
                    <div className="flex items-center gap-1">
                      <Check className="h-4 w-4 text-green-500" />
                      No setup fees
                    </div>
                    <div className="flex items-center gap-1">
                      <Check className="h-4 w-4 text-green-500" />
                      Cancel anytime
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/">
            <a className="text-sm text-muted-foreground hover:text-foreground">
              ← Back to homepage
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
}