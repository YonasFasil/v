import { Button } from "@/components/ui/button";
import { Calendar, Users, Settings, CreditCard, Plus } from "lucide-react";
import { useState, useEffect } from "react";

function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const superAdminToken = localStorage.getItem('super_admin_token');
      const regularToken = localStorage.getItem('auth_token');
      const token = superAdminToken || regularToken;
      
      if (!token) {
        setIsAuthenticated(false);
        return;
      }

      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const exp = payload.exp;
        
        if (exp && Date.now() >= exp * 1000) {
          setIsAuthenticated(false);
          return;
        }
        
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  return isAuthenticated;
}

export function QuickActions() {
  const isAuthenticated = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  const actions = [
    {
      id: "event",
      title: "New Event",
      icon: Calendar,
      color: "bg-blue-600 hover:bg-blue-700",
      description: "Create new event"
    },
    {
      id: "customer",
      title: "Add Customer",
      icon: Users,
      color: "bg-green-600 hover:bg-green-700",
      description: "Add new customer"
    },
    {
      id: "payment",
      title: "Payments",
      icon: CreditCard,
      color: "bg-purple-600 hover:bg-purple-700",
      description: "Manage payments"
    },
    {
      id: "settings",
      title: "Settings",
      icon: Settings,
      color: "bg-gray-600 hover:bg-gray-700",
      description: "App settings"
    }
  ];

  const handleAction = (actionId: string) => {
    console.log(`Quick Action button clicked: ${actionId}`);
    
    switch (actionId) {
      case "event":
        console.log('Navigating to events page...');
        window.location.href = '/events';
        break;
      case "customer":
        console.log('Navigating to customers page...');
        window.location.href = '/customers';
        break;
      case "payment":
        console.log('Opening payments page...');
        window.location.href = '/payments';
        break;
      case "settings":
        console.log('Opening settings...');
        window.location.href = '/settings';
        break;
    }
    setIsExpanded(false);
  };

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Expanded action buttons */}
      {isExpanded && (
        <div className="mb-4 space-y-3">
          {actions.map((action) => {
            const Icon = action.icon;
            
            return (
              <div
                key={action.id}
                className="flex items-center justify-end"
              >
                <div className="bg-black/90 text-white px-3 py-2 rounded-xl text-sm mr-3 shadow-lg backdrop-blur-sm border border-white/10">
                  {action.description}
                </div>
                <Button
                  size="lg"
                  className={`w-12 h-12 rounded-full shadow-lg ${action.color} text-white transition-all duration-200 hover:scale-110 border border-white/20 backdrop-blur-sm`}
                  onClick={() => handleAction(action.id)}
                >
                  <Icon className="w-6 h-6" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Main toggle button */}
      <Button
        size="lg"
        className={`w-14 h-14 rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all duration-300 backdrop-blur-sm border border-white/20 ${isExpanded ? 'rotate-45' : 'rotate-0'}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Plus className="w-6 h-6" />
      </Button>
    </div>
  );
}
