import { Search, Bell, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface HeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function Header({ title, subtitle, action }: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 px-3 sm:px-6 py-3 sm:py-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-2xl font-semibold text-slate-900 truncate">{title}</h1>
          {subtitle && (
            <p className="text-xs sm:text-sm text-slate-600 mt-1 hidden sm:block">{subtitle}</p>
          )}
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Search Bar - Hidden on mobile */}
          <div className="relative hidden md:block">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <Input
              type="text"
              className="block w-64 lg:w-80 pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
              placeholder="Search events, customers, or venues..."
            />
          </div>

          {/* Mobile Search Button */}
          <button className="md:hidden p-2 text-slate-400 hover:text-slate-600 transition-colors">
            <Search className="w-5 h-5" />
          </button>

          {/* Custom Action */}
          {action || (
            <Button className="bg-blue-600 text-white px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors">
              <Plus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">New Booking</span>
            </Button>
          )}

          {/* Notifications */}
          <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
            <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400"></span>
          </button>
        </div>
      </div>
    </header>
  );
}
