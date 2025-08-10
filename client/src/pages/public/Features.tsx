import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Users, 
  FileText,
  CreditCard,
  Building,
  Zap,
  BarChart3,
  Users2,
  Mail,
  ArrowRight,
  CheckCircle,
  Star
} from "lucide-react";

const iconMap = {
  Calendar,
  Users,
  FileText,
  CreditCard,
  Building,
  Zap,
  BarChart3,
  Users2,
  Mail,
};

export default function Features() {
  const { data: features = [], isLoading } = useQuery({
    queryKey: ["/api/public/features"],
    retry: false,
  });

  const categories = [
    { id: 'booking', name: 'Booking Management', color: 'bg-blue-500' },
    { id: 'crm', name: 'Customer Relations', color: 'bg-green-500' },
    { id: 'proposals', name: 'Proposals & Contracts', color: 'bg-purple-500' },
    { id: 'payments', name: 'Payments & Billing', color: 'bg-yellow-500' },
    { id: 'venues', name: 'Venue Management', color: 'bg-red-500' },
    { id: 'ai', name: 'AI & Automation', color: 'bg-indigo-500' },
    { id: 'analytics', name: 'Analytics & Insights', color: 'bg-pink-500' },
    { id: 'team', name: 'Team Collaboration', color: 'bg-teal-500' },
    { id: 'communication', name: 'Communications', color: 'bg-orange-500' },
  ];

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
              <a className="text-foreground font-medium">Features</a>
            </Link>
            <Link href="/pricing">
              <a className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
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
            Everything You Need to Manage Your Venue
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            From initial inquiry to final payment, VENUIN provides comprehensive tools to streamline 
            every aspect of your venue management operation.
          </p>
          <div className="flex items-center justify-center gap-1 mb-8">
            {[1,2,3,4,5].map(i => (
              <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            ))}
            <span className="ml-2 text-sm text-muted-foreground">4.9/5 from 200+ venue owners</span>
          </div>
        </div>
      </section>

      {/* Features by Category */}
      <section className="container mx-auto px-4 pb-16">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="mt-4 text-muted-foreground">Loading features...</p>
          </div>
        ) : (
          <div className="space-y-16">
            {categories.map((category) => {
              const categoryFeatures = features.filter((f: any) => f.category === category.id);
              if (categoryFeatures.length === 0) return null;

              return (
                <div key={category.id} className="space-y-8">
                  <div className="text-center">
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${category.color} bg-opacity-10 mb-4`}>
                      <div className={`w-2 h-2 rounded-full ${category.color}`}></div>
                      <span className="font-medium text-sm">{category.name}</span>
                    </div>
                    <h2 className="text-3xl font-bold">{category.name}</h2>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categoryFeatures.map((feature: any) => {
                      const IconComponent = iconMap[feature.icon as keyof typeof iconMap] || Calendar;
                      
                      return (
                        <Card key={feature.id} className="h-full">
                          <CardHeader>
                            <div className="flex items-center gap-3 mb-2">
                              <div className="p-2 bg-primary/10 rounded-lg">
                                <IconComponent className="h-6 w-6 text-primary" />
                              </div>
                            </div>
                            <CardTitle className="text-xl">{feature.title}</CardTitle>
                            <CardDescription className="text-base">
                              {feature.description}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {feature.benefits?.map((benefit: string, idx: number) => (
                                <div key={idx} className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                                  <span>{benefit}</span>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Integration Features */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Powerful Integrations</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              VENUIN works seamlessly with the tools you already use
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold mb-2">Stripe Payments</h3>
                <p className="text-sm text-muted-foreground">
                  Secure payment processing with automated invoicing
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="bg-red-100 dark:bg-red-900 p-3 rounded-lg w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                  <Mail className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="font-semibold mb-2">Gmail Integration</h3>
                <p className="text-sm text-muted-foreground">
                  Automated email workflows and communication tracking
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold mb-2">Google AI</h3>
                <p className="text-sm text-muted-foreground">
                  Smart automation and intelligent insights
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-lg w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold mb-2">Calendar Sync</h3>
                <p className="text-sm text-muted-foreground">
                  Two-way calendar synchronization with Google Calendar
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Your Venue Management?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join hundreds of venue owners who have streamlined their operations with VENUIN's comprehensive feature set.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8">
                Start Your Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" size="lg" className="text-lg px-8">
                View Pricing Plans
              </Button>
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
              14-day free trial
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
              No setup fees
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
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