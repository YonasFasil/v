import { Switch, Route } from "wouter";
import { lazy } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { DevTools } from "@/components/DevTools";

// Using PostgreSQL-based authentication

// Public pages
import Home from "@/pages/public/Home";
import Features from "@/pages/public/Features";
import Pricing from "@/pages/public/Pricing";

// Auth pages  
import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";
import SignupWithPackages from "@/pages/auth/SignupWithPackages";
import VerifyEmailSent from "@/pages/auth/VerifyEmailSent";
import EmailVerification from "@/pages/auth/EmailVerification";
import LogoutPage from "@/pages/LogoutPage";
import ForceLogout from "@/pages/ForceLogout";

// App pages
import Dashboard from "@/pages/dashboard";
import OptimizedDashboard from "@/pages/optimized-dashboard";
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
import SuperAdminLogin from "@/pages/superadmin/SuperAdminLogin";
import SuperAdmin from "@/pages/SuperAdmin";
import SuperAdminDirectAccess from "@/pages/SuperAdminDirectAccess";
import Reports from "@/pages/reports";
import VoiceBooking from "@/pages/voice-booking";
import ProposalView from "@/pages/proposal-view";
import Proposals from "@/pages/proposals";
// Onboarding removed
import PlanManagement from "@/pages/plan-management";
import NotFound from "@/pages/not-found";
function Router() {
  // Using PostgreSQL-based authentication
  
  return (
    <Switch>
      {/* Public marketing site */}
      <Route path="/" component={Home} />
      <Route path="/features" component={Features} />
      <Route path="/pricing" component={Pricing} />
      
      {/* Auth routes */}
      <Route path="/login" component={Login} />
      <Route path="/signup" component={SignupWithPackages} />
      <Route path="/signup-basic" component={Signup} />
      <Route path="/logout" component={LogoutPage} />
      <Route path="/force-logout" component={ForceLogout} />
      <Route path="/verify-email-sent" component={VerifyEmailSent} />
      <Route path="/verify-email" component={EmailVerification} />
      
      {/* Tenant app routes */}
      <Route path="/t/:slug/app" component={OptimizedDashboard} />
      <Route path="/t/:slug/app/dashboard-old" component={Dashboard} />
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
      <Route path="/t/:slug/app/plan" component={PlanManagement} />
      
      {/* Platform admin routes - clean professional URLs */}
      <Route path="/admin/login" component={SuperAdminLogin} />
      <Route path="/admin" component={SuperAdminDashboard} />
      <Route path="/admin/tenants" component={SuperAdminDashboard} />
      <Route path="/admin/users" component={SuperAdminDashboard} />
      <Route path="/admin/analytics" component={SuperAdminDashboard} />
      <Route path="/super-admin" component={SuperAdminDashboard} />
      <Route path="/admin/access" component={SuperAdminDirectAccess} />
      
      {/* Removed deprecated Firebase routes - use /login and /signup instead */}
      
      {/* Legacy routes removed for security - all tenant routes must use /t/:slug/app/* pattern */}
      
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
