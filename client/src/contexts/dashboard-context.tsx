import { createContext, useContext, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

interface DashboardContextType {
  dashboardData: any;
  quickStats: any;
  isLoading: boolean;
  error: any;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  // Main dashboard data - everything in one call
  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError } = useQuery({
    queryKey: ["/api/dashboard/overview"],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchInterval: 2 * 60 * 1000, // Refresh every 2 minutes
  });

  // Quick stats for real-time updates
  const { data: quickStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/quick-stats"],
    refetchInterval: 30000, // Update every 30 seconds
    staleTime: 30000,
  });

  const value = {
    dashboardData,
    quickStats,
    isLoading: dashboardLoading || statsLoading,
    error: dashboardError
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}

// Hook to get specific data with fallbacks
export function useDashboardData() {
  const { dashboardData, quickStats, isLoading, error } = useDashboard();
  
  return {
    // Metrics with real-time updates
    metrics: {
      ...(dashboardData?.metrics || {}),
      todayBookings: quickStats?.todayBookings || 0,
      weeklyRevenue: quickStats?.weeklyRevenue || 0,
      hotLeads: quickStats?.hotLeads || 0
    },
    
    // Data from unified endpoint - no separate API calls needed
    bookings: dashboardData?.allBookings || [],
    customers: dashboardData?.allCustomers || [],
    venues: dashboardData?.allVenues || [],
    upcomingBookings: dashboardData?.upcomingBookings || [],
    activeLeads: dashboardData?.activeLeads || [],
    recentPayments: dashboardData?.recentPayments || [],
    calendar: dashboardData?.calendar || { data: [] },
    insights: dashboardData?.insights || [],
    business: dashboardData?.business || {},
    
    isLoading,
    error
  };
}