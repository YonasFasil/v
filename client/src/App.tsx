import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { useAuth } from "@/hooks/useAuth";

// Auth Pages
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";

// Main Pages
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

// Admin Pages
import TenantManagement from "@/pages/admin/tenant-management";
import RolePermissions from "@/pages/admin/role-permissions";
import ApprovalCenter from "@/pages/admin/approval-center";
import AuditLogs from "@/pages/admin/audit-logs";
import SubscriptionPackages from "@/pages/admin/subscription-packages";
import EmailSettings from "@/pages/admin/email-settings";

import NotFound from "@/pages/not-found";

function AuthenticatedRoutes() {
  const { user, isSuperAdmin } = useAuth();

  return (
    <Switch>
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
      
      {/* Admin Routes - Only accessible to super admin */}
      {isSuperAdmin && (
        <>
          <Route path="/admin/tenants" component={TenantManagement} />
          <Route path="/admin/roles" component={RolePermissions} />
          <Route path="/admin/approvals" component={ApprovalCenter} />
          <Route path="/admin/audit" component={AuditLogs} />
          <Route path="/admin/packages" component={SubscriptionPackages} />
          <Route path="/admin/email-settings" component={EmailSettings} />
        </>
      )}
      
      <Route component={NotFound} />
    </Switch>
  );
}

function PublicRoutes() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/" component={Login} />
      <Route component={Login} />
    </Switch>
  );
}

function AppContent() {
  const { isLoading, isAuthenticated } = useAuth();

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Render appropriate routes based on authentication status
  if (isAuthenticated) {
    return (
      <>
        <AuthenticatedRoutes />
        <QuickActions />
      </>
    );
  }

  return <PublicRoutes />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
