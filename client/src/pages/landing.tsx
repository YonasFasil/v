import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { 
  ArrowRight, 
  Check, 
  Star, 
  Users, 
  Calendar, 
  DollarSign,
  Building,
  Shield,
  Zap,
  Globe,
  ChevronRight,
  Play
} from "lucide-react";
import { type SubscriptionPackage } from "@shared/schema";

export default function Landing() {
  const [selectedTab, setSelectedTab] = useState("features");

  // Fetch packages for pricing section
  const { data: packages = [] } = useQuery<SubscriptionPackage[]>({
    queryKey: ["/api/public/packages"],
  });

  const features = [
    {
      icon: <Calendar className="w-8 h-8 text-blue-600" />,
      title: "Smart Booking Management",
      description: "Streamline reservations with intelligent scheduling and automated confirmations."
    },
    {
      icon: <Users className="w-8 h-8 text-green-600" />,
      title: "Customer Relationship Tools", 
      description: "Build lasting relationships with integrated CRM and communication tools."
    },
    {
      icon: <DollarSign className="w-8 h-8 text-purple-600" />,
      title: "Revenue Optimization",
      description: "Maximize profits with dynamic pricing and detailed analytics insights."
    },
    {
      icon: <Shield className="w-8 h-8 text-orange-600" />,
      title: "Enterprise Security",
      description: "Bank-level security with data encryption and compliance standards."
    },
    {
      icon: <Globe className="w-8 h-8 text-teal-600" />,
      title: "Multi-Location Support",
      description: "Manage multiple venues from one centralized dashboard."
    },
    {
      icon: <Zap className="w-8 h-8 text-red-600" />,
      title: "AI-Powered Insights",
      description: "Get intelligent recommendations to grow your business."
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Event Manager, Grand Ballroom",
      content: "This platform transformed how we manage bookings. Our efficiency increased by 300% in just 2 months!",
      rating: 5
    },
    {
      name: "Michael Chen", 
      role: "Owner, Chen Wedding Venues",
      content: "The automated proposals and customer communication features saved us 20 hours per week.",
      rating: 5
    },
    {
      name: "Emma Rodriguez",
      role: "Operations Director, Corporate Events Co",
      content: "Finally, a venue management system that actually understands our business needs.",
      rating: 5
    }
  ];

  const getPackageIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'starter': return <Zap className="w-6 h-6" />;
      case 'professional': return <Building className="w-6 h-6" />;
      case 'enterprise': return <Shield className="w-6 h-6" />;
      default: return <Star className="w-6 h-6" />;
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
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Building className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">VenueFlow</span>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
            <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
            <a href="#testimonials" className="text-gray-600 hover:text-gray-900 transition-colors">Reviews</a>
            <Button variant="outline" asChild>
              <a href="/super-admin/login">Admin</a>
            </Button>
            <Button asChild>
              <a href="/signup">Start Free Trial</a>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-4" variant="secondary">
            🚀 Now with AI-powered insights
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            The Complete
            <span className="text-blue-600"> Venue Management</span>
            <br />Platform
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Streamline bookings, delight customers, and grow revenue with the only venue management system you'll ever need.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" asChild className="text-lg px-8 py-6">
              <a href="/signup">
                Start Free 14-Day Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </a>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6">
              <Play className="mr-2 w-5 h-5" />
              Watch Demo
            </Button>
          </div>
          <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
            <div className="flex items-center">
              <Check className="w-4 h-4 text-green-500 mr-2" />
              No credit card required
            </div>
            <div className="flex items-center">
              <Check className="w-4 h-4 text-green-500 mr-2" />
              Setup in 5 minutes
            </div>
            <div className="flex items-center">
              <Check className="w-4 h-4 text-green-500 mr-2" />
              Cancel anytime
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <p className="text-center text-gray-600 mb-8">Trusted by 500+ venue businesses worldwide</p>
          <div className="flex justify-center items-center space-x-12 opacity-60">
            {/* Placeholder for customer logos */}
            <div className="text-2xl font-bold text-gray-400">Marriott</div>
            <div className="text-2xl font-bold text-gray-400">Hilton</div>
            <div className="text-2xl font-bold text-gray-400">Hyatt</div>
            <div className="text-2xl font-bold text-gray-400">Westin</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything you need to manage venues</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From booking management to customer relationships, we've got every aspect of your venue business covered.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                  <div className="mb-4">{feature.icon}</div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Simple, transparent pricing</h2>
            <p className="text-xl text-gray-600">Start free, scale as you grow. No hidden fees.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {packages.map((pkg, index) => (
              <Card 
                key={pkg.id} 
                className={`relative ${
                  pkg.name.toLowerCase() === 'professional' 
                    ? 'border-blue-500 shadow-xl scale-105' 
                    : 'border-gray-200'
                }`}
              >
                {pkg.name.toLowerCase() === 'professional' && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4 text-blue-600">
                    {getPackageIcon(pkg.name)}
                  </div>
                  <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                  <div className="text-4xl font-bold mt-4">
                    ${pkg.price}
                    <span className="text-lg font-normal text-gray-600">/{pkg.billingInterval}</span>
                  </div>
                  <p className="text-gray-600 mt-2">{pkg.description}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center">
                      <Check className="w-5 h-5 text-green-500 mr-3" />
                      {pkg.maxVenues} venue{pkg.maxVenues !== 1 ? 's' : ''}
                    </li>
                    <li className="flex items-center">
                      <Check className="w-5 h-5 text-green-500 mr-3" />
                      {pkg.maxUsers} team member{pkg.maxUsers !== 1 ? 's' : ''}
                    </li>
                    <li className="flex items-center">
                      <Check className="w-5 h-5 text-green-500 mr-3" />
                      {pkg.maxBookingsPerMonth} bookings/month
                    </li>
                    {parseFeatures(pkg.features).slice(0, 4).map((feature) => (
                      <li key={feature} className="flex items-center">
                        <Check className="w-5 h-5 text-green-500 mr-3" />
                        {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full" 
                    variant={pkg.name.toLowerCase() === 'professional' ? 'default' : 'outline'}
                    asChild
                  >
                    <a href="/signup">
                      Start {pkg.trialDays}-day free trial
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600">
              Need something custom? <a href="mailto:sales@venueflow.com" className="text-blue-600 hover:underline">Contact our sales team</a>
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Loved by venue owners everywhere</h2>
            <p className="text-xl text-gray-600">See what our customers have to say</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-6 italic">"{testimonial.content}"</p>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to transform your venue business?</h2>
          <p className="text-xl mb-8 opacity-90">Join hundreds of venue owners who've already made the switch</p>
          <Button size="lg" variant="secondary" asChild className="text-lg px-8 py-6">
            <a href="/signup">
              Start Your Free Trial Today
              <ChevronRight className="ml-2 w-5 h-5" />
            </a>
          </Button>
          <p className="mt-4 text-blue-100">No credit card required • 14-day free trial • Setup in minutes</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Building className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">VenueFlow</span>
              </div>
              <p className="text-gray-400">The complete venue management platform for modern businesses.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
                <li><a href="/signup" className="hover:text-white">Sign Up</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="mailto:support@venueflow.com" className="hover:text-white">Help Center</a></li>
                <li><a href="mailto:contact@venueflow.com" className="hover:text-white">Contact Us</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Privacy</a></li>
                <li><a href="#" className="hover:text-white">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 VenueFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}