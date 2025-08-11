import { createContext, useContext, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';

interface DashboardData {
  metrics: any;
  upcomingBookings: any[];
  activeLeads: any[];
  calendar: { data: any[] };
  insights: any[];
  business: any;
  venues: any[];
  recentPayments: any[];
}

interface DashboardContextType {
  data: DashboardData | undefined;
  isLoading: boolean;
  error: any;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

interface DashboardProviderProps {
  children: ReactNode;
}

export function DashboardProvider({ children }: DashboardProviderProps) {
  // Single source of truth for ALL dashboard data
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/dashboard/overview"],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchInterval: 2 * 60 * 1000, // Refresh every 2 minutes
  });

  const value: DashboardContextType = {
    data: data as DashboardData,
    isLoading,
    error
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardData() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboardData must be used within a DashboardProvider');
  }
  return context;
}

// Specific hooks that use the shared context data
export function useDashboardMetrics() {
  const { data, isLoading } = useDashboardData();
  return { 
    data: data?.metrics || {}, 
    isLoading 
  };
}

export function useDashboardBookings() {
  const { data, isLoading } = useDashboardData();
  return { 
    data: data?.upcomingBookings || [], 
    isLoading 
  };
}

export function useDashboardLeads() {
  const { data, isLoading } = useDashboardData();
  return { 
    data: data?.activeLeads || [], 
    isLoading 
  };
}

export function useDashboardCalendar() {
  const { data, isLoading } = useDashboardData();
  return { 
    data: data?.calendar?.data || [], 
    isLoading 
  };
}

export function useDashboardInsights() {
  const { data, isLoading } = useDashboardData();
  return { 
    data: data?.insights || [], 
    isLoading 
  };
}