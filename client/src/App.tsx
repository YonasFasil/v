import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QuickActions } from "@/components/dashboard/quick-actions";
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
import PaymentCheckout from "@/pages/payment-checkout";
import PaymentSuccess from "@/pages/payment-success";
import NotFound from "@/pages/not-found";
import SuperAdminDashboard from "@/pages/super-admin-dashboard";
import SuperAdminLogin from "@/pages/super-admin-login";
import Landing from "@/pages/landing";
import Signup from "@/pages/signup";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/dashboard" component={Dashboard} />
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
      <Route path="/proposal/:proposalId/payment" component={PaymentCheckout} />
      <Route path="/proposal/:proposalId/success" component={PaymentSuccess} />
      <Route path="/super-admin" component={SuperAdminDashboard} />
      <Route path="/super-admin/login" component={SuperAdminLogin} />
      <Route path="/signup" component={Signup} />
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
