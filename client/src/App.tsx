import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { useUserRole } from "@/hooks/useUserRole";
import { FeatureGate } from "@/components/FeatureGate";
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
      <Route path="/">
        {() => (
          <FeatureGate feature="dashboard">
            <Dashboard />
          </FeatureGate>
        )}
      </Route>
      <Route path="/events">
        {() => (
          <FeatureGate feature="view_bookings">
            <Events />
          </FeatureGate>
        )}
      </Route>
      <Route path="/customers">
        {() => (
          <FeatureGate feature="view_customers">
            <Customers />
          </FeatureGate>
        )}
      </Route>
      <Route path="/leads">
        {() => (
          <FeatureGate feature="lead_management">
            <Leads />
          </FeatureGate>
        )}
      </Route>
      <Route path="/payments">
        {() => (
          <FeatureGate feature="payments">
            <Payments />
          </FeatureGate>
        )}
      </Route>
      <Route path="/tasks">
        {() => (
          <FeatureGate feature="view_bookings">
            <Tasks />
          </FeatureGate>
        )}
      </Route>
      <Route path="/venues">
        {() => (
          <FeatureGate feature="manage_venues">
            <Venues />
          </FeatureGate>
        )}
      </Route>
      <Route path="/setup-styles">
        {() => (
          <FeatureGate feature="floor_plans">
            <SetupStyles />
          </FeatureGate>
        )}
      </Route>
      <Route path="/packages">
        {() => (
          <FeatureGate feature="manage_bookings">
            <Packages />
          </FeatureGate>
        )}
      </Route>
      <Route path="/ai-analytics">
        {() => (
          <FeatureGate feature="ai_insights">
            <AIAnalytics />
          </FeatureGate>
        )}
      </Route>
      <Route path="/reports">
        {() => (
          <FeatureGate feature="reports">
            <Reports />
          </FeatureGate>
        )}
      </Route>
      <Route path="/voice-booking">
        {() => (
          <FeatureGate feature="ai_features">
            <VoiceBooking />
          </FeatureGate>
        )}
      </Route>
      <Route path="/settings">
        {() => (
          <FeatureGate feature="settings">
            <Settings />
          </FeatureGate>
        )}
      </Route>
      <Route path="/proposals">
        {() => (
          <FeatureGate feature="proposals">
            <Proposals />
          </FeatureGate>
        )}
      </Route>
      <Route path="/proposal/:proposalId">
        {() => (
          <FeatureGate feature="proposals">
            <ProposalView />
          </FeatureGate>
        )}
      </Route>
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
