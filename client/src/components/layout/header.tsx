import { Search, Bell, Plus, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { GlobalSearch } from "@/components/search/global-search";

interface HeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  onMobileMenuToggle?: () => void;
  onNewBooking?: () => void;
}

interface HeaderPropsWithMobile extends HeaderProps {
  mobileNavOpen?: boolean;
  setMobileNavOpen?: (open: boolean) => void;
}

export function Header({ title, subtitle, action, onMobileMenuToggle, onNewBooking, mobileNavOpen, setMobileNavOpen }: HeaderPropsWithMobile) {
  const [searchOpen, setSearchOpen] = useState(false);
  
  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  return (
    <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 sm:py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {/* Mobile Menu Button */}
          <button 
            onClick={onMobileMenuToggle || (() => setMobileNavOpen && setMobileNavOpen(true))}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-2xl font-semibold text-slate-900 truncate">{title}</h1>
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-600 mt-1 hidden sm:block">{subtitle}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Search Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span className="hidden md:inline">Search...</span>
            <kbd className="hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>

          {/* Custom Action */}
          {action || (
            <Button 
              onClick={() => {
                console.log('Header New Booking button clicked');
                if (onNewBooking) {
                  onNewBooking();
                } else {
                  window.location.href = '/events';
                }
              }}
              className="bg-blue-600 text-white px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors"
            >
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
      
      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
