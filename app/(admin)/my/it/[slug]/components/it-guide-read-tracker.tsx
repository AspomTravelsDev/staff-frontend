"use client";

import { useEffect, useRef } from "react";
import { markITGuideAsRead } from "@/lib/api/it-guides";

export function ITGuideReadTracker({ id }: { id: string }) {
  const marked = useRef(false);

  useEffect(() => {
    if (marked.current) return;
    marked.current = true;

    markITGuideAsRead(id).catch(console.error);
  }, [id]);

  return null;
}
