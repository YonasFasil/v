import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Calendar, 
  Users, 
  TrendingUp,
  Brain,
  MessageSquare,
  CreditCard,
  ArrowRight,
  CheckCircle,
  Zap,
  Shield,
  Globe,
  Mic,
  FileText,
  BarChart3,
  Settings,
  Smartphone,
  Mail,
  Star,
  Building
} from "lucide-react";

export default function Features() {
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
                <Link href="/features" className="text-gray-900 font-medium">Features</Link>
                <Link href="/pricing" className="text-gray-700 hover:text-gray-900 font-medium">Pricing</Link>
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

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto text-center">
          <Badge variant="outline" className="mb-6 text-blue-600 border-blue-200 bg-blue-50">
            <Zap className="w-4 h-4 mr-2" />
            Powered by AI
          </Badge>
          
          <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Features that
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              work for you
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            VENUIN combines powerful venue management tools with intelligent automation 
            to help you run your business more efficiently and profitably.
          </p>
          
          <Link href="/signup">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full text-lg font-medium">
              Try All Features Free <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* AI Features Highlight */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6">AI-Powered Intelligence</h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Let artificial intelligence handle the routine tasks while you focus on growing your business.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Mic,
                title: "Voice-to-Text Booking",
                description: "Speak your booking details and watch them automatically convert to structured data"
              },
              {
                icon: Brain,
                title: "Smart Scheduling",
                description: "AI suggests optimal booking times based on availability and revenue potential"
              },
              {
                icon: Star,
                title: "Lead Scoring",
                description: "Automatically prioritize leads based on likelihood to convert and revenue potential"
              }
            ].map((feature, index) => (
              <Card key={index} className="bg-white/10 backdrop-blur border-white/20 text-white">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-6 bg-white/20 rounded-2xl flex items-center justify-center">
                    <feature.icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
                  <p className="text-blue-100">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Everything you need in one platform
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From lead capture to final payment, manage every aspect of your venue business with our comprehensive feature set.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
            <div>
              <Badge className="mb-4 bg-blue-100 text-blue-600 border-blue-200">
                Booking Management
              </Badge>
              <h3 className="text-4xl font-bold text-gray-900 mb-6">
                Smart calendar that thinks ahead
              </h3>
              <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                Our intelligent booking system helps you visualize availability, prevent double bookings, 
                and optimize your venue utilization with automated scheduling suggestions.
              </p>
              <div className="space-y-4">
                {[
                  "Interactive calendar with drag-and-drop booking",
                  "Multi-venue and multi-room management",
                  "Automated conflict prevention",
                  "Recurring event templates",
                  "Buffer time management"
                ].map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8">
                <div className="bg-white rounded-2xl p-6">
                  <div className="grid grid-cols-7 gap-2 mb-4">
                    {Array.from({length: 21}, (_, i) => (
                      <div key={i} className={`h-8 rounded ${
                        i === 8 || i === 9 || i === 15 ? 'bg-blue-100' :
                        i === 10 || i === 16 ? 'bg-green-100' :
                        'bg-gray-50'
                      }`} />
                    ))}
                  </div>
                  <div className="space-y-2">
                    <div className="bg-blue-600 text-white p-3 rounded-lg text-sm">
                      Wedding Reception - Grand Ballroom
                    </div>
                    <div className="bg-green-600 text-white p-3 rounded-lg text-sm">
                      Corporate Meeting - Conference Room A
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
            <div className="order-2 lg:order-1 relative">
              <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-3xl p-8">
                <div className="bg-white rounded-2xl p-6 space-y-4">
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold">Sarah Chen</p>
                      <p className="text-sm text-gray-600">Wedding Planning - High Priority</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Building className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold">Acme Corp</p>
                      <p className="text-sm text-gray-600">Annual Conference - Medium Priority</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <Badge className="mb-4 bg-green-100 text-green-600 border-green-200">
                Customer & Lead Management
              </Badge>
              <h3 className="text-4xl font-bold text-gray-900 mb-6">
                Never lose a lead again
              </h3>
              <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                Track every interaction, score leads automatically, and nurture prospects 
                with personalized communication workflows that convert better.
              </p>
              <div className="space-y-4">
                {[
                  "AI-powered lead scoring and prioritization",
                  "Complete customer interaction history",
                  "Automated follow-up workflows",
                  "UTM tracking and attribution",
                  "Custom fields and tags"
                ].map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <Badge className="mb-4 bg-purple-100 text-purple-600 border-purple-200">
                Proposals & Payments
              </Badge>
              <h3 className="text-4xl font-bold text-gray-900 mb-6">
                Close deals faster
              </h3>
              <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                Create stunning proposals in minutes, track engagement, collect digital signatures, 
                and process payments seamlessly with integrated Stripe Connect.
              </p>
              <div className="space-y-4">
                {[
                  "Professional proposal templates",
                  "Digital signature collection",
                  "Proposal tracking and analytics",
                  "Integrated payment processing",
                  "Automated invoice generation"
                ].map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-8">
                <div className="bg-white rounded-2xl p-6">
                  <div className="text-center mb-6">
                    <h4 className="font-bold text-lg mb-2">Wedding Venue Proposal</h4>
                    <p className="text-gray-600">Grand Ballroom Package</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b">
                      <span>Venue Rental</span>
                      <span className="font-semibold">$3,500</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span>Catering Package</span>
                      <span className="font-semibold">$4,200</span>
                    </div>
                    <div className="flex justify-between py-2 font-bold text-lg">
                      <span>Total</span>
                      <span>$7,700</span>
                    </div>
                    <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                      Accept & Sign
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Built for venue professionals
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Every feature designed with your workflow in mind, from first inquiry to final payment.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: BarChart3,
                title: "Advanced Analytics",
                description: "Track revenue, booking patterns, and performance metrics with detailed reports and insights.",
                color: "bg-blue-100 text-blue-600"
              },
              {
                icon: Mail,
                title: "Gmail Integration", 
                description: "Connect your Gmail account for seamless email workflows and communication tracking.",
                color: "bg-red-100 text-red-600"
              },
              {
                icon: Smartphone,
                title: "Mobile Access",
                description: "Manage your venue business on the go with our responsive mobile interface.",
                color: "bg-green-100 text-green-600"
              },
              {
                icon: Settings,
                title: "Custom Workflows",
                description: "Build automated workflows that match your unique business processes and requirements.",
                color: "bg-purple-100 text-purple-600"
              },
              {
                icon: Shield,
                title: "Enterprise Security",
                description: "Bank-level security with encryption, regular backups, and compliance standards.",
                color: "bg-orange-100 text-orange-600"
              },
              {
                icon: Globe,
                title: "API Access",
                description: "Integrate with your existing tools and build custom solutions with our robust API.",
                color: "bg-indigo-100 text-indigo-600"
              }
            ].map((feature, index) => (
              <Card key={index} className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 bg-white">
                <CardContent className="p-8">
                  <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-6`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Seamless integrations
          </h2>
          <p className="text-xl text-gray-600 mb-16">
            VENUIN works with the tools you already use, making it easy to get started without disrupting your workflow.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center opacity-60">
            {[
              { name: "Stripe", logo: "💳" },
              { name: "Gmail", logo: "📧" },
              { name: "Google Cal", logo: "📅" },
              { name: "Zoom", logo: "📹" }
            ].map((integration, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl mb-2">{integration.logo}</div>
                <p className="text-gray-700 font-medium">{integration.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-5xl font-bold text-white mb-6">
            Ready to experience all features?
          </h2>
          <p className="text-xl text-blue-100 mb-10">
            Start your free 14-day trial and discover how VENUIN can transform your venue management.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/signup">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-50 px-8 py-4 rounded-full text-lg font-medium">
                Try All Features Free <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" size="lg" className="px-8 py-4 rounded-full text-lg font-medium border-white text-white hover:bg-white hover:text-blue-600">
                View Pricing
              </Button>
            </Link>
          </div>
          <p className="text-blue-100 mt-6">
            No credit card required • Full access to all features
          </p>
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