import { useQuery } from "@tanstack/react-query";
import type { Booking } from "@shared/schema";

export function useBookings() {
  return useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
  });
}

export function useBooking(id: string) {
  return useQuery<Booking>({
    queryKey: ["/api/bookings", id],
    enabled: !!id,
  });
}
