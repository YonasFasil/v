import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  FileText, 
  CreditCard, 
  CheckSquare,
  Building,
  Package,
  Settings,
  BarChart3,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navigationItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Events & Bookings", href: "/events", icon: Calendar },
  { name: "Customers & Leads", href: "/customers", icon: Users },
  { name: "Proposals & Contracts", href: "/proposals", icon: FileText },
  { name: "Payments", href: "/payments", icon: CreditCard },
  { name: "Tasks & Team", href: "/tasks", icon: CheckSquare },
  { name: "Venues", href: "/venues", icon: Building },
  { name: "Packages & Services", href: "/packages", icon: Package },
  { name: "Reports & Insights", href: "/reports", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const [location] = useLocation();

  const isActive = (href: string) => {
    if (href === "/") {
      return location === "/";
    }
    return location.startsWith(href);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden"
        onClick={onClose}
      />
      
      {/* Mobile Nav Panel */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 z-50 lg:hidden transform transition-transform duration-300 ease-in-out">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">V</span>
            </div>
            <span className="text-xl font-semibold text-slate-900">Venuine</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="px-4 py-4 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link key={item.name} href={item.href}>
                <div
                  onClick={onClose}
                  className={`flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    active
                      ? "bg-blue-600 text-white"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Quick Actions */}
        <div className="px-4 py-4 border-t border-slate-200 mt-4">
          <div className="space-y-2">
            <Button 
              onClick={() => {
                console.log('Mobile nav: New Event clicked');
                window.location.href = '/events';
                onClose();
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Calendar className="w-4 h-4 mr-2" />
              New Event
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}