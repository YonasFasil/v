import { Button } from "@/components/ui/button";
import { Calendar, Users, Settings, CreditCard, Plus } from "lucide-react";
import { useState } from "react";

export function QuickActions() {
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
                <div className="bg-black/80 text-white px-3 py-2 rounded-lg text-sm mr-3 shadow-lg backdrop-blur-sm">
                  {action.description}
                </div>
                <Button
                  size="lg"
                  className={`w-14 h-14 rounded-full shadow-lg ${action.color} text-white transition-all duration-200 hover:scale-110`}
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
        className={`w-16 h-16 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 ${isExpanded ? 'rotate-45' : 'rotate-0'}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Plus className="w-8 h-8" />
      </Button>
    </div>
  );
}
