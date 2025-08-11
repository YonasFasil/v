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
import TenantManagement from "@/pages/admin/tenant-management";
import RolePermissions from "@/pages/admin/role-permissions";
import ApprovalCenter from "@/pages/admin/approval-center";
import AuditLogs from "@/pages/admin/audit-logs";
import SubscriptionPackages from "@/pages/admin/subscription-packages";
import EmailSettings from "@/pages/admin/email-settings";
import DevAdmin from "@/pages/dev-admin";
import TenantLogin from "@/pages/tenant-login";
import TenantRegister from "@/pages/tenant-register";
import TenantRegistrationSuccess from "@/pages/tenant-registration-success";
import NotFound from "@/pages/not-found";

function Router() {
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
      <Route path="/admin/tenants" component={TenantManagement} />
      <Route path="/admin/roles" component={RolePermissions} />
      <Route path="/admin/approvals" component={ApprovalCenter} />
      <Route path="/admin/audit" component={AuditLogs} />
      <Route path="/admin/packages" component={SubscriptionPackages} />
      <Route path="/admin/email-settings" component={EmailSettings} />
      <Route path="/dev-admin" component={DevAdmin} />
      <Route path="/tenant-login" component={TenantLogin} />
      <Route path="/tenant-register" component={TenantRegister} />
      <Route path="/tenant-registration-success" component={TenantRegistrationSuccess} />
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
