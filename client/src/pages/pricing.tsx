import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface Package {
  id: string;
  name: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  is_popular: boolean;
}

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const { data: packages = [], isLoading } = useQuery<Package[]>({
    queryKey: ["/api/subscription-packages"],
  });

  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">VenuinePro</h1>
          <Button asChild>
            <a href="/login">Login</a>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-24">
        <div className="text-center max-w-4xl mx-auto">
          <h2 className="text-5xl md:text-7xl font-bold text-gray-900 leading-tight mb-6">
            Find the Perfect Plan for Your Venue
          </h2>
          <p className="text-lg md:text-xl text-gray-600 mb-10">
            Choose the plan that best fits your needs and start streamlining your operations today.
          </p>
          <div className="inline-flex items-center bg-gray-200 rounded-full p-1">
            <Button
              onClick={() => setBillingCycle("monthly")}
              className={cn(
                "rounded-full px-6 py-2 text-lg",
                billingCycle === "monthly" ? "bg-white text-gray-900 shadow" : "bg-transparent text-gray-600"
              )}
            >
              Monthly
            </Button>
            <Button
              onClick={() => setBillingCycle("yearly")}
              className={cn(
                "rounded-full px-6 py-2 text-lg",
                billingCycle === "yearly" ? "bg-white text-gray-900 shadow" : "bg-transparent text-gray-600"
              )}
            >
              Yearly (Save 20%)
            </Button>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-12 bg-gray-200 rounded w-1/2 mb-6"></div>
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            ))
          ) : (
            packages.map((pkg) => (
              <div
                key={pkg.id}
                className={cn(
                  "bg-white p-8 rounded-xl shadow-lg border",
                  pkg.is_popular ? "border-blue-500" : "border-gray-200"
                )}
              >
                {pkg.is_popular && (
                  <div className="text-center mb-4">
                    <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                <h3 className="text-3xl font-bold text-gray-900 text-center mb-4">{pkg.name}</h3>
                <div className="text-center mb-6">
                  <span className="text-5xl font-bold">
                    ${billingCycle === "monthly" ? pkg.price_monthly : pkg.price_yearly / 12}
                  </span>
                  <span className="text-gray-600">/month</span>
                </div>
                <ul className="space-y-4">
                  {pkg.features.map((feature, i) => (
                    <li key={i} className="flex items-center">
                      <Check className="w-5 h-5 text-green-500 mr-3" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild size="lg" className="w-full mt-8 text-lg">
                  <a href="/signup">Choose Plan</a>
                </Button>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
