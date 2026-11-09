"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../query-keys";
import { getAppraisalHistory, getAppraisalStats, saveSelfAppraisalDraft, submitSelfAppraisal } from "../performance-appraisal";
import type { AppraisalStats, AppraisalSummary, SelfAssessmentInput } from "@/lib/types/performance-appraisal";

export function useAppraisalHistory(initialData?: AppraisalSummary[]) {
  return useQuery({ queryKey: queryKeys.performance.appraisals.list(), queryFn: getAppraisalHistory, initialData });
}

export function useAppraisalStats(initialData?: AppraisalStats) {
  return useQuery({ queryKey: queryKeys.performance.stats(), queryFn: getAppraisalStats, initialData });
}

export function useSaveSelfAppraisal() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data, submit }: { id: string; data: SelfAssessmentInput; submit: boolean }) => submit ? submitSelfAppraisal(id, data) : saveSelfAppraisalDraft(id, data),
    onSuccess: (appraisal) => {
      client.setQueryData(queryKeys.performance.appraisals.detail(appraisal.id), appraisal);
      void client.invalidateQueries({ queryKey: queryKeys.performance.appraisals.lists() });
      void client.invalidateQueries({ queryKey: queryKeys.performance.stats() });
      void client.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
