import { useQuery } from "@tanstack/react-query";
import { useUserRole } from "@/hooks/useUserRole";
import { apiRequest } from "@/lib/queryClient";

interface FeatureAccess {
  [key: string]: boolean | number | null;
}

export function useFeatureAccess() {
  const { userRole, isAuthenticated, isAdmin, isStaff } = useUserRole();
  
  // Assuming we have the tenant ID (in a real app, this would come from auth context)
  const tenantId = "main-account";

  // Fetch package features for the tenant
  const { data: packageFeatures = {} } = useQuery<FeatureAccess>({
    queryKey: [`/api/tenant/${tenantId}/package-features`],
    queryFn: async () => {
      if (!isAuthenticated) return {};
      const response = await apiRequest("GET", `/api/tenant/${tenantId}/package-features`);
      return response || {};
    },
    enabled: isAuthenticated
  });

  // Define feature access based on role and package features
  const canAccess = (feature: string): boolean => {
    if (!isAuthenticated) return false;

    switch (feature) {
      // Basic features - available to all authenticated users
      case "dashboard":
      case "calendar":
      case "view_bookings":
      case "view_venues":
        return true;

      // Staff and admin features
      case "manage_bookings":
      case "create_bookings":
      case "edit_bookings":
        return (isStaff || isAdmin) && Boolean(packageFeatures.calendar);

      case "view_customers":
        return (isStaff || isAdmin) && Boolean(packageFeatures.customers);

      case "manage_customers":
      case "create_customers":
      case "edit_customers":
        return (isStaff || isAdmin) && Boolean(packageFeatures.customers);

      // Package-dependent features
      case "proposals":
      case "create_proposals":
      case "manage_proposals":
        return (isStaff || isAdmin) && Boolean(packageFeatures.proposals);

      case "lead_capture":
      case "lead_management":
        return (isStaff || isAdmin) && Boolean(packageFeatures.leadManagement);

      case "payments":
      case "stripe_integration":
        return (isStaff || isAdmin) && Boolean(packageFeatures.stripe);

      case "ai_features":
      case "ai_insights":
      case "voice_booking":
        return (isStaff || isAdmin) && Boolean(packageFeatures.ai);

      case "beo":
      case "banquet_orders":
        return (isStaff || isAdmin) && Boolean(packageFeatures.beo);

      case "reports":
      case "analytics":
        return (isStaff || isAdmin) && Boolean(packageFeatures.reports);

      // Admin-only features
      case "manage_venues":
      case "create_venues":
      case "edit_venues":
        return isAdmin && Boolean(packageFeatures.venues);

      case "manage_users":
      case "user_management":
        return isAdmin;

      case "settings":
      case "general_settings":
        return isAdmin;

      case "integrations":
        return isAdmin && Boolean(packageFeatures.integrations);

      case "taxes_and_fees":
        return isAdmin && Boolean(packageFeatures.taxesAndFees);

      case "floor_plans":
        return isAdmin && Boolean(packageFeatures.floorPlans);

      // Super admin features would go here if needed
      
      default:
        return false;
    }
  };

  // Convenience methods for common feature groups
  const canManageBookings = canAccess("manage_bookings");
  const canManageCustomers = canAccess("manage_customers");
  const canUseProposals = canAccess("proposals");
  const canUseAI = canAccess("ai_features");
  const canManageVenues = canAccess("manage_venues");
  const canManageUsers = canAccess("manage_users");
  const canAccessSettings = canAccess("settings");
  const canUsePayments = canAccess("payments");
  const canUseBEO = canAccess("beo");
  const canViewReports = canAccess("reports");

  return {
    canAccess,
    packageFeatures,
    userRole,
    isAuthenticated,
    
    // Convenience methods
    canManageBookings,
    canManageCustomers,
    canUseProposals,
    canUseAI,
    canManageVenues,
    canManageUsers,
    canAccessSettings,
    canUsePayments,
    canUseBEO,
    canViewReports
  };
}