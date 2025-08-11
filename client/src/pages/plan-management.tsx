import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Crown, Zap, Star, ArrowRight, Calendar } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface PlanFeature {
  name: string;
  included: boolean;
  limit?: string;
}

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  features: Record<string, any>;
  limits: Record<string, any>;
  sortOrder: number;
}

interface TenantPlan {
  currentPlan: Plan;
  tenant: {
    id: string;
    name: string;
    slug: string;
    status: string;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
  };
}

export default function PlanManagement() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  // Get current tenant plan info
  const { data: tenantPlan, isLoading: planLoading } = useQuery<TenantPlan>({
    queryKey: ["/api/tenant/plan-info"],
  });

  // Get all available plans
  const { data: allPlans, isLoading: plansLoading } = useQuery<Plan[]>({
    queryKey: ["/api/public/plans"],
  });

  const upgradeMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await apiRequest("POST", "/api/tenant/upgrade-plan", {
        planId,
        billingCycle,
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        // Redirect to Stripe Checkout
        window.location.href = data.checkoutUrl;
      } else {
        toast({
          title: "Plan Updated",
          description: "Your plan has been successfully updated.",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/tenant/plan-info"] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Upgrade Failed",
        description: error.message || "Failed to upgrade plan. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getPlanIcon = (slug: string) => {
    switch (slug) {
      case 'starter': return <Zap className="h-6 w-6 text-blue-600" />;
      case 'professional': return <Star className="h-6 w-6 text-purple-600" />;
      case 'enterprise': return <Crown className="h-6 w-6 text-yellow-600" />;
      default: return <CheckCircle2 className="h-6 w-6 text-gray-600" />;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  if (planLoading || plansLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
      </div>
    );
  }

  if (!tenantPlan || !allPlans) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">Failed to load plan information.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentPlan = tenantPlan.currentPlan;
  const isCurrentPlan = (planSlug: string) => currentPlan.slug === planSlug;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Manage Your Plan</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Upgrade or manage your VENUIN subscription to unlock more powerful features
        </p>
      </div>

      {/* Current Plan Status */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getPlanIcon(currentPlan.slug)}
              <div>
                <CardTitle className="text-xl">Current Plan: {currentPlan.name}</CardTitle>
                <CardDescription>
                  {tenantPlan.tenant.name} • {tenantPlan.tenant.status === 'active' ? 'Active' : 'Inactive'}
                </CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              Current
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Plan Features</h4>
              <div className="space-y-1 text-sm">
                {currentPlan.limits.maxUsers && (
                  <div>• Up to {currentPlan.limits.maxUsers} team members</div>
                )}
                {currentPlan.limits.maxVenues && (
                  <div>• Up to {currentPlan.limits.maxVenues} venues</div>
                )}
                {currentPlan.limits.maxSpacesPerVenue && (
                  <div>• Up to {currentPlan.limits.maxSpacesPerVenue} spaces per venue</div>
                )}
                {currentPlan.features.aiFeatures && <div>• AI-powered insights</div>}
                {currentPlan.features.proposalGeneration && <div>• Proposal generation</div>}
                {currentPlan.features.stripeConnect && <div>• Payment processing</div>}
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Billing Information</h4>
              <div className="space-y-1 text-sm">
                <div>Monthly: {formatPrice(currentPlan.priceMonthly)}</div>
                <div>Yearly: {formatPrice(currentPlan.priceYearly)}</div>
                {tenantPlan.tenant.stripeSubscriptionId ? (
                  <div className="text-green-600">• Active subscription</div>
                ) : (
                  <div className="text-amber-600">• Trial or free plan</div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing Cycle Toggle */}
      <div className="flex justify-center">
        <div className="bg-gray-100 p-1 rounded-lg inline-flex">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 rounded-md transition-colors ${
              billingCycle === 'monthly' 
                ? 'bg-white text-gray-900 shadow' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Calendar className="h-4 w-4 inline mr-2" />
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-4 py-2 rounded-md transition-colors ${
              billingCycle === 'yearly' 
                ? 'bg-white text-gray-900 shadow' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Calendar className="h-4 w-4 inline mr-2" />
            Yearly
            <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
              Save 20%
            </Badge>
          </button>
        </div>
      </div>

      {/* Available Plans */}
      <div className="grid md:grid-cols-3 gap-6">
        {allPlans
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative ${
                isCurrentPlan(plan.slug) 
                  ? 'border-2 border-blue-500 bg-blue-50' 
                  : 'hover:shadow-lg transition-shadow'
              }`}
            >
              {isCurrentPlan(plan.slug) && (
                <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-blue-600">
                  Current Plan
                </Badge>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-2">
                  {getPlanIcon(plan.slug)}
                </div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="text-3xl font-bold text-gray-900">
                  {formatPrice(billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly)}
                  <span className="text-base font-normal text-gray-500">
                    /{billingCycle === 'monthly' ? 'month' : 'year'}
                  </span>
                </div>
                {billingCycle === 'yearly' && (
                  <div className="text-sm text-green-600">
                    Save {formatPrice(plan.priceMonthly * 12 - plan.priceYearly)} per year
                  </div>
                )}
              </CardHeader>

              <Separator />

              <CardContent className="pt-4">
                <div className="space-y-3 mb-6">
                  {plan.limits.maxUsers && (
                    <div className="flex items-center text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                      Up to {plan.limits.maxUsers} team members
                    </div>
                  )}
                  {plan.limits.maxVenues && (
                    <div className="flex items-center text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                      Up to {plan.limits.maxVenues} venues
                    </div>
                  )}
                  {plan.limits.maxSpacesPerVenue && (
                    <div className="flex items-center text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                      Up to {plan.limits.maxSpacesPerVenue} spaces per venue
                    </div>
                  )}
                  {plan.features.aiFeatures && (
                    <div className="flex items-center text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                      AI-powered insights
                    </div>
                  )}
                  {plan.features.proposalGeneration && (
                    <div className="flex items-center text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                      Proposal generation
                    </div>
                  )}
                  {plan.features.stripeConnect && (
                    <div className="flex items-center text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                      Payment processing
                    </div>
                  )}
                </div>

                <Button 
                  className="w-full"
                  variant={isCurrentPlan(plan.slug) ? "secondary" : "default"}
                  disabled={isCurrentPlan(plan.slug) || upgradeMutation.isPending}
                  onClick={() => !isCurrentPlan(plan.slug) && upgradeMutation.mutate(plan.id)}
                >
                  {upgradeMutation.isPending ? (
                    "Processing..."
                  ) : isCurrentPlan(plan.slug) ? (
                    "Current Plan"
                  ) : (
                    <>
                      Upgrade to {plan.name}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Billing Portal Link */}
      {tenantPlan.tenant.stripeSubscriptionId && (
        <Card>
          <CardContent className="text-center py-6">
            <h3 className="font-semibold mb-2">Manage Billing</h3>
            <p className="text-gray-600 mb-4">
              Update payment methods, download invoices, and manage your subscription
            </p>
            <Button variant="outline">
              Open Billing Portal
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}