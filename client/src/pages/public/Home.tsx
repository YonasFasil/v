import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Calendar, 
  Users, 
  TrendingUp, 
  Zap, 
  Shield, 
  Globe, 
  ArrowRight,
  Play,
  CheckCircle,
  Star,
  Brain,
  MessageSquare,
  CreditCard,
  ChevronRight
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <Calendar className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-semibold text-gray-900">VENUIN</span>
              </div>
              <div className="hidden md:flex space-x-8">
                <Link href="/features" className="text-gray-700 hover:text-gray-900 font-medium">Features</Link>
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
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <Badge variant="outline" className="mb-6 text-blue-600 border-blue-200 bg-blue-50">
            New: AI-powered venue management
          </Badge>
          
          <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            The future of
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              venue management
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            Transform your venue business with intelligent booking management, 
            automated workflows, and powerful analytics. Trusted by hundreds of venues worldwide.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link href="/signup">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full text-lg font-medium">
                Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="px-8 py-4 rounded-full text-lg font-medium border-gray-300">
              <Play className="mr-2 h-5 w-5" /> Watch Demo
            </Button>
          </div>
          
          {/* Hero Image/Video Placeholder */}
          <div className="relative">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-1">
              <div className="bg-gray-900 rounded-3xl aspect-video flex items-center justify-center">
                <Play className="h-20 w-20 text-white opacity-80" />
              </div>
            </div>
            {/* Floating cards */}
            <div className="absolute -top-4 -left-4 bg-white rounded-2xl shadow-xl p-4 hidden lg:block">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Booking Confirmed</p>
                  <p className="text-sm text-gray-600">Grand Ballroom - Dec 15</p>
                </div>
              </div>
            </div>
            
            <div className="absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-xl p-4 hidden lg:block">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Revenue Up 34%</p>
                  <p className="text-sm text-gray-600">This quarter</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Everything you need to manage your venue
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From booking management to payment processing, VENUIN provides all the tools 
              to streamline your operations and grow your business.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: "AI-Powered Insights",
                description: "Get intelligent recommendations and automated workflows powered by advanced AI",
                color: "bg-purple-100 text-purple-600"
              },
              {
                icon: Calendar,
                title: "Smart Booking System",
                description: "Manage bookings, availability, and scheduling with our intuitive calendar interface",
                color: "bg-blue-100 text-blue-600"
              },
              {
                icon: Users,
                title: "Customer Management",
                description: "Track customer relationships, preferences, and booking history in one place",
                color: "bg-green-100 text-green-600"
              },
              {
                icon: CreditCard,
                title: "Integrated Payments",
                description: "Accept payments, manage deposits, and handle refunds with Stripe integration",
                color: "bg-orange-100 text-orange-600"
              },
              {
                icon: MessageSquare,
                title: "Communication Hub",
                description: "Automated email workflows and centralized communication management",
                color: "bg-pink-100 text-pink-600"
              },
              {
                icon: TrendingUp,
                title: "Advanced Analytics",
                description: "Track performance, revenue trends, and key metrics with detailed reports",
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

      {/* Social Proof */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-600 mb-8">Trusted by venue owners worldwide</p>
          <div className="flex items-center justify-center space-x-2 mb-8">
            {[1,2,3,4,5].map(i => (
              <Star key={i} className="h-6 w-6 fill-yellow-400 text-yellow-400" />
            ))}
            <span className="ml-4 text-gray-900 font-semibold">4.9/5 from 500+ reviews</span>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                quote: "VENUIN transformed how we manage our venue. The AI features save us hours every week.",
                author: "Sarah Chen",
                role: "Event Manager, Grand Palace"
              },
              {
                quote: "The booking system is intuitive and our clients love the professional proposals.",
                author: "Michael Rodriguez",
                role: "Owner, Riverside Events"
              },
              {
                quote: "Revenue tracking and analytics help us make better business decisions every day.",
                author: "Emily Johnson",
                role: "Operations Director, Metro Center"
              }
            ].map((testimonial, index) => (
              <Card key={index} className="border border-gray-200">
                <CardContent className="p-6">
                  <p className="text-gray-700 mb-4 italic">"{testimonial.quote}"</p>
                  <div className="text-sm">
                    <p className="font-semibold text-gray-900">{testimonial.author}</p>
                    <p className="text-gray-600">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-5xl font-bold text-white mb-6">
            Ready to transform your venue?
          </h2>
          <p className="text-xl text-blue-100 mb-10">
            Join hundreds of venues already using VENUIN to streamline operations and grow their business.
          </p>
          <Link href="/signup">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-50 px-8 py-4 rounded-full text-lg font-medium">
              Start Your Free Trial <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <p className="text-blue-100 mt-4">
            14-day free trial • No credit card required • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Calendar className="h-6 w-6 text-blue-400" />
                <span className="text-xl font-semibold">VENUIN</span>
              </div>
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