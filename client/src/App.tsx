import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { DevTools } from "@/components/DevTools";

// Public pages
import Home from "@/pages/public/Home";
import Features from "@/pages/public/Features";
import Pricing from "@/pages/public/Pricing";

// Auth pages  
import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";
import VerifyEmailSent from "@/pages/auth/VerifyEmailSent";

// App pages
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
import SuperAdminDashboard from "@/pages/superadmin/SuperAdminDashboard";
import Reports from "@/pages/reports";
import VoiceBooking from "@/pages/voice-booking";
import ProposalView from "@/pages/proposal-view";
import Proposals from "@/pages/proposals";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      {/* Public marketing site */}
      <Route path="/" component={Home} />
      <Route path="/features" component={Features} />
      <Route path="/pricing" component={Pricing} />
      
      {/* Auth routes */}
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/verify-email-sent" component={VerifyEmailSent} />
      
      {/* Tenant app routes */}
      <Route path="/t/:slug/app" component={Dashboard} />
      <Route path="/t/:slug/app/events" component={Events} />
      <Route path="/t/:slug/app/customers" component={Customers} />
      <Route path="/t/:slug/app/leads" component={Leads} />
      <Route path="/t/:slug/app/payments" component={Payments} />
      <Route path="/t/:slug/app/tasks" component={Tasks} />
      <Route path="/t/:slug/app/venues" component={Venues} />
      <Route path="/t/:slug/app/setup-styles" component={SetupStyles} />
      <Route path="/t/:slug/app/packages" component={Packages} />
      <Route path="/t/:slug/app/ai-analytics" component={AIAnalytics} />
      <Route path="/t/:slug/app/reports" component={Reports} />
      <Route path="/t/:slug/app/voice-booking" component={VoiceBooking} />
      <Route path="/t/:slug/app/settings" component={Settings} />
      <Route path="/t/:slug/app/proposals" component={Proposals} />
      <Route path="/t/:slug/app/proposal/:proposalId" component={ProposalView} />
      
      {/* Superadmin routes - secure hidden URL */}
      <Route path="/sys-admin-x7k9p2w4" component={SuperAdminDashboard} />
      
      {/* Legacy fallback for existing tenant (temporary) */}
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
      <Route path="/dashboard" component={Dashboard} />
      
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
        <DevTools />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
