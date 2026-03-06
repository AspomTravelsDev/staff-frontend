"use client";

import { useEffect, useRef } from "react";
import { markAnnouncementAsRead } from "@/lib/api/announcements";

export function AnnouncementReadTracker({ id }: { id: string }) {
  const marked = useRef(false);

  useEffect(() => {
    if (marked.current) return;
    marked.current = true;

    markAnnouncementAsRead(id).catch(console.error);
  }, [id]);

  return null;
}
