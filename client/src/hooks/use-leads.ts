import { useQuery } from "@tanstack/react-query";
import type { Customer } from "@shared/schema";

export function useLeads() {
  return useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });
}

export function useCustomer(id: string) {
  return useQuery<Customer>({
    queryKey: ["/api/customers", id],
    enabled: !!id,
  });
}
