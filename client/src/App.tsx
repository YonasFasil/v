import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { useAuth, AuthProvider } from "@/hooks/useAuth";
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
import AuditLogs from "@/pages/audit-logs";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import AuthPage from "@/pages/auth-page";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/auth" component={AuthPage} />
        </>
      ) : (
        <>
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
          <Route path="/audit-logs" component={AuditLogs} />
        </>
      )}
      {/* Public routes always accessible */}
      <Route path="/proposal/:proposalId" component={ProposalView} />
      <Route path="/proposal/:proposalId/payment" component={PaymentCheckout} />
      <Route path="/proposal/:proposalId/success" component={PaymentSuccess} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Router />
          <Toaster />
          <QuickActions />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
