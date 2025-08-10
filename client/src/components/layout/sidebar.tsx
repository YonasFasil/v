import { Link, useLocation } from "wouter";
import { useUserRole } from "@/hooks/useUserRole";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  LogOut,
  Crown,
  UserCheck
} from "lucide-react";

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

interface SidebarProps {
  collapsed?: boolean;
}

export function Sidebar({ collapsed = false }: SidebarProps) {
  const [location] = useLocation();
  const { userRoleData, isAdmin, isStaff, hasPermission, logout } = useUserRole();

  const isActive = (href: string) => {
    if (href === "/") {
      return location === "/";
    }
    return location.startsWith(href);
  };

  // Filter navigation items based on user permissions
  const getFilteredNavigation = () => {
    return navigationItems.filter(item => {
      switch (item.href) {
        case "/venues":
          return hasPermission("manage_venues") || hasPermission("view_venues");
        case "/setup-styles":
          return hasPermission("manage_venues");
        case "/packages":
          return hasPermission("manage_packages") || hasPermission("view_packages");
        case "/leads":
          return hasPermission("view_customers");
        default:
          return true; // Basic pages like dashboard, events, customers, proposals are always visible
      }
    });
  };

  const getFilteredAIFeatures = () => {
    return aiFeatures.filter(item => {
      switch (item.href) {
        case "/ai-analytics":
          return hasPermission("ai_insights");
        case "/voice-booking":
          return hasPermission("create_bookings");
        default:
          return true;
      }
    });
  };

  const getFilteredAnalytics = () => {
    return analyticsItems.filter(item => {
      switch (item.href) {
        case "/settings":
          return hasPermission("system_settings");
        default:
          return hasPermission("basic_reports") || hasPermission("advanced_reports");
      }
    });
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

      {/* User Role Display */}
      {!collapsed && userRoleData && (
        <div className="px-4 py-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            {isAdmin ? (
              <Crown className="w-4 h-4 text-purple-600" />
            ) : (
              <UserCheck className="w-4 h-4 text-blue-600" />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-900">{userRoleData.name}</span>
                <Badge variant={isAdmin ? "default" : "secondary"} className="text-xs">
                  {userRoleData.name}
                </Badge>
              </div>
              <p className="text-xs text-slate-600">{userRoleData.title}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-4 space-y-1 sidebar-scroll overflow-y-auto">
        {/* Main Navigation */}
        <div className="space-y-1">
          {getFilteredNavigation().map((item) => {
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
            {getFilteredAIFeatures().map((item) => {
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
            {getFilteredAnalytics().map((item) => {
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
            {getFilteredAnalytics().map((item) => {
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

      {/* Logout Button */}
      <div className="border-t border-slate-200 p-4">
        {collapsed ? (
          <Button
            onClick={logout}
            variant="ghost"
            size="sm"
            className="w-full flex justify-center p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        ) : (
          <Button
            onClick={logout}
            variant="ghost"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Switch User
          </Button>
        )}
      </div>
    </div>
  );
}
