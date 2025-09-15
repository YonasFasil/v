import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { 
  ChevronRight, 
  Calendar, 
  Users, 
  Package, 
  FileText, 
  Bot, 
  BarChart2,
  ArrowRight,
  TrendingUp,
  Briefcase,
  ClipboardCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

// New Animated Background Component
const FinancialBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    let icons: Icon[] = [];

    const iconSvgs = [
      // Simple Bar Chart
      `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>`,
      // Simple Line Graph
      `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 16 10 8 8 12 2 12"></polyline></svg>`,
      // Simple Calendar Icon
      `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`,
      // Simple Dollar Sign
      `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`
    ];

    const iconImages = iconSvgs.map(svgString => {
      const img = new Image();
      img.src = `data:image/svg+xml;base64,${btoa(svgString)}`;
      return img;
    });

    class Icon {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      image: HTMLImageElement;
      angle: number;
      rotationSpeed: number;

      constructor() {
        this.size = Math.random() * 20 + 20;
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        this.image = iconImages[Math.floor(Math.random() * iconImages.length)];
        this.angle = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.01;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.angle += this.rotationSpeed;

        if (this.x < -this.size) this.x = width + this.size;
        if (this.x > width + this.size) this.x = -this.size;
        if (this.y < -this.size) this.y = height + this.size;
        if (this.y > height + this.size) this.y = -this.size;
      }

      draw() {
        if (!ctx) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.globalAlpha = 0.1;
        ctx.drawImage(this.image, -this.size / 2, -this.size / 2, this.size, this.size);
        ctx.restore();
      }
    }

    function init() {
      icons = [];
      const numberOfIcons = Math.floor((width * height) / 40000);
      for (let i = 0; i < numberOfIcons; i++) {
        icons.push(new Icon());
      }
    }

    function animate() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      icons.forEach(icon => {
        icon.update();
        icon.draw();
      });
      requestAnimationFrame(animate);
    }

    function handleResize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      init();
    }

    window.addEventListener('resize', handleResize);
    init();
    
    // Ensure images are loaded before starting animation
    let loadedCount = 0;
    iconImages.forEach(img => {
      img.onload = () => {
        loadedCount++;
        if (loadedCount === iconImages.length) {
          animate();
        }
      };
    });

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full z-0"></canvas>;
};

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const features = [
    {
      icon: <Calendar className="w-8 h-8 text-blue-600" />,
      title: "Effortless Event Scheduling",
      description: "Our intuitive, drag-and-drop calendar is the command center for your venue. Visualize your entire schedule, identify open slots, and resolve conflicts before they happen. Manage everything from single-day meetings to complex multi-day weddings with ease."
    },
    {
      icon: <Users className="w-8 h-8 text-green-600" />,
      title: "Intelligent Customer Management",
      description: "Transform client data into lasting relationships. Our integrated CRM provides a 360-degree view of every customer, tracking communications, booking history, and preferences to help you deliver exceptional, personalized service that drives repeat business."
    },
    {
      icon: <Package className="w-8 h-8 text-purple-600" />,
      title: "Dynamic Packages & Services",
      description: "Design and sell the perfect event experiences. Create tiered packages, offer a la carte services, and manage pricing with unparalleled flexibility. Our system handles complex tax and fee calculations, so you can focus on creating value for your clients."
    },
    {
      icon: <FileText className="w-8 h-8 text-orange-600" />,
      title: "Streamlined Proposals & Contracts",
      description: "Accelerate your sales cycle. Generate stunning, professional proposals in minutes, complete with digital signatures. Seamlessly convert signed proposals into detailed contracts and bookings, eliminating manual data entry and errors."
    },
    {
      icon: <Bot className="w-8 h-8 text-pink-600" />,
      title: "AI-Powered Efficiency",
      description: "Welcome to the future of venue management. Use natural voice commands to create bookings, get smart scheduling recommendations, and receive AI-driven insights to optimize your operations and pricing strategies."
    },
    {
      icon: <BarChart2 className="w-8 h-8 text-yellow-600" />,
      title: "Actionable Business Analytics",
      description: "Make decisions with confidence. Our analytics dashboard provides a real-time view of your key performance indicators. Track revenue, occupancy rates, and booking trends to identify growth opportunities and maximize profitability."
    }
  ];

  return (
    <div className="bg-white text-gray-800 font-sans">
      <FinancialBackground />
      <div className="relative z-10">
        <header className={cn("fixed top-0 left-0 right-0 z-50 transition-all duration-300", isScrolled ? 'bg-white/80 backdrop-blur-sm shadow-md' : 'bg-transparent')}>
          <div className="container mx-auto px-6 py-4 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">VenuinePro</h1>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Process</a>
              <a href="#pricing" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Pricing</a>
            </nav>
            <div className="flex items-center space-x-4">
              <Button asChild variant="ghost" size="lg" className="hidden md:flex text-lg">
                <a href="/tenant-login">Login</a>
              </Button>
              <Button size="lg" className="hidden md:flex bg-blue-600 hover:bg-blue-700 text-white text-lg">Get Started</Button>
            </div>
          </div>
        </header>

        <section className="min-h-screen flex items-center pt-20">
          <div className="container mx-auto px-6 text-center">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-5xl md:text-7xl font-bold text-gray-900 leading-tight mb-6">
                The Operating System for Your Venue.
              </h2>
              <p className="text-lg md:text-xl text-gray-600 mb-10">
                VenuinePro is the all-in-one platform that unifies your bookings, clients, and financials, empowering you to grow your business with unprecedented efficiency and insight.
              </p>
              <div className="flex justify-center items-center space-x-4">
                <Button size="lg" className="text-lg px-8 py-6 bg-blue-600 hover:bg-blue-700 text-white">
                  Start Your Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                  Request a Demo
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-24 bg-gray-50">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h3 className="text-4xl md:text-5xl font-bold text-gray-900">A Smarter Way to Work</h3>
              <p className="text-lg text-gray-600 mt-4 max-w-3xl mx-auto">VenuinePro is engineered to solve the unique challenges of venue management, replacing complexity with clarity and manual tasks with intelligent automation.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {features.map((feature, index) => (
                <div key={index} className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                  <div className="mb-5">{feature.icon}</div>
                  <h4 className="text-2xl font-semibold text-gray-900 mb-3">{feature.title}</h4>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-24">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h3 className="text-4xl md:text-5xl font-bold text-gray-900">Effortless from Day One</h3>
              <p className="text-lg text-gray-600 mt-4">Our streamlined process gets you from setup to success in record time.</p>
            </div>
            <div className="relative">
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gray-200"></div>
              <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="text-center">
                  <div className="relative bg-white">
                    <div className="mx-auto bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold text-blue-600 border-4 border-white">
                      <Briefcase className="w-8 h-8" />
                    </div>
                  </div>
                  <h4 className="text-2xl font-semibold text-gray-900 mt-6 mb-2">Configure Your Space</h4>
                  <p className="text-gray-600">Define your venues, services, and packages. Our intuitive interface makes setup a breeze.</p>
                </div>
                <div className="text-center">
                  <div className="relative bg-white">
                    <div className="mx-auto bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold text-blue-600 border-4 border-white">
                      <ClipboardCheck className="w-8 h-8" />
                    </div>
                  </div>
                  <h4 className="text-2xl font-semibold text-gray-900 mt-6 mb-2">Automate Your Bookings</h4>
                  <p className="text-gray-600">Streamline your workflow from inquiry to invoice, automating proposals, contracts, and payments.</p>
                </div>
                <div className="text-center">
                  <div className="relative bg-white">
                    <div className="mx-auto bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold text-blue-600 border-4 border-white">
                      <TrendingUp className="w-8 h-8" />
                    </div>
                  </div>
                  <h4 className="text-2xl font-semibold text-gray-900 mt-6 mb-2">Maximize Your Revenue</h4>
                  <p className="text-gray-600">Utilize powerful analytics to optimize pricing, identify trends, and grow your business.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 bg-gray-50">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-4xl mx-auto">
              <h3 className="text-4xl md:text-5xl font-bold text-gray-900">Join the Venues of Tomorrow.</h3>
              <p className="text-lg text-gray-600 mt-6 mb-10">Step into the future of event management. VenuinePro gives you the tools, insights, and automation to not just compete, but to lead the market. Start your free trial and experience the difference.</p>
              <Button size="lg" className="text-lg px-8 py-6 bg-blue-600 hover:bg-blue-700 text-white">
                Claim Your Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </section>

        <footer className="bg-white border-t border-gray-200">
          <div className="container mx-auto px-6 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <h4 className="text-lg font-semibold mb-4 text-gray-900">VenuinePro</h4>
                <p className="text-gray-600">The complete solution for modern venue management.</p>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-4 text-gray-900">Product</h4>
                <ul className="space-y-2">
                  <li><a href="#features" className="text-gray-600 hover:text-gray-900">Features</a></li>
                  <li><a href="#pricing" className="text-gray-600 hover:text-gray-900">Pricing</a></li>
                  <li><a href="#" className="text-gray-600 hover:text-gray-900">Book a Demo</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-4 text-gray-900">Company</h4>
                <ul className="space-y-2">
                  <li><a href="#" className="text-gray-600 hover:text-gray-900">About Us</a></li>
                  <li><a href="#" className="text-gray-600 hover:text-gray-900">Careers</a></li>
                  <li><a href="#" className="text-gray-600 hover:text-gray-900">Contact</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-4 text-gray-900">Legal</h4>
                <ul className="space-y-2">
                  <li><a href="#" className="text-gray-600 hover:text-gray-900">Privacy Policy</a></li>
                  <li><a href="#" className="text-gray-600 hover:text-gray-900">Terms of Service</a></li>
                </ul>
              </div>
            </div>
            <div className="mt-8 border-t border-gray-200 pt-8 text-center text-gray-500">
              &copy; {new Date().getFullYear()} VenuinePro. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
