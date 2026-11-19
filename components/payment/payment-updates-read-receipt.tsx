"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { markPaymentNotificationsAsRead } from "@/lib/api/payment-confirmations";

export function PaymentUpdatesReadReceipt() {
  const queryClient = useQueryClient();
  const markedRef = useRef(false);

  useEffect(() => {
    if (markedRef.current) return;
    markedRef.current = true;
    void markPaymentNotificationsAsRead()
      .then((marked) => {
        if (marked) {
          void queryClient.invalidateQueries({ queryKey: ["notifications"] });
        }
      })
      .catch(() => {});
  }, [queryClient]);

  return null;
}
