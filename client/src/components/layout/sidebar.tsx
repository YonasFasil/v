import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  UserPlus,
  FileText, 
  CreditCard, 
  CheckSquare,
  MapPin,
  Package,
  Zap,
  Mail,
  BarChart3,
  Star,
  Settings,
  Mic,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  Crown,
  LogOut
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

const navigationItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Events & Bookings", href: "/events", icon: Calendar },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Leads", href: "/leads", icon: UserPlus },
  { name: "Proposals", href: "/proposals", icon: FileText },
  { name: "Payments", href: "/payments", icon: CreditCard },
  { name: "Tasks & Team", href: "/tasks", icon: CheckSquare },
  { name: "Venues", href: "/venues", icon: MapPin },
  { name: "Setup Styles", href: "/setup-styles", icon: Grid3X3 },
  { name: "Packages & Services", href: "/packages", icon: Package },
];

const aiFeatures = [
  { name: "AI Analytics & Reports", href: "/ai-analytics", icon: BarChart3 },
  { name: "Voice Booking", href: "/voice-booking", icon: Mic },
];

const analyticsItems = [
  { name: "Reports & Analytics", href: "/reports", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

const planItems = [
  { name: "Plan & Billing", href: "/plan", icon: Crown },
];

interface SidebarProps {
  collapsed?: boolean;
}

export function Sidebar({ collapsed = false }: SidebarProps) {
  const [location] = useLocation();
  
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

  return (
    <div className={`${collapsed ? 'w-16' : 'w-64'} bg-white border-r border-slate-200 flex flex-col transition-all duration-300`}>
      {/* Logo and Brand */}
      <div className="flex items-center px-6 py-4 border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">V</span>
          </div>
          {!collapsed && <span className="text-xl font-semibold text-slate-900">Venuine</span>}
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-4 space-y-1 sidebar-scroll overflow-y-auto">
        {/* Main Navigation */}
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={`${collapsed ? 
                    'flex items-center justify-center w-10 h-10 mx-auto rounded-lg text-sm font-medium transition-colors cursor-pointer' :
                    'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer'
                  } ${
                    active
                      ? "bg-blue-600 text-white"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                  title={collapsed ? item.name : undefined}
                >
                  <Icon className={collapsed ? "w-5 h-5" : "w-5 h-5 mr-3"} />
                  {!collapsed && item.name}
                </div>
              </Link>
            );
          })}
        </div>

        {/* AI Features Section */}
        {!collapsed && (
          <div className="pt-4">
            <div className="px-3 mb-2">
              <div className="flex items-center">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  AI Features
                </span>
                <div className="ml-2 px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
                  <span className="text-xs text-white font-medium">NEW</span>
                </div>
              </div>
            </div>
            {aiFeatures.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link key={item.name} href={item.href}>
                  <div
                    className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      active
                        ? "bg-blue-600 text-white"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                    title={collapsed ? item.name : undefined}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {!collapsed && item.name}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
        
        {/* AI Features - Collapsed Icons Only */}
        {collapsed && (
          <div className="pt-4 space-y-1">
            {aiFeatures.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link key={item.name} href={item.href}>
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      active
                        ? "bg-blue-600 text-white"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                    title={item.name}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Analytics Section - Expanded */}
        {!collapsed && (
          <div className="pt-4">
            <div className="px-3 mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Analytics
              </span>
            </div>
            {analyticsItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link key={item.name} href={item.href}>
                  <div
                    className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
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
          </div>
        )}

        {/* Analytics Section - Collapsed */}
        {collapsed && (
          <div className="pt-4 space-y-1">
            {analyticsItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link key={item.name} href={item.href}>
                  <div
                    className={`flex items-center justify-center w-10 h-10 mx-auto rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      active
                        ? "bg-blue-600 text-white"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                    title={item.name}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Plan & Billing Section - Expanded */}
        {!collapsed && (
          <div className="pt-4">
            <div className="px-3 mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Account
              </span>
            </div>
            {planItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link key={item.name} href={item.href}>
                  <div
                    className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
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
          </div>
        )}

        {/* Plan & Billing Section - Collapsed */}
        {collapsed && (
          <div className="pt-4 space-y-1">
            {planItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link key={item.name} href={item.href}>
                  <div
                    className={`flex items-center justify-center w-10 h-10 mx-auto rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      active
                        ? "bg-blue-600 text-white"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                    title={item.name}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      {/* User Profile */}
      <div className="border-t border-slate-200 p-4 space-y-3">
        {collapsed ? (
          <>
            <div className="flex justify-center">
              <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center" title="John Doe - Venue Manager">
                <span className="text-sm font-medium text-slate-700">JD</span>
              </div>
            </div>
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="w-8 h-8 p-0 hover:bg-red-50"
                title="Logout"
              >
                <LogOut className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-slate-700">JD</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">John Doe</p>
                <p className="text-xs text-slate-500 truncate">Venue Manager</p>
              </div>
            </div>
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
          </>
        )}
      </div>
    </div>
  );
}
