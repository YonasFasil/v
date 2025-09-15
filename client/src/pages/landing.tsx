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
  Zap,
  ArrowRight
} from "lucide-react";

// Animated background component
const AnimatedBackground = () => {
  useEffect(() => {
    const canvas = document.getElementById('animated-bg') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    let particles: Particle[] = [];

    class Particle {
      x: number;
      y: number;
      directionX: number;
      directionY: number;
      size: number;
      color: string;

      constructor(x: number, y: number, directionX: number, directionY: number, size: number, color: string) {
        this.x = x;
        this.y = y;
        this.directionX = directionX;
        this.directionY = directionY;
        this.size = size;
        this.color = color;
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
      }

      update() {
        if (this.x > width || this.x < 0) {
          this.directionX = -this.directionX;
        }
        if (this.y > height || this.y < 0) {
          this.directionY = -this.directionY;
        }
        this.x += this.directionX;
        this.y += this.directionY;
        this.draw();
      }
    }

    function init() {
      particles = [];
      const numberOfParticles = (width * height) / 9000;
      for (let i = 0; i < numberOfParticles; i++) {
        const size = Math.random() * 1.5 + 1;
        const x = Math.random() * (width - size * 2) + size;
        const y = Math.random() * (height - size * 2) + size;
        const directionX = (Math.random() * 0.4) - 0.2;
        const directionY = (Math.random() * 0.4) - 0.2;
        const color = 'rgba(255, 255, 255, 0.1)';
        particles.push(new Particle(x, y, directionX, directionY, size, color));
      }
    }

    function animate() {
      if (!ctx) return;
      requestAnimationFrame(animate);
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
      }
      connect();
    }

    function connect() {
      if (!ctx) return;
      let opacityValue = 1;
      for (let a = 0; a < particles.length; a++) {
        for (let b = a; b < particles.length; b++) {
          const distance = ((particles[a].x - particles[b].x) * (particles[a].x - particles[b].x))
            + ((particles[a].y - particles[b].y) * (particles[a].y - particles[b].y));
          if (distance < (width / 7) * (height / 7)) {
            opacityValue = 1 - (distance / 20000);
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacityValue * 0.1})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(particles[b].x, particles[b].y);
            ctx.stroke();
          }
        }
      }
    }

    function handleResize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      init();
    }

    window.addEventListener('resize', handleResize);
    init();
    animate();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return <canvas id="animated-bg" className="fixed top-0 left-0 w-full h-full z-0"></canvas>;
};

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
      icon: <Calendar className="w-8 h-8 text-blue-400" />,
      title: "Intuitive Event Calendar",
      description: "Visualize your entire event schedule with a powerful, drag-and-drop calendar. See bookings, availability, and conflicts at a glance, and manage your schedule with ease."
    },
    {
      icon: <Users className="w-8 h-8 text-green-400" />,
      title: "Advanced CRM",
      description: "Build lasting relationships with your clients. Track every interaction, from initial inquiry to post-event follow-up. Detailed analytics provide insights into customer behavior and lifetime value."
    },
    {
      icon: <Package className="w-8 h-8 text-purple-400" />,
      title: "Packages & Services",
      description: "Craft the perfect offerings for your clients. Create customizable event packages and a la carte services with granular control over pricing, taxes, and fees."
    },
    {
      icon: <FileText className="w-8 h-8 text-orange-400" />,
      title: "Proposals & Contracts",
      description: "Go from proposal to signed contract in record time. Generate professional, branded proposals, track their status in real-time, and convert them to bookings with a single click."
    },
    {
      icon: <Bot className="w-8 h-8 text-pink-400" />,
      title: "AI-Powered Assistance",
      description: "Work smarter, not harder. Leverage the power of AI to create bookings with voice commands, get smart scheduling suggestions, and receive intelligent insights into your business."
    },
    {
      icon: <BarChart2 className="w-8 h-8 text-yellow-400" />,
      title: "Insightful Analytics",
      description: "Unlock the stories your data is telling. Our comprehensive analytics dashboard helps you track revenue, monitor venue utilization, and identify trends to grow your business."
    }
  ];

  return (
    <div className="bg-gray-900 text-white">
      <AnimatedBackground />
      <div className="relative z-10">
        {/* Header */}
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-gray-900/80 backdrop-blur-sm shadow-lg' : 'bg-transparent'}`}>
          <div className="container mx-auto px-6 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold">VenuinePro</h1>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-300 hover:text-white transition-colors">How It Works</a>
              <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</a>
            </nav>
            <Button size="lg" className="hidden md:flex bg-blue-500 hover:bg-blue-600 text-white">Get Started</Button>
          </div>
        </header>

        {/* Hero Section */}
        <section className="min-h-screen flex items-center">
          <div className="container mx-auto px-6 text-center">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-5xl md:text-7xl font-bold leading-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                The Future of Venue Management is Here.
              </h2>
              <p className="text-lg md:text-xl text-gray-300 mb-10">
                VenuinePro is the all-in-one platform that streamlines your venue's operations, from booking and scheduling to customer management and analytics.
              </p>
              <div className="flex justify-center items-center space-x-4">
                <Button size="lg" className="text-lg px-8 py-6 bg-blue-500 hover:bg-blue-600 text-white">
                  Get Started for Free
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 text-white border-white hover:bg-white hover:text-gray-900">
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
              <h3 className="text-4xl md:text-5xl font-bold">Everything You Need, All in One Place.</h3>
              <p className="text-lg text-gray-400 mt-4">VenuinePro is packed with powerful features to help you run your venue more efficiently.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {features.map((feature, index) => (
                <div key={index} className="bg-gray-800 p-8 rounded-lg transform hover:scale-105 transition-transform duration-300">
                  <div className="flex items-center mb-4">
                    {feature.icon}
                    <h4 className="text-2xl font-semibold ml-4">{feature.title}</h4>
                  </div>
                  <p className="text-gray-400">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h3 className="text-4xl md:text-5xl font-bold">Get Started in Minutes.</h3>
              <p className="text-lg text-gray-400 mt-4">Our intuitive platform makes it easy to get up and running.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
              <div className="border border-gray-700 p-8 rounded-lg">
                <div className="text-5xl font-bold text-blue-400 mb-4">1</div>
                <h4 className="text-2xl font-semibold mb-2">Set Up Your Venue</h4>
                <p className="text-gray-400">Add your venues, spaces, and services. Our guided setup will have you ready to go in no time.</p>
              </div>
              <div className="border border-gray-700 p-8 rounded-lg">
                <div className="text-5xl font-bold text-blue-400 mb-4">2</div>
                <h4 className="text-2xl font-semibold mb-2">Create Your First Booking</h4>
                <p className="text-gray-400">Use our intuitive calendar or AI-powered voice booking to schedule your first event.</p>
              </div>
              <div className="border border-gray-700 p-8 rounded-lg">
                <div className="text-5xl font-bold text-blue-400 mb-4">3</div>
                <h4 className="text-2xl font-semibold mb-2">Grow Your Business</h4>
                <p className="text-gray-400">Leverage our powerful analytics and CRM tools to increase bookings and revenue.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h3 className="text-4xl md:text-5xl font-bold">Loved by Venue Managers Everywhere.</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-gray-800 p-8 rounded-lg">
                <p className="text-gray-400 mb-6">"VenuinePro has transformed how we manage our bookings. It's so intuitive and has saved us countless hours."</p>
                <div className="font-semibold">- Sarah L., Event Coordinator</div>
              </div>
              <div className="bg-gray-800 p-8 rounded-lg">
                <p className="text-gray-400 mb-6">"The AI features are a game-changer. I can create bookings with just my voice, which is incredible."</p>
                <div className="font-semibold">- Michael B., Venue Owner</div>
              </div>
              <div className="bg-gray-800 p-8 rounded-lg">
                <p className="text-gray-400 mb-6">"The analytics are incredibly detailed and have helped us identify new revenue opportunities."</p>
                <div className="font-semibold">- Emily C., Operations Manager</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <div className="container mx-auto px-6 text-center">
            <h3 className="text-4xl md:text-5xl font-bold mb-6">Ready to Take Control of Your Venue?</h3>
            <p className="text-lg md:text-xl mb-10">Join hundreds of satisfied venue managers and start your free trial today.</p>
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6 bg-white text-blue-600 hover:bg-gray-200">
              Sign Up Now
              <ArrowRight className="w-5 h-5 ml-2" />
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
            <div className="mt-8 border-t border-gray-700 pt-8 text-center text-gray-500">
              &copy; {new Date().getFullYear()} VenuinePro. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}