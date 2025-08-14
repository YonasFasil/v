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
import TenantLogin from "@/pages/tenant-login";
import Users from "@/pages/users";
import Landing from "@/pages/landing";
import Signup from "@/pages/signup";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/events">
        <ProtectedRoute>
          <Events />
        </ProtectedRoute>
      </Route>
      <Route path="/customers">
        <ProtectedRoute>
          <Customers />
        </ProtectedRoute>
      </Route>
      <Route path="/leads">
        <ProtectedRoute>
          <Leads />
        </ProtectedRoute>
      </Route>
      <Route path="/payments">
        <ProtectedRoute>
          <Payments />
        </ProtectedRoute>
      </Route>
      <Route path="/tasks">
        <ProtectedRoute>
          <Tasks />
        </ProtectedRoute>
      </Route>
      <Route path="/venues">
        <ProtectedRoute>
          <Venues />
        </ProtectedRoute>
      </Route>
      <Route path="/setup-styles">
        <ProtectedRoute>
          <SetupStyles />
        </ProtectedRoute>
      </Route>
      <Route path="/packages">
        <ProtectedRoute>
          <Packages />
        </ProtectedRoute>
      </Route>
      <Route path="/ai-analytics">
        <ProtectedRoute>
          <AIAnalytics />
        </ProtectedRoute>
      </Route>
      <Route path="/reports">
        <ProtectedRoute>
          <Reports />
        </ProtectedRoute>
      </Route>
      <Route path="/voice-booking">
        <ProtectedRoute>
          <VoiceBooking />
        </ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      </Route>
      <Route path="/proposals">
        <ProtectedRoute>
          <Proposals />
        </ProtectedRoute>
      </Route>
      <Route path="/users">
        <ProtectedRoute requiredRole="tenant_admin">
          <Users />
        </ProtectedRoute>
      </Route>
      <Route path="/proposal/:proposalId" component={ProposalView} />
      <Route path="/proposal/:proposalId/payment" component={PaymentCheckout} />
      <Route path="/proposal/:proposalId/success" component={PaymentSuccess} />
      <Route path="/super-admin">
        <ProtectedRoute requiredRole="super_admin" redirectTo="/super-admin/login">
          <SuperAdminDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/super-admin/login" component={SuperAdminLogin} />
      <Route path="/login" component={TenantLogin} />
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
