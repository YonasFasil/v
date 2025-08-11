import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { 
  Calendar, 
  Check, 
  ArrowRight, 
  Sparkles, 
  Shield, 
  Users,
  Brain,
  CreditCard,
  MessageSquare,
  BarChart3
} from "lucide-react";

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
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
  trialDays: number;
  features: string[];
}

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(false);
  
  const { data: plans = [], isLoading } = useQuery<Plan[]>({
    queryKey: ["/api/public/plans"],
    retry: false,
  });

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(cents / 100);
  };

  const getYearlyDiscount = (monthlyAmount: number, yearlyAmount: number) => {
    const monthlyYearly = monthlyAmount * 12;
    const discount = ((monthlyYearly - yearlyAmount) / monthlyYearly) * 100;
    return Math.round(discount);
  };

  const planFeatures = {
    starter: [
      "Smart booking management",
      "Customer database",
      "Basic reporting",
      "Email support",
      "Mobile access"
    ],
    professional: [
      "Everything in Starter",
      "Lead management & scoring",
      "Professional proposals",
      "Stripe payment processing",
      "Gmail integration",
      "Advanced analytics",
      "Priority support"
    ],
    enterprise: [
      "Everything in Professional", 
      "AI-powered insights",
      "Voice-to-text booking",
      "Multi-venue management",
      "Team collaboration",
      "Custom branding",
      "Dedicated success manager",
      "API access & integrations"
    ]
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center space-x-2">
                <Calendar className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-semibold text-gray-900">VENUIN</span>
              </Link>
              <div className="hidden md:flex space-x-8">
                <Link href="/features" className="text-gray-700 hover:text-gray-900 font-medium">Features</Link>
                <Link href="/pricing" className="text-gray-900 font-medium">Pricing</Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login" className="text-gray-700 hover:text-gray-900 font-medium">Sign in</Link>
              <Link href="/signup">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-medium">
                  Start Free Trial
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="pt-32 pb-16 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="outline" className="mb-6 text-blue-600 border-blue-200 bg-blue-50">
            <Sparkles className="w-4 h-4 mr-2" />
            14-day free trial included
          </Badge>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Choose your
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> growth plan</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
            Start with a free trial, then choose a plan that scales with your venue business.
            All plans include our core features with no hidden fees.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-16">
            <span className={`text-lg font-medium ${!isYearly ? 'text-gray-900' : 'text-gray-600'}`}>
              Monthly
            </span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
              className="data-[state=checked]:bg-blue-600"
            />
            <span className={`text-lg font-medium ${isYearly ? 'text-gray-900' : 'text-gray-600'}`}>
              Yearly
            </span>
            <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700 border-green-200">
              Save 20%
            </Badge>
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="pb-24 px-4">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto" />
              <p className="mt-4 text-gray-600">Loading plans...</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {plans.map((plan, index) => {
                const isPopular = plan.slug === 'professional';
                const monthlyPrice = plan.billingModes.monthly.amount;
                const yearlyPrice = plan.billingModes.yearly?.amount || monthlyPrice * 12;
                const currentPrice = isYearly ? yearlyPrice / 12 : monthlyPrice;
                const discount = isYearly && plan.billingModes.yearly 
                  ? getYearlyDiscount(monthlyPrice, yearlyPrice)
                  : 0;

                return (
                  <Card 
                    key={plan.id} 
                    className={`relative border-2 transition-all duration-300 hover:shadow-xl ${
                      isPopular 
                        ? 'border-blue-600 shadow-lg scale-105' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-blue-600 text-white px-4 py-1">
                          Most Popular
                        </Badge>
                      </div>
                    )}
                    
                    <CardHeader className="text-center pb-8 pt-8">
                      <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
                        plan.slug === 'starter' 
                          ? 'bg-green-100 text-green-600' 
                          : plan.slug === 'professional' 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'bg-purple-100 text-purple-600'
                      }`}>
                        {plan.slug === 'starter' && <Users className="w-8 h-8" />}
                        {plan.slug === 'professional' && <BarChart3 className="w-8 h-8" />}
                        {plan.slug === 'enterprise' && <Brain className="w-8 h-8" />}
                      </div>
                      
                      <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                        {plan.name}
                      </CardTitle>
                      
                      <p className="text-gray-600 mb-6">{plan.description}</p>
                      
                      <div className="space-y-2">
                        <div className="flex items-baseline justify-center">
                          <span className="text-5xl font-bold text-gray-900">
                            {formatPrice(currentPrice)}
                          </span>
                          <span className="text-gray-600 ml-2">/month</span>
                        </div>
                        
                        {discount > 0 && (
                          <div className="flex items-center justify-center space-x-2">
                            <span className="text-sm text-gray-500 line-through">
                              {formatPrice(monthlyPrice)}
                            </span>
                            <Badge variant="secondary" className="text-green-700 bg-green-100">
                              {discount}% off
                            </Badge>
                          </div>
                        )}
                        
                        {isYearly && (
                          <p className="text-sm text-gray-600">
                            {formatPrice(yearlyPrice)} billed annually
                          </p>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                      <Link href="/signup">
                        <Button 
                          className={`w-full py-3 rounded-full font-medium ${
                            isPopular
                              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                          }`}
                        >
                          Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                      
                      <div className="space-y-1 text-center text-sm text-gray-600">
                        <p>{plan.trialDays}-day free trial</p>
                        <p>No credit card required</p>
                      </div>
                      
                      <div className="pt-6 border-t border-gray-200">
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Venues:</span>
                              <span className="font-semibold text-gray-900 ml-1">
                                {plan.limits.venues === 999 ? 'Unlimited' : plan.limits.venues}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Staff:</span>
                              <span className="font-semibold text-gray-900 ml-1">
                                {plan.limits.staff === 999 ? 'Unlimited' : plan.limits.staff}
                              </span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-gray-600">Bookings/month:</span>
                              <span className="font-semibold text-gray-900 ml-1">
                                {plan.limits.monthlyBookings === 999 ? 'Unlimited' : plan.limits.monthlyBookings}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-4">
                        <h4 className="font-semibold text-gray-900 mb-4">Features included:</h4>
                        <div className="space-y-3">
                          {(planFeatures[plan.slug as keyof typeof planFeatures] || []).map((feature, idx) => (
                            <div key={idx} className="flex items-start space-x-3">
                              <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-700 text-sm">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Frequently asked questions
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                question: "Can I switch plans anytime?",
                answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately."
              },
              {
                question: "Is there a setup fee?",
                answer: "No setup fees, no hidden costs. You only pay for your subscription."
              },
              {
                question: "What payment methods do you accept?",
                answer: "We accept all major credit cards and process payments securely through Stripe."
              },
              {
                question: "Can I cancel anytime?",
                answer: "Absolutely. You can cancel your subscription at any time with no cancellation fees."
              },
              {
                question: "Do you offer refunds?",
                answer: "We offer a 14-day free trial. If you're not satisfied, you can request a refund within 30 days."
              },
              {
                question: "Is my data secure?",
                answer: "Yes, we use enterprise-grade security and encryption to protect your data at all times."
              }
            ].map((faq, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-3">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-5xl font-bold text-white mb-6">
            Ready to get started?
          </h2>
          <p className="text-xl text-blue-100 mb-10">
            Try VENUIN free for 14 days. No credit card required.
          </p>
          <Link href="/signup">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-50 px-8 py-4 rounded-full text-lg font-medium">
              Start Your Free Trial <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <Link href="/" className="flex items-center space-x-2 mb-4">
                <Calendar className="h-6 w-6 text-blue-400" />
                <span className="text-xl font-semibold">VENUIN</span>
              </Link>
              <p className="text-gray-400">
                The modern venue management platform for the digital age.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <div className="space-y-2 text-gray-400">
                <Link href="/features" className="block hover:text-white">Features</Link>
                <Link href="/pricing" className="block hover:text-white">Pricing</Link>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <div className="space-y-2 text-gray-400">
                <a href="#" className="block hover:text-white">About</a>
                <a href="#" className="block hover:text-white">Contact</a>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <div className="space-y-2 text-gray-400">
                <Link href="/privacy" className="block hover:text-white">Privacy</Link>
                <Link href="/terms" className="block hover:text-white">Terms</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 VENUIN. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}