import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { useUserRole } from "@/hooks/useUserRole";
import LoginSelect from "@/pages/login-select";
import Dashboard from "@/pages/dashboard";
import Events from "@/pages/events";
import Customers from "@/pages/customers";
import Payments from "@/pages/payments";
import Tasks from "@/pages/tasks";
import Venues from "@/pages/venues";
import Leads from "@/pages/Leads";
import SetupStyles from "@/pages/setup-styles";
import Packages from "@/pages/packages";
import Settings from "@/pages/settings";
import AIAnalytics from "@/pages/ai-analytics";
import Reports from "@/pages/reports";
import VoiceBooking from "@/pages/voice-booking";
import ProposalView from "@/pages/proposal-view";
import Proposals from "@/pages/proposals";
import SuperAdmin from "@/pages/super-admin";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, isSuperAdmin } = useUserRole();
  
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/login" component={LoginSelect} />
        <Route component={LoginSelect} />
      </Switch>
    );
  }

  // Super Admin gets their own isolated interface
  if (isSuperAdmin) {
    return (
      <Switch>
        <Route path="/login" component={LoginSelect} />
        <Route component={SuperAdmin} />
      </Switch>
    );
  }

  // Regular venue users (Admin/Staff) get the venue management interface
  return (
    <Switch>
      <Route path="/login" component={LoginSelect} />
      <Route path="/" component={Dashboard} />
      <Route path="/events" component={Events} />
      <Route path="/customers" component={Customers} />
      <Route path="/leads" component={Leads} />
      <Route path="/payments" component={Payments} />
      <Route path="/tasks" component={Tasks} />
      <Route path="/venues" component={Venues} />
      <Route path="/setup-styles" component={SetupStyles} />
      <Route path="/packages" component={Packages} />
      <Route path="/ai-analytics" component={AIAnalytics} />
      <Route path="/reports" component={Reports} />
      <Route path="/voice-booking" component={VoiceBooking} />
      <Route path="/settings" component={Settings} />
      <Route path="/proposals" component={Proposals} />
      <Route path="/proposal/:proposalId" component={ProposalView} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
        <QuickActions />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
