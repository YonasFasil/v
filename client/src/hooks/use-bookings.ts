import { useQuery } from "@tanstack/react-query";
import type { Booking } from "@shared/schema";

export function useBookings() {
  return useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
    staleTime: 30000, // 30 seconds - consistent with global config
    gcTime: 300000, // 5 minutes
    refetchOnWindowFocus: false, // Use global settings
    refetchOnMount: "always", // Always refetch when component mounts to ensure fresh data
  });
}

export function useBooking(id: string) {
  return useQuery<Booking>({
    queryKey: ["/api/bookings", id],
    enabled: !!id,
  });
}
