"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { markAssignedDealsNotificationsAsRead } from "@/lib/api/payment-confirmations";

export function AssignedDealsReadReceipt({ confirmationIds, throughId }: {
  confirmationIds: string[];
  throughId?: number | null;
}) {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!throughId || !confirmationIds.length) return;
    void markAssignedDealsNotificationsAsRead(confirmationIds, throughId)
      .then(marked => { if (marked) void queryClient.invalidateQueries({ queryKey: ["notifications"] }); })
      .catch(() => {});
  }, [confirmationIds, throughId, queryClient]);
  return null;
}
