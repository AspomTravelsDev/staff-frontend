"use client";

import { useQuery } from "@tanstack/react-query";
import { getComplianceDetails } from "../compliance";
import { queryKeys } from "../query-keys";

export function useComplianceQuery(id: string | null, open: boolean) {
  return useQuery({
    queryKey: queryKeys.compliance.detail(id ?? ""),
    queryFn: () => getComplianceDetails(id!),
    enabled: open && Boolean(id),
    staleTime: 0,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
