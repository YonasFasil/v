import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { clearTenantCache } from "@/lib/queryClient";
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
  Building2,
  LogOut
} from "lucide-react";

const navigationItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: "dashboard" },
  { name: "Events & Bookings", href: "/events", icon: Calendar, permission: "bookings" },
  { name: "Customers", href: "/customers", icon: Users, permission: "customers" },
  { name: "Leads", href: "/leads", icon: UserPlus, permission: "customers" },
  { name: "Proposals", href: "/proposals", icon: FileText, permission: "proposals" },
  { name: "Payments", href: "/payments", icon: CreditCard, permission: "payments" },
  { name: "Tasks & Team", href: "/tasks", icon: CheckSquare, permission: "tasks" },
  { name: "Venues", href: "/venues", icon: MapPin, permission: "venues" },
  { name: "Setup Styles", href: "/setup-styles", icon: Grid3X3, permission: "venues" },
  { name: "Packages & Services", href: "/packages", icon: Package, permission: "venues" },
];

const aiFeatures = [
  { name: "AI Analytics & Reports", href: "/ai-analytics", icon: BarChart3, permission: "settings" },
  { name: "Voice Booking", href: "/voice-booking", icon: Mic, permission: "bookings" },
];

const analyticsItems = [
  { name: "Reports & Analytics", href: "/reports", icon: BarChart3, permission: "settings" },
  { name: "Settings", href: "/settings", icon: Settings, permission: "settings" },
];

const adminItems = [
  { name: "User Management", href: "/users", icon: Users, permission: "users" },
];

interface SidebarProps {
  collapsed?: boolean;
}

export function Sidebar({ collapsed = false }: SidebarProps) {
  const [location, setLocation] = useLocation();
  const { user, hasPermission, canView, isTenantAdmin } = usePermissions();

  const isActive = (href: string) => {
    if (href === "/") {
      return location === "/";
    }
    return location.startsWith(href);
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'tenant_admin': return 'Tenant Admin';
      case 'tenant_user': return 'Venue Manager';
      default: return 'User';
    }
  };

  const handleLogout = () => {
    // Clear tenant cache to prevent cross-contamination
    clearTenantCache();
    
    // Clear tokens from localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('super_admin_token');
    
    // Redirect to appropriate login page
    if (user?.role === 'super_admin') {
      setLocation('/super-admin/login');
    } else {
      setLocation('/login');
    }
  };

  return (
    <div className={`${collapsed ? 'w-16' : 'w-64'} h-full bg-white border-r border-slate-200 flex flex-col transition-all duration-300`}>
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
          {navigationItems.filter(item => hasPermission(item.permission)).map((item) => {
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
        {!collapsed && aiFeatures.some(item => hasPermission(item.permission)) && (
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
            {aiFeatures.filter(item => hasPermission(item.permission)).map((item) => {
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
            {aiFeatures.filter(item => hasPermission(item.permission)).map((item) => {
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
        {!collapsed && analyticsItems.some(item => hasPermission(item.permission)) && (
          <div className="pt-4">
            <div className="px-3 mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Analytics
              </span>
            </div>
            {analyticsItems.filter(item => hasPermission(item.permission)).map((item) => {
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

        {/* Admin Section - Only for users with admin permissions */}
        {!collapsed && adminItems.some(item => hasPermission(item.permission)) && (
          <div className="pt-4">
            <div className="px-3 mb-2">
              <div className="flex items-center">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Administration
                </span>
                <div className="ml-2 px-2 py-0.5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full">
                  <span className="text-xs text-white font-medium">ADMIN</span>
                </div>
              </div>
            </div>
            {adminItems.filter(item => hasPermission(item.permission)).map((item) => {
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
            {analyticsItems.filter(item => hasPermission(item.permission)).map((item) => {
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
            
            {/* Admin items for collapsed sidebar - only for users with admin permissions */}
            {adminItems.filter(item => hasPermission(item.permission)).map((item) => {
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
      <div className="border-t border-slate-200 p-4">
        {collapsed ? (
          <div className="flex flex-col items-center space-y-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center" title={user ? `${user.name} - ${getRoleDisplayName(user.role)}` : 'User'}>
              <span className="text-sm font-medium text-blue-700">
                {user ? getUserInitials(user.name) : 'U'}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-blue-700">
                  {user ? getUserInitials(user.name) : 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {user ? user.name : 'Loading...'}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {user ? getRoleDisplayName(user.role) : 'User'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
