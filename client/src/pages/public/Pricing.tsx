import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Calendar, 
  Check,
  Star,
  ArrowRight,
  CheckCircle,
  AlertCircle
} from "lucide-react";

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

export default function Pricing() {
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");

  const { data: plans = [], isLoading, error } = useQuery({
    queryKey: ["/api/public/plans"],
    retry: false,
  });

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

  const getFeatureList = (plan: Plan) => {
    const features = [
      `${plan.limits.venues} venue${plan.limits.venues !== 1 ? 's' : ''}`,
      `${plan.limits.staff} team member${plan.limits.staff !== 1 ? 's' : ''}`,
      `${plan.limits.monthlyBookings} bookings per month`,
      'Smart booking management',
      'Customer relationship management',
      'Professional proposals',
      'Secure payment processing',
      'Real-time analytics',
    ];

    // Add plan-specific features based on flags
    if (plan.flags.aiFeatures) {
      features.push('AI-powered automation');
    }
    if (plan.flags.multiVenue) {
      features.push('Multi-venue management');
    }
    if (plan.flags.advancedReporting) {
      features.push('Advanced reporting');
    }
    if (plan.flags.apiAccess) {
      features.push('API access');
    }
    if (plan.flags.customBranding) {
      features.push('Custom branding');
    }
    if (plan.flags.prioritySupport) {
      features.push('Priority support');
    }

    return features;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">VENUIN</span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/">
              <a className="text-muted-foreground hover:text-foreground transition-colors">Home</a>
            </Link>
            <Link href="/features">
              <a className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
            </Link>
            <Link href="/pricing">
              <a className="text-foreground font-medium">Pricing</a>
            </Link>
            <Link href="/contact">
              <a className="text-muted-foreground hover:text-foreground transition-colors">Contact</a>
            </Link>
            <Link href="/login">
              <a className="text-muted-foreground hover:text-foreground transition-colors">Sign In</a>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Choose the perfect plan for your venue. Start with a free trial, 
            scale as you grow, and only pay for what you need.
          </p>
          <div className="flex items-center justify-center gap-1 mb-8">
            {[1,2,3,4,5].map(i => (
              <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            ))}
            <span className="ml-2 text-sm text-muted-foreground">4.9/5 from 200+ venue owners</span>
          </div>
        </div>
      </section>

      {/* Billing Toggle */}
      <section className="container mx-auto px-4 pb-8">
        <div className="flex items-center justify-center space-x-4">
          <Button
            variant={billingInterval === "monthly" ? "default" : "outline"}
            onClick={() => setBillingInterval("monthly")}
            className="px-6"
          >
            Monthly
          </Button>
          <Button
            variant={billingInterval === "yearly" ? "default" : "outline"}
            onClick={() => setBillingInterval("yearly")}
            className="px-6"
          >
            Yearly
            <Badge variant="secondary" className="ml-2">
              Save up to 20%
            </Badge>
          </Button>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="container mx-auto px-4 pb-16">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="mt-4 text-muted-foreground">Loading pricing plans...</p>
          </div>
        ) : error || plans.length === 0 ? (
          <div className="max-w-2xl mx-auto">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error ? "Error loading pricing plans. Please try again later." : 
                "Pricing plans are coming soon. Please check back later or contact us for early access."}
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {plans.map((plan: Plan, index: number) => {
              const monthlyPrice = plan.billingModes.monthly.amount;
              const yearlyPrice = plan.billingModes.yearly?.amount;
              const currentPrice = billingInterval === "yearly" && yearlyPrice
                ? yearlyPrice / 12
                : monthlyPrice;
              const discount = yearlyPrice && billingInterval === "yearly"
                ? getYearlyDiscount(monthlyPrice, yearlyPrice)
                : 0;
              
              const isPopular = index === 1; // Make middle plan popular
              const features = getFeatureList(plan);

              return (
                <Card
                  key={plan.slug}
                  className={`relative ${isPopular ? 'ring-2 ring-primary shadow-lg scale-105' : ''}`}
                >
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="px-3 py-1 bg-primary text-primary-foreground">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-4">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <div className="py-4">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-bold">
                          {formatPrice(currentPrice)}
                        </span>
                        <span className="text-muted-foreground">/month</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex items-center justify-center gap-2 mt-2">
                          <span className="text-sm line-through text-muted-foreground">
                            {formatPrice(monthlyPrice)}/month
                          </span>
                          <Badge variant="secondary">
                            {discount}% off
                          </Badge>
                        </div>
                      )}
                      {billingInterval === "yearly" && yearlyPrice && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Billed annually ({formatPrice(yearlyPrice)}/year)
                        </p>
                      )}
                    </div>
                    {plan.trialDays && (
                      <Badge variant="outline" className="mx-auto">
                        {plan.trialDays}-day free trial
                      </Badge>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      {features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <Link href="/signup">
                      <Button
                        className={`w-full ${isPopular ? 'bg-primary' : ''}`}
                        variant={isPopular ? 'default' : 'outline'}
                        size="lg"
                      >
                        {plan.trialDays ? 'Start Free Trial' : 'Get Started'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* FAQ Section */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-muted-foreground text-lg">
              Everything you need to know about VENUIN pricing
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Is there a free trial?</h3>
                <p className="text-sm text-muted-foreground">
                  Yes! All plans come with a 14-day free trial. No credit card required to start.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Can I change plans anytime?</h3>
                <p className="text-sm text-muted-foreground">
                  Absolutely. Upgrade or downgrade your plan at any time. Changes take effect immediately.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
                <p className="text-sm text-muted-foreground">
                  We accept all major credit cards through Stripe. All payments are secure and encrypted.
                </p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Is there a setup fee?</h3>
                <p className="text-sm text-muted-foreground">
                  No setup fees, ever. You only pay for your monthly or yearly subscription.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Can I cancel anytime?</h3>
                <p className="text-sm text-muted-foreground">
                  Yes, you can cancel your subscription at any time. No long-term contracts or cancellation fees.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Do you offer refunds?</h3>
                <p className="text-sm text-muted-foreground">
                  We offer a 30-day money-back guarantee if you're not completely satisfied.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8">
          <h2 className="text-3xl font-bold">Trusted by Venue Owners Everywhere</h2>
          
          <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Enterprise-grade security
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              99.9% uptime guarantee
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              GDPR compliant
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              24/7 support
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join hundreds of venue owners who have transformed their business with VENUIN.
          </p>
          <Link href="/signup">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Start Your Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <p className="mt-4 text-sm opacity-75">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Calendar className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">VENUIN</span>
              </div>
              <p className="text-muted-foreground text-sm">
                The complete venue management solution for modern businesses.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <div className="space-y-2 text-sm">
                <Link href="/features"><a className="text-muted-foreground hover:text-foreground">Features</a></Link>
                <Link href="/pricing"><a className="text-muted-foreground hover:text-foreground">Pricing</a></Link>
                <a href="#" className="text-muted-foreground hover:text-foreground">Security</a>
                <a href="#" className="text-muted-foreground hover:text-foreground">Integrations</a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <div className="space-y-2 text-sm">
                <a href="#" className="text-muted-foreground hover:text-foreground">About</a>
                <a href="#" className="text-muted-foreground hover:text-foreground">Blog</a>
                <Link href="/contact"><a className="text-muted-foreground hover:text-foreground">Contact</a></Link>
                <a href="#" className="text-muted-foreground hover:text-foreground">Careers</a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <div className="space-y-2 text-sm">
                <Link href="/privacy"><a className="text-muted-foreground hover:text-foreground">Privacy Policy</a></Link>
                <Link href="/terms"><a className="text-muted-foreground hover:text-foreground">Terms of Service</a></Link>
                <a href="#" className="text-muted-foreground hover:text-foreground">Cookie Policy</a>
                <a href="#" className="text-muted-foreground hover:text-foreground">GDPR</a>
              </div>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 VENUIN. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}