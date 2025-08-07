import { useQuery } from "@tanstack/react-query";
import type { Proposal } from "@shared/schema";

export function useProposals() {
  return useQuery<Proposal[]>({
    queryKey: ["/api/proposals"],
  });
}

export function useProposal(id: string) {
  return useQuery<Proposal>({
    queryKey: ["/api/proposals", id],
    enabled: !!id,
  });
}
