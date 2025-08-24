import { useState, useEffect } from "react";
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
  Play,
  Menu,
  X,
  Sparkles,
  TrendingUp,
  Clock,
  MapPin,
  MessageSquare,
  BarChart3,
  Smartphone,
  Laptop,
  Tablet
} from "lucide-react";
import { type SubscriptionPackage } from "@shared/schema";

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Fetch packages for pricing section
  const { data: packages = [] } = useQuery<SubscriptionPackage[]>({
    queryKey: ["/api/public/packages"],
  });

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: <Calendar className="w-7 h-7" />,
      title: "Intelligent Booking",
      description: "Smart scheduling that prevents conflicts and optimizes your venue utilization with AI-powered recommendations.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Users className="w-7 h-7" />,
      title: "Customer Experience", 
      description: "Unified CRM that transforms every interaction into lasting relationships with automated follow-ups.",
      color: "from-emerald-500 to-teal-500"
    },
    {
      icon: <TrendingUp className="w-7 h-7" />,
      title: "Revenue Growth",
      description: "Dynamic pricing engine and analytics that maximize profits while maintaining competitive rates.",
      color: "from-violet-500 to-purple-500"
    },
    {
      icon: <Shield className="w-7 h-7" />,
      title: "Enterprise Security",
      description: "Bank-grade security with end-to-end encryption, multi-factor authentication, and compliance standards.",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: <Globe className="w-7 h-7" />,
      title: "Multi-Location",
      description: "Centralized dashboard for managing unlimited venues with location-specific insights and reporting.",
      color: "from-teal-500 to-blue-500"
    },
    {
      icon: <Sparkles className="w-7 h-7" />,
      title: "AI Insights",
      description: "Machine learning algorithms provide predictive analytics and intelligent business recommendations.",
      color: "from-pink-500 to-rose-500"
    }
  ];

  const capabilities = [
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Real-time Availability",
      description: "Instant booking confirmations with live calendar sync"
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: "Automated Communications",
      description: "Smart email sequences and SMS notifications"
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Advanced Analytics",
      description: "Deep insights into booking patterns and revenue"
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: "Location Management",
      description: "Multi-venue support with centralized control"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Director, Premier Events",
      content: "VenueFlow transformed our operations. We increased bookings by 150% and reduced admin time by 80% in just three months.",
      rating: 5,
      image: "SC"
    },
    {
      name: "Marcus Rodriguez", 
      role: "Owner, Rodriguez Wedding Venues",
      content: "The automated proposal system alone pays for itself. We're closing deals faster than ever while delivering a premium experience.",
      rating: 5,
      image: "MR"
    },
    {
      name: "Emily Watson",
      role: "Operations Manager, Corporate Spaces",
      content: "Finally, a platform that understands the complexity of venue management. The AI insights are game-changing.",
      rating: 5,
      image: "EW"
    }
  ];

  const stats = [
    { number: "500+", label: "Venues Powered" },
    { number: "1M+", label: "Bookings Processed" },
    { number: "150%", label: "Average Revenue Increase" },
    { number: "24/7", label: "Customer Support" }
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
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/95 backdrop-blur-xl border-b border-gray-200 shadow-sm' 
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Building className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-gray-900">VenueFlow</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-gray-900 transition-colors font-medium">Features</a>
              <a href="#pricing" className="text-gray-700 hover:text-gray-900 transition-colors font-medium">Pricing</a>
              <a href="#testimonials" className="text-gray-700 hover:text-gray-900 transition-colors font-medium">Reviews</a>
              <Button variant="ghost" size="sm" asChild>
                <a href="/super-admin/login">Admin</a>
              </Button>
              <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium px-6" asChild>
                <a href="/signup">Get Started</a>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
            <div className="px-4 py-6 space-y-4">
              <a href="#features" className="block text-gray-700 hover:text-gray-900 font-medium">Features</a>
              <a href="#pricing" className="block text-gray-700 hover:text-gray-900 font-medium">Pricing</a>
              <a href="#testimonials" className="block text-gray-700 hover:text-gray-900 font-medium">Reviews</a>
              <a href="/super-admin/login" className="block text-gray-700 hover:text-gray-900 font-medium">Admin</a>
              <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white" asChild>
                <a href="/signup">Get Started</a>
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-blue-50/50 to-purple-50/50"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-10 w-32 h-32 bg-blue-200/30 rounded-full blur-3xl"></div>
          <div className="absolute top-40 right-20 w-48 h-48 bg-purple-200/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-1/3 w-40 h-40 bg-teal-200/30 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-blue-100 to-purple-100 text-gray-900 border border-blue-200/50 mb-8">
              <Sparkles className="w-4 h-4 mr-2 text-blue-600" />
              AI-Powered Venue Management
            </Badge>
            
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-gray-900 mb-8 leading-tight tracking-tight">
              Venue management.
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent">
                Reimagined.
              </span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
              The most advanced platform for venue owners who demand excellence. 
              Streamline operations, maximize revenue, and deliver unforgettable experiences.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button 
                size="lg" 
                className="text-lg px-8 py-4 h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-xl shadow-blue-500/25 transition-all duration-300" 
                asChild
              >
                <a href="/signup" className="flex items-center">
                  Get started
                  <ArrowRight className="ml-2 w-5 h-5" />
                </a>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 py-4 h-14 border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 bg-white/80 backdrop-blur-sm transition-all duration-300"
              >
                <Play className="mr-2 w-5 h-5" />
                Watch demo
              </Button>
            </div>
            
            {/* Trust Indicators */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-gray-600">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                No setup fees
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                No credit card required
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                Setup in minutes
              </div>
            </div>
          </div>
          
          {/* Stats */}
          <div className="mt-24 grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">{stat.number}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-600 mb-12 text-lg">Trusted by leading venue operators worldwide</p>
          <div className="flex flex-wrap justify-center items-center gap-12 lg:gap-16 opacity-50">
            <div className="text-2xl font-bold text-gray-400 tracking-wider">MARRIOTT</div>
            <div className="text-2xl font-bold text-gray-400 tracking-wider">HILTON</div>
            <div className="text-2xl font-bold text-gray-400 tracking-wider">HYATT</div>
            <div className="text-2xl font-bold text-gray-400 tracking-wider">WESTIN</div>
            <div className="text-2xl font-bold text-gray-400 tracking-wider">RITZ</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
              Powerful features.
              <br />
              <span className="text-gray-600">Beautifully simple.</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Every tool you need to run a world-class venue operation, designed with the elegance and precision you expect.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group border-0 shadow-sm hover:shadow-xl transition-all duration-500 bg-white hover:bg-white/95 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <div className="text-white">
                      {feature.icon}
                    </div>
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-gray-700 transition-colors">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Additional Capabilities */}
          <div className="mt-24">
            <div className="text-center mb-16">
              <h3 className="text-3xl font-bold text-gray-900 mb-4">And so much more</h3>
              <p className="text-lg text-gray-600">Essential capabilities that make the difference</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {capabilities.map((capability, index) => (
                <div key={index} className="text-center group">
                  <div className="w-12 h-12 mx-auto mb-4 bg-white rounded-xl shadow-md flex items-center justify-center group-hover:shadow-lg transition-shadow duration-300">
                    <div className="text-gray-700 group-hover:text-blue-600 transition-colors">
                      {capability.icon}
                    </div>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">{capability.title}</h4>
                  <p className="text-sm text-gray-600">{capability.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
              Simple pricing.
              <br />
              <span className="text-gray-600">Exceptional value.</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Choose the perfect plan for your venue. Start free, scale as you grow. No surprises, no hidden fees.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {packages.map((pkg, index) => (
              <Card 
                key={pkg.id} 
                className={`relative transition-all duration-300 hover:shadow-2xl ${
                  pkg.name.toLowerCase() === 'professional' 
                    ? 'border-2 border-blue-500 shadow-xl scale-105 bg-gradient-to-b from-blue-50/50 to-white' 
                    : 'border border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                {pkg.name.toLowerCase() === 'professional' && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 font-medium">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-8 pt-8">
                  <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center ${
                    pkg.name.toLowerCase() === 'professional' 
                      ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {getPackageIcon(pkg.name)}
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-900 mb-2">{pkg.name}</CardTitle>
                  <div className="mb-4">
                    <div className="text-5xl font-bold text-gray-900">
                      ${pkg.price}
                    </div>
                    <div className="text-gray-600 font-medium">per {pkg.billingInterval}</div>
                  </div>
                  <p className="text-gray-600 leading-relaxed">{pkg.description}</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-center">
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mr-3">
                        <Check className="w-3 h-3 text-green-600" />
                      </div>
                      <span className="text-gray-700">{pkg.maxVenues} venue{pkg.maxVenues !== 1 ? 's' : ''}</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mr-3">
                        <Check className="w-3 h-3 text-green-600" />
                      </div>
                      <span className="text-gray-700">{pkg.maxUsers} team member{pkg.maxUsers !== 1 ? 's' : ''}</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mr-3">
                        <Check className="w-3 h-3 text-green-600" />
                      </div>
                      <span className="text-gray-700">{pkg.maxBookingsPerMonth} bookings/month</span>
                    </li>
                    {parseFeatures(pkg.features).slice(0, 4).map((feature) => (
                      <li key={feature} className="flex items-center">
                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mr-3">
                          <Check className="w-3 h-3 text-green-600" />
                        </div>
                        <span className="text-gray-700">
                          {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={`w-full h-12 font-medium transition-all duration-300 ${
                      pkg.name.toLowerCase() === 'professional' 
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
                        : 'border-2 border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700'
                    }`}
                    variant={pkg.name.toLowerCase() === 'professional' ? 'default' : 'outline'}
                    asChild
                  >
                    <a href="/signup">
                      Get started
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-16">
            <p className="text-gray-600 text-lg">
              Need enterprise features? {' '}
              <a href="mailto:sales@venueflow.com" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                Contact our sales team
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
              Loved by venue
              <br />
              <span className="text-gray-600">owners everywhere.</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              See how VenueFlow is transforming businesses just like yours.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white">
                <CardContent className="p-8">
                  <div className="flex mb-6">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-amber-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-8 text-lg leading-relaxed italic">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold mr-4">
                      {testimonial.image}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{testimonial.name}</div>
                      <div className="text-gray-600">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-32 h-32 bg-blue-300/20 rounded-full blur-3xl"></div>
          <div className="absolute top-40 right-20 w-48 h-48 bg-purple-300/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-1/3 w-40 h-40 bg-teal-300/20 rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-6xl font-bold mb-6 tracking-tight">
            Ready to transform
            <br />
            your venue business?
          </h2>
          <p className="text-xl lg:text-2xl mb-12 opacity-90 leading-relaxed">
            Join hundreds of venue owners who've already made the switch to VenueFlow.
          </p>
          <Button 
            size="lg" 
            className="text-lg px-12 py-4 h-16 bg-white text-gray-900 hover:bg-gray-100 font-semibold shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105"
            asChild
          >
            <a href="/signup" className="flex items-center">
              Start managing your venue today
              <ArrowRight className="ml-3 w-6 h-6" />
            </a>
          </Button>
          <p className="mt-8 text-blue-200 text-lg">
            No setup fees • No credit card required • Get started in minutes
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            <div className="lg:col-span-1">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Building className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-semibold text-gray-900">VenueFlow</span>
              </div>
              <p className="text-gray-600 leading-relaxed mb-6">
                The most advanced venue management platform for modern businesses who demand excellence.
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer">
                  <Smartphone className="w-5 h-5 text-gray-600" />
                </div>
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer">
                  <Laptop className="w-5 h-5 text-gray-600" />
                </div>
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer">
                  <Tablet className="w-5 h-5 text-gray-600" />
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-6 text-lg">Product</h4>
              <ul className="space-y-4">
                <li><a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</a></li>
                <li><a href="/signup" className="text-gray-600 hover:text-gray-900 transition-colors">Get Started</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-6 text-lg">Support</h4>
              <ul className="space-y-4">
                <li><a href="mailto:support@venueflow.com" className="text-gray-600 hover:text-gray-900 transition-colors">Help Center</a></li>
                <li><a href="mailto:contact@venueflow.com" className="text-gray-600 hover:text-gray-900 transition-colors">Contact Us</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Documentation</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Status</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-6 text-lg">Company</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">About</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Blog</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Careers</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Press</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-200 mt-12 pt-8 flex flex-col lg:flex-row justify-between items-center">
            <p className="text-gray-600 text-sm mb-4 lg:mb-0">
              &copy; 2024 VenueFlow. All rights reserved.
            </p>
            <div className="flex space-x-8 text-sm">
              <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Privacy Policy</a>
              <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Terms of Service</a>
              <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}