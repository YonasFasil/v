import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Clipboard, Mail, CreditCard, ChevronRight } from "lucide-react";

export function QuickActions() {
  const actions = [
    {
      id: "proposal",
      title: "Create Proposal",
      icon: FileText,
      color: "bg-blue-100 text-blue-600",
      description: "Generate a new client proposal"
    },
    {
      id: "beo",
      title: "Generate BEO",
      icon: Clipboard,
      color: "bg-green-100 text-green-600",
      description: "Create banquet event order"
    },
    {
      id: "email",
      title: "Email Templates",
      icon: Mail,
      color: "bg-purple-100 text-purple-600",
      description: "Send templated communications"
    },
    {
      id: "payment",
      title: "Process Payment",
      icon: CreditCard,
      color: "bg-orange-100 text-orange-600",
      description: "Handle client payments"
    }
  ];

  const handleAction = (actionId: string) => {
    // These would navigate to the appropriate pages or open modals
    console.log(`Quick Action button clicked: ${actionId}`);
    
    switch (actionId) {
      case "proposal":
        // Navigate to proposals page or open create modal
        console.log('Navigating to proposals...');
        window.location.href = '/proposals';
        break;
      case "beo":
        // Generate BEO document
        console.log('Generating BEO document...');
        alert('BEO generation feature coming soon!');
        break;
      case "email":
        // Open email template selector
        console.log('Opening email templates...');
        alert('Email templates feature coming soon!');
        break;
      case "payment":
        // Open payment processing form
        console.log('Opening payment form...');
        window.location.href = '/payments';
        break;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action) => {
          const Icon = action.icon;
          
          return (
            <Button
              key={action.id}
              variant="ghost"
              className="w-full flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors h-auto"
              onClick={() => handleAction(action.id)}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${action.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-slate-900">{action.title}</div>
                  <div className="text-xs text-slate-500">{action.description}</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}
