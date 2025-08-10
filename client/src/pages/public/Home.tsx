import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Users, 
  DollarSign, 
  BarChart3, 
  Zap, 
  Shield, 
  Star,
  ArrowRight,
  CheckCircle
} from "lucide-react";

export default function Home() {
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
            <Link href="/features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </Link>
            <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
              Sign In
            </Link>
            <Link href="/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge variant="outline" className="mb-4">
            Trusted by 500+ venue owners
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            The Complete Venue Management Solution
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Streamline bookings, manage customers, automate proposals, and grow your venue business 
            with AI-powered insights and seamless payment processing.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" size="lg" className="text-lg px-8">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">How VENUIN Works</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Simple steps to transform your venue management and grow your business
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="text-center">
            <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">1. Setup Your Venue</h3>
            <p className="text-muted-foreground">
              Add your spaces, services, and team. Our guided setup gets you started in minutes.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">2. Manage Bookings</h3>
            <p className="text-muted-foreground">
              Track inquiries, create proposals, and convert leads with our intelligent booking system.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">3. Grow with AI</h3>
            <p className="text-muted-foreground">
              Get actionable insights, automate communications, and optimize your pricing strategy.
            </p>
          </div>
        </div>
      </section>

      {/* Key Features Preview */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Everything You Need to Succeed</h2>
            <p className="text-muted-foreground text-lg">
              Comprehensive tools designed specifically for venue management
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <Calendar className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Smart Booking</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Automated scheduling, conflict detection, and intelligent proposal generation
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <DollarSign className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Payment Processing</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Secure payments, automated invoicing, and deposit management via Stripe
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <Zap className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">AI-Powered</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Voice booking, smart scheduling, and predictive analytics for better decisions
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <BarChart3 className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Real-time insights, performance tracking, and growth optimization
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Trusted by Venues Everywhere</h2>
          <div className="flex items-center justify-center gap-1 mb-6">
            {[1,2,3,4,5].map(i => (
              <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            ))}
            <span className="ml-2 text-sm text-muted-foreground">4.9/5 from 200+ reviews</span>
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center mb-4">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-muted-foreground mb-4">
                "VENUIN transformed our venue management. We've increased bookings by 40% and cut admin time in half."
              </p>
              <div className="font-semibold">Sarah Johnson</div>
              <div className="text-sm text-muted-foreground">Grand Ballroom Events</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center mb-4">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-muted-foreground mb-4">
                "The AI features are incredible. Automated proposals save us hours every week, and clients love the professional look."
              </p>
              <div className="font-semibold">Michael Chen</div>
              <div className="text-sm text-muted-foreground">Urban Loft Venues</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center mb-4">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-muted-foreground mb-4">
                "Setup was incredibly easy, and the support team helped us migrate all our data seamlessly."
              </p>
              <div className="font-semibold">Emma Rodriguez</div>
              <div className="text-sm text-muted-foreground">Riverside Convention Center</div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Venue Business?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join hundreds of successful venue owners who have streamlined their operations with VENUIN.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="text-lg px-8">
                Start Your Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="text-lg px-8 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                See All Plans
              </Button>
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm opacity-75">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              14-day free trial
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              No setup fees
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              Cancel anytime
            </div>
          </div>
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
                <Link href="/features" className="text-muted-foreground hover:text-foreground">Features</Link>
                <Link href="/pricing" className="text-muted-foreground hover:text-foreground">Pricing</Link>
                <a href="#" className="text-muted-foreground hover:text-foreground">Security</a>
                <a href="#" className="text-muted-foreground hover:text-foreground">Integrations</a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <div className="space-y-2 text-sm">
                <a href="#" className="text-muted-foreground hover:text-foreground">About</a>
                <a href="#" className="text-muted-foreground hover:text-foreground">Blog</a>
                <Link href="/contact" className="text-muted-foreground hover:text-foreground">Contact</Link>
                <a href="#" className="text-muted-foreground hover:text-foreground">Careers</a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <div className="space-y-2 text-sm">
                <Link href="/privacy" className="text-muted-foreground hover:text-foreground">Privacy Policy</Link>
                <Link href="/terms" className="text-muted-foreground hover:text-foreground">Terms of Service</Link>
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