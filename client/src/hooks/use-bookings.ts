import { useQuery } from "@tanstack/react-query";
import type { Booking } from "@shared/schema";

export function useBookings() {
  return useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
  });
}

export function useBooking(id: string) {
  return useQuery<Booking>({
    queryKey: ["/api/bookings", id],
    enabled: !!id,
  });
}
