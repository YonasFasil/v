import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  ChevronRight, 
  Calendar, 
  Users, 
  Package, 
  FileText, 
  Bot, 
  BarChart2,
  ShieldCheck,
  Zap
} from "lucide-react";

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const features = [
    {
      icon: <Calendar className="w-8 h-8 text-blue-500" />,
      title: "Intuitive Event Calendar",
      description: "Visualize and manage your entire event schedule with a powerful, easy-to-use calendar interface. Drag, drop, and edit bookings with ease."
    },
    {
      icon: <Users className="w-8 h-8 text-green-500" />,
      title: "Advanced CRM",
      description: "Keep track of all your clients, from leads to loyal customers. View detailed analytics and booking history to provide personalized service."
    },
    {
      icon: <Package className="w-8 h-8 text-purple-500" />,
      title: "Packages & Services",
      description: "Create, customize, and manage event packages and a la carte services. Set pricing, taxes, and fees with granular control."
    },
    {
      icon: <FileText className="w-8 h-8 text-orange-500" />,
      title: "Proposals & Contracts",
      description: "Generate professional proposals and contracts in minutes. Track their status from sent to signed, and convert them to bookings with a single click."
    },
    {
      icon: <Bot className="w-8 h-8 text-pink-500" />,
      title: "AI-Powered Assistance",
      description: "Leverage the power of AI to streamline your workflow. Use voice commands to create bookings, get smart scheduling suggestions, and more."
    },
    {
      icon: <BarChart2 className="w-8 h-8 text-yellow-500" />,
      title: "Insightful Analytics",
      description: "Make data-driven decisions with comprehensive analytics. Track revenue, venue utilization, and customer lifetime value to grow your business."
    }
  ];

  return (
    <div className="bg-white text-gray-800">
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/80 backdrop-blur-sm shadow-md' : 'bg-transparent'}`}>
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">VenuinePro</h1>
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-600 hover:text-blue-500 transition-colors">Features</a>
            <a href="#how-it-works" className="text-gray-600 hover:text-blue-500 transition-colors">How It Works</a>
            <a href="#pricing" className="text-gray-600 hover:text-blue-500 transition-colors">Pricing</a>
          </nav>
          <Button size="lg" className="hidden md:flex">Get Started</Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center bg-gray-50 pt-20">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl md:text-7xl font-bold text-gray-900 leading-tight mb-6">
              The Future of Venue Management is Here.
            </h2>
            <p className="text-lg md:text-xl text-gray-600 mb-10">
              VenuinePro is the all-in-one platform that streamlines your venue's operations, from booking and scheduling to customer management and analytics.
            </p>
            <div className="flex justify-center items-center space-x-4">
              <Button size="lg" className="text-lg px-8 py-6">
                Get Started for Free
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                Request a Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h3 className="text-4xl md:text-5xl font-bold text-gray-900">Everything You Need, All in One Place.</h3>
            <p className="text-lg text-gray-600 mt-4">VenuinePro is packed with powerful features to help you run your venue more efficiently.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center items-center mb-4">
                  {feature.icon}
                </div>
                <h4 className="text-2xl font-semibold text-gray-900 mb-2">{feature.title}</h4>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h3 className="text-4xl md:text-5xl font-bold text-gray-900">Get Started in Minutes.</h3>
            <p className="text-lg text-gray-600 mt-4">Our intuitive platform makes it easy to get up and running.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div className="relative">
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white border-2 border-blue-500 rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold text-blue-500">1</div>
              <div className="bg-white p-8 rounded-lg shadow-md h-full">
                <h4 className="text-2xl font-semibold text-gray-900 mb-2 mt-8">Set Up Your Venue</h4>
                <p className="text-gray-600">Add your venues, spaces, and services. Our guided setup will have you ready to go in no time.</p>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white border-2 border-blue-500 rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold text-blue-500">2</div>
              <div className="bg-white p-8 rounded-lg shadow-md h-full">
                <h4 className="text-2xl font-semibold text-gray-900 mb-2 mt-8">Create Your First Booking</h4>
                <p className="text-gray-600">Use our intuitive calendar or AI-powered voice booking to schedule your first event.</p>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white border-2 border-blue-500 rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold text-blue-500">3</div>
              <div className="bg-white p-8 rounded-lg shadow-md h-full">
                <h4 className="text-2xl font-semibold text-gray-900 mb-2 mt-8">Grow Your Business</h4>
                <p className="text-gray-600">Leverage our powerful analytics and CRM tools to increase bookings and revenue.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h3 className="text-4xl md:text-5xl font-bold text-gray-900">Loved by Venue Managers Everywhere.</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-8 rounded-lg">
              <p className="text-gray-600 mb-6">"VenuinePro has transformed how we manage our bookings. It's so intuitive and has saved us countless hours."</p>
              <div className="font-semibold text-gray-900">- Sarah L., Event Coordinator</div>
            </div>
            <div className="bg-gray-50 p-8 rounded-lg">
              <p className="text-gray-600 mb-6">"The AI features are a game-changer. I can create bookings with just my voice, which is incredible."</p>
              <div className="font-semibold text-gray-900">- Michael B., Venue Owner</div>
            </div>
            <div className="bg-gray-50 p-8 rounded-lg">
              <p className="text-gray-600 mb-6">"The analytics are incredibly detailed and have helped us identify new revenue opportunities."</p>
              <div className="font-semibold text-gray-900">- Emily C., Operations Manager</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="container mx-auto px-6 text-center">
          <h3 className="text-4xl md:text-5xl font-bold mb-6">Ready to Take Control of Your Venue?</h3>
          <p className="text-lg md:text-xl mb-10">Join hundreds of satisfied venue managers and start your free trial today.</p>
          <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
            Sign Up Now
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-lg font-semibold mb-4">VenuinePro</h4>
              <p className="text-gray-400">The complete solution for modern venue management.</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-400 hover:text-white">Features</a></li>
                <li><a href="#pricing" className="text-gray-400 hover:text-white">Pricing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Book a Demo</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">About Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Careers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-800 pt-8 text-center text-gray-500">
            &copy; {new Date().getFullYear()} VenuinePro. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
