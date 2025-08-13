import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle, 
  ArrowRight, 
  Building,
  Users,
  Calendar,
  Star,
  Shield,
  Zap
} from "lucide-react";
import { type SubscriptionPackage, type InsertTenant } from "@shared/schema";

interface SignupFormData {
  // Organization details
  organizationName: string;
  subdomain: string;
  
  // Admin user details
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  
  // Selected package
  packageId: string;
  
  // Agreement
  agreeToTerms: boolean;
}

export default function Signup() {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [selectedPackage, setSelectedPackage] = useState<string>("");
  const [formData, setFormData] = useState<SignupFormData>({
    organizationName: "",
    subdomain: "",
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    packageId: "",
    agreeToTerms: false,
  });

  // Fetch available packages
  const { data: packages = [] } = useQuery<SubscriptionPackage[]>({
    queryKey: ["/api/public/packages"],
    select: (data) => data?.filter(pkg => pkg.isActive) || []
  });

  const signupMutation = useMutation({
    mutationFn: (data: SignupFormData) =>
      apiRequest("/api/public/signup", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (response) => {
      toast({ title: "Account created successfully! Welcome aboard!" });
      // Redirect to tenant dashboard or login
      window.location.href = `https://${formData.subdomain}.yourdomain.com/dashboard`;
    },
    onError: (error: any) => {
      toast({ 
        title: "Signup failed", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const validateStep = (currentStep: number) => {
    switch (currentStep) {
      case 1:
        return selectedPackage !== "";
      case 2:
        return formData.organizationName && formData.subdomain;
      case 3:
        return formData.fullName && formData.email && formData.password && 
               formData.password === formData.confirmPassword && formData.agreeToTerms;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(step)) {
      if (step === 1) {
        setFormData(prev => ({ ...prev, packageId: selectedPackage }));
      }
      setStep(step + 1);
    } else {
      toast({ title: "Please complete all required fields", variant: "destructive" });
    }
  };

  const handleSubmit = () => {
    if (validateStep(3)) {
      signupMutation.mutate(formData);
    }
  };

  const getPackageIcon = (packageName: string) => {
    switch (packageName.toLowerCase()) {
      case 'starter': return <Zap className="w-8 h-8 text-blue-600" />;
      case 'professional': return <Building className="w-8 h-8 text-purple-600" />;
      case 'enterprise': return <Shield className="w-8 h-8 text-green-600" />;
      default: return <Star className="w-8 h-8 text-gray-600" />;
    }
  };

  const parseFeatures = (features: any): string[] => {
    if (Array.isArray(features)) return features;
    if (typeof features === 'string') {
      try {
        return JSON.parse(features);
      } catch {
        return [];
      }
    }
    return [];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Start Your Venue Management Journey
          </h1>
          <p className="text-xl text-gray-600">
            Choose your plan and create your account in minutes
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNumber 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step > stepNumber ? <CheckCircle className="w-5 h-5" /> : stepNumber}
                </div>
                {stepNumber < 3 && (
                  <div className={`w-12 h-1 mx-2 ${
                    step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Step 1: Package Selection */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Choose Your Plan</h2>
                <p className="text-gray-600">Select the perfect package for your venue business</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {packages.map((pkg) => (
                  <Card 
                    key={pkg.id} 
                    className={`cursor-pointer transition-all ${
                      selectedPackage === pkg.id 
                        ? 'border-blue-500 ring-2 ring-blue-200' 
                        : 'hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedPackage(pkg.id)}
                  >
                    <CardHeader className="text-center">
                      <div className="flex justify-center mb-4">
                        {getPackageIcon(pkg.name)}
                      </div>
                      <CardTitle className="text-xl">{pkg.name}</CardTitle>
                      <div className="text-3xl font-bold">
                        ${pkg.price}
                        <span className="text-sm font-normal text-gray-600">
                          /{pkg.billingInterval}
                        </span>
                      </div>
                      {pkg.trialDays && (
                        <Badge variant="secondary" className="mt-2">
                          {pkg.trialDays} day free trial
                        </Badge>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center text-sm">
                          <Building className="w-4 h-4 mr-2 text-gray-500" />
                          {pkg.maxVenues} venue{pkg.maxVenues !== 1 ? 's' : ''}
                        </div>
                        <div className="flex items-center text-sm">
                          <Users className="w-4 h-4 mr-2 text-gray-500" />
                          {pkg.maxUsers} team member{pkg.maxUsers !== 1 ? 's' : ''}
                        </div>
                        <div className="flex items-center text-sm">
                          <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                          {pkg.maxBookingsPerMonth} bookings/month
                        </div>
                        
                        {parseFeatures(pkg.features).length > 0 && (
                          <div className="pt-3 border-t">
                            <div className="text-sm font-medium mb-2">Features:</div>
                            <div className="space-y-1">
                              {parseFeatures(pkg.features).slice(0, 3).map((feature) => (
                                <div key={feature} className="flex items-center text-xs text-gray-600">
                                  <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                                  {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {selectedPackage === pkg.id && (
                        <div className="mt-4 p-2 bg-blue-50 rounded text-center">
                          <CheckCircle className="w-5 h-5 text-blue-600 mx-auto" />
                          <div className="text-sm text-blue-600 font-medium">Selected</div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-center">
                <Button 
                  onClick={handleNext} 
                  disabled={!selectedPackage}
                  size="lg"
                  className="px-8"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Organization Details */}
          {step === 2 && (
            <Card className="max-w-lg mx-auto">
              <CardHeader>
                <CardTitle>Organization Details</CardTitle>
                <p className="text-gray-600">Tell us about your venue business</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="organizationName">Organization Name *</Label>
                  <Input
                    id="organizationName"
                    value={formData.organizationName}
                    onChange={(e) => setFormData(prev => ({ ...prev, organizationName: e.target.value }))}
                    placeholder="Your Venue Company"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="subdomain">Choose Your Subdomain *</Label>
                  <div className="flex">
                    <Input
                      id="subdomain"
                      value={formData.subdomain}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') 
                      }))}
                      placeholder="yourcompany"
                      className="rounded-r-none"
                      required
                    />
                    <div className="px-3 py-2 bg-gray-100 border border-l-0 rounded-r text-sm text-gray-600">
                      .yourdomain.com
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    This will be your unique URL: {formData.subdomain || 'yourcompany'}.yourdomain.com
                  </p>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button onClick={handleNext} className="flex-1">
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Account Creation */}
          {step === 3 && (
            <Card className="max-w-lg mx-auto">
              <CardHeader>
                <CardTitle>Create Your Account</CardTitle>
                <p className="text-gray-600">Set up your admin credentials</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="john@yourcompany.com"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="••••••••"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="••••••••"
                    required
                  />
                  {formData.password !== formData.confirmPassword && formData.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, agreeToTerms: !!checked }))}
                  />
                  <Label htmlFor="agreeToTerms" className="text-sm">
                    I agree to the <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a> and{" "}
                    <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a> *
                  </Label>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    Back
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    className="flex-1"
                    disabled={signupMutation.isPending}
                  >
                    {signupMutation.isPending ? "Creating Account..." : "Create Account"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-600">
          <p>Already have an account? <a href="/login" className="text-blue-600 hover:underline">Sign in</a></p>
        </div>
      </div>
    </div>
  );
}