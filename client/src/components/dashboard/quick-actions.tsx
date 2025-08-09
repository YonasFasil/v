import { Button } from "@/components/ui/button";
import { FileText, CreditCard, Plus } from "lucide-react";
import { useState } from "react";

export function QuickActions() {
  const [isExpanded, setIsExpanded] = useState(false);

  const actions = [
    {
      id: "proposal",
      title: "Create Proposal",
      icon: FileText,
      color: "bg-blue-600 hover:bg-blue-700",
      description: "Generate proposal"
    },
    {
      id: "payment",
      title: "Process Payment",
      icon: CreditCard,
      color: "bg-green-600 hover:bg-green-700",
      description: "Handle payments"
    }
  ];

  const handleAction = (actionId: string) => {
    console.log(`Quick Action button clicked: ${actionId}`);
    
    switch (actionId) {
      case "proposal":
        console.log('Navigating to proposals...');
        window.location.href = '/proposals';
        break;
      case "payment":
        console.log('Opening payment form...');
        window.location.href = '/payments';
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
