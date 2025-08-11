import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTenantFeatures } from "@/hooks/useTenantFeatures";
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  UserPlus,
  FileText, 
  CreditCard, 
  CheckSquare,
  Building,
  Package,
  Settings,
  BarChart3,
  X,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Dynamic navigation based on tenant features
const getDynamicNavigationItems = (hasFeature: (feature: string) => boolean, isLoading: boolean) => {
  const items = [];
  
  // Always show Dashboard
  items.push({ name: "Dashboard", href: "/", icon: LayoutDashboard });
  
  // Enterprise features
  if (isLoading || hasFeature("event-management")) {
    items.push({ name: "Events & Bookings", href: "/events", icon: Calendar });
  }
  if (isLoading || hasFeature("customer-management")) {
    items.push({ name: "Customers", href: "/customers", icon: Users });
  }
  if (isLoading || hasFeature("lead-management")) {
    items.push({ name: "Leads", href: "/leads", icon: UserPlus });
  }
  if (isLoading || hasFeature("proposal-system")) {
    items.push({ name: "Proposals", href: "/proposals", icon: FileText });
  }
  if (isLoading || hasFeature("stripe-payments")) {
    items.push({ name: "Payments", href: "/payments", icon: CreditCard });
  }
  if (isLoading || hasFeature("task-management")) {
    items.push({ name: "Tasks & Team", href: "/tasks", icon: CheckSquare });
  }
  if (isLoading || hasFeature("venue-management")) {
    items.push({ name: "Venues", href: "/venues", icon: Building });
  }
  if (isLoading || hasFeature("service-packages")) {
    items.push({ name: "Packages & Services", href: "/packages", icon: Package });
  }
  if (isLoading || hasFeature("ai-insights") || hasFeature("advanced-reporting")) {
    items.push({ name: "Reports & Insights", href: "/reports", icon: BarChart3 });
  }
  
  // Always show Settings
  items.push({ name: "Settings", href: "/settings", icon: Settings });
  
  return items;
};

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const [location] = useLocation();
  const { toast } = useToast();
  const { hasFeature, isLoading } = useTenantFeatures();
  
  const navigationItems = getDynamicNavigationItems(hasFeature, isLoading);
  
  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/logout"),
    onSuccess: () => {
      toast({
        title: "Logged out successfully",
        description: "You have been logged out.",
      });
      // Redirect to home page
      window.location.href = "/";
    },
    onError: (error: any) => {
      toast({
        title: "Logout failed", 
        description: error.message || "Failed to logout",
        variant: "destructive",
      });
    }
  });

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

        {/* User Actions */}
        <div className="px-4 py-4 border-t border-slate-200 mt-4">
          <div className="space-y-3">
            {/* User Info */}
            <div className="flex items-center space-x-3 px-3 py-2 bg-slate-50 rounded-lg">
              <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center">
                <span className="text-slate-600 font-medium text-sm">JD</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">John Doe</p>
                <p className="text-xs text-slate-500 truncate">Venue Manager</p>
              </div>
            </div>
            
            {/* Quick Actions */}
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
            
            {/* Logout Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {logoutMutation.isPending ? "Logging out..." : "Logout"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}