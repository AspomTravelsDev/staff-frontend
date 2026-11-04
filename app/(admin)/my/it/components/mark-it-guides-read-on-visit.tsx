"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { markAllITGuidesAsRead } from "@/lib/api/it-guides";

export function MarkITGuidesReadOnVisit() {
  const started = useRef(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void markAllITGuidesAsRead()
      .then(() => queryClient.invalidateQueries({ queryKey: ["notifications"] }))
      .catch((error) => console.error("Failed to mark IT guides as read:", error));
  }, [queryClient]);

  return null;
}
