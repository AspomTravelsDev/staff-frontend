"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { markAllAnnouncementsAsRead } from "@/lib/api/announcements";

export function MarkAnnouncementsReadOnVisit() {
  const started = useRef(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void markAllAnnouncementsAsRead()
      .then(() => queryClient.invalidateQueries({ queryKey: ["notifications"] }))
      .catch((error) => console.error("Failed to mark announcements as read:", error));
  }, [queryClient]);

  return null;
}
