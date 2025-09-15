import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { FloatingChatbot } from "@/components/chat/floating-chatbot";
import { Suspense, lazy } from "react";

// Eager load critical pages
import Landing from "@/pages/landing";
import TenantLogin from "@/pages/tenant-login";
import SuperAdminLogin from "@/pages/super-admin-login";
import Signup from "@/pages/signup";
import NotFound from "@/pages/not-found";

// Lazy load secondary pages
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Events = lazy(() => import("@/pages/events"));
const Customers = lazy(() => import("@/pages/customers"));
const Payments = lazy(() => import("@/pages/payments"));
const Tasks = lazy(() => import("@/pages/tasks"));
const Venues = lazy(() => import("@/pages/venues"));
const Leads = lazy(() => import("@/pages/Leads"));
const SetupStyles = lazy(() => import("@/pages/setup-styles"));
const Packages = lazy(() => import("@/pages/packages"));
const Settings = lazy(() => import("@/pages/settings"));
const AIAnalytics = lazy(() => import("@/pages/ai-analytics"));
const Reports = lazy(() => import("@/pages/reports"));
const VoiceBooking = lazy(() => import("@/pages/voice-booking"));
const ProposalView = lazy(() => import("@/pages/proposal-view"));
const Proposals = lazy(() => import("@/pages/proposals"));
const PaymentCheckout = lazy(() => import("@/pages/payment-checkout"));
const PaymentSuccess = lazy(() => import("@/pages/payment-success"));
const SuperAdminDashboard = lazy(() => import("@/pages/super-admin-dashboard"));
const Users = lazy(() => import("@/pages/users"));
const UpgradePackage = lazy(() => import("@/pages/upgrade-package"));

// Public pages (no authentication required)
const PublicVenues = lazy(() => import("@/pages/public-venues"));
const VenueDetail = lazy(() => import("@/pages/venue-detail"));
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { FullyProtectedRoute } from "@/components/auth/FullyProtectedRoute";

// Loading component for lazy-loaded routes
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}

// Wrapper for lazy-loaded protected routes
function LazyProtectedRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <Suspense fallback={<PageLoader />}>
        {children}
      </Suspense>
    </ProtectedRoute>
  );
}

// Wrapper for feature-protected routes
function LazyFeatureProtectedRoute({ 
  children, 
  requiredFeature, 
  featureName 
}: { 
  children: React.ReactNode;
  requiredFeature: string;
  featureName: string;
}) {
  return (
    <FullyProtectedRoute requiredFeature={requiredFeature} featureName={featureName}>
      <Suspense fallback={<PageLoader />}>
        {children}
      </Suspense>
    </FullyProtectedRoute>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />

      {/* Public routes - no authentication required */}
      <Route path="/explore/venues">
        <Suspense fallback={<PageLoader />}>
          <PublicVenues />
        </Suspense>
      </Route>

      <Route path="/explore/venues/:id">
        <Suspense fallback={<PageLoader />}>
          <VenueDetail />
        </Suspense>
      </Route>

      <Route path="/dashboard">
        <LazyProtectedRoute>
          <Dashboard />
        </LazyProtectedRoute>
      </Route>
      <Route path="/events">
        <LazyProtectedRoute>
          <Events />
        </LazyProtectedRoute>
      </Route>
      <Route path="/customers">
        <LazyProtectedRoute>
          <Customers />
        </LazyProtectedRoute>
      </Route>
      <Route path="/leads">
        <LazyFeatureProtectedRoute requiredFeature="leads_management" featureName="Lead Management">
          <Leads />
        </LazyFeatureProtectedRoute>
      </Route>
      <Route path="/payments">
        <LazyProtectedRoute>
          <Payments />
        </LazyProtectedRoute>
      </Route>
      <Route path="/tasks">
        <LazyFeatureProtectedRoute requiredFeature="task_management" featureName="Task Management">
          <Tasks />
        </LazyFeatureProtectedRoute>
      </Route>
      <Route path="/venues">
        <LazyProtectedRoute>
          <Venues />
        </LazyProtectedRoute>
      </Route>
      <Route path="/setup-styles">
        <LazyFeatureProtectedRoute requiredFeature="floor_plans" featureName="Floor Plans">
          <SetupStyles />
        </LazyFeatureProtectedRoute>
      </Route>
      <Route path="/packages">
        <LazyProtectedRoute>
          <Packages />
        </LazyProtectedRoute>
      </Route>
      <Route path="/ai-analytics">
        <LazyFeatureProtectedRoute requiredFeature="ai_analytics" featureName="AI Analytics">
          <AIAnalytics />
        </LazyFeatureProtectedRoute>
      </Route>
      <Route path="/reports">
        <LazyFeatureProtectedRoute requiredFeature="advanced_reports" featureName="Advanced Reports">
          <Reports />
        </LazyFeatureProtectedRoute>
      </Route>
      <Route path="/voice-booking">
        <LazyFeatureProtectedRoute requiredFeature="voice_booking" featureName="Voice Booking">
          <VoiceBooking />
        </LazyFeatureProtectedRoute>
      </Route>
      <Route path="/settings">
        <LazyProtectedRoute>
          <Settings />
        </LazyProtectedRoute>
      </Route>
      <Route path="/proposals">
        <LazyFeatureProtectedRoute requiredFeature="proposal_system" featureName="Proposal System">
          <Proposals />
        </LazyFeatureProtectedRoute>
      </Route>
      <Route path="/users">
        <ProtectedRoute requiredRole="tenant_admin">
          <Suspense fallback={<PageLoader />}>
            <Users />
          </Suspense>
        </ProtectedRoute>
      </Route>
      <Route path="/upgrade-package">
        <LazyProtectedRoute>
          <UpgradePackage />
        </LazyProtectedRoute>
      </Route>
      <Route path="/proposal/:proposalId">
        <Suspense fallback={<PageLoader />}>
          <ProposalView />
        </Suspense>
      </Route>
      <Route path="/proposal/:proposalId/payment">
        <Suspense fallback={<PageLoader />}>
          <PaymentCheckout />
        </Suspense>
      </Route>
      <Route path="/proposal/:proposalId/success">
        <Suspense fallback={<PageLoader />}>
          <PaymentSuccess />
        </Suspense>
      </Route>
      <Route path="/super-admin">
        <ProtectedRoute requiredRole="super_admin" redirectTo="/super-admin/login">
          <Suspense fallback={<PageLoader />}>
            <SuperAdminDashboard />
          </Suspense>
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
        <FloatingChatbot />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
