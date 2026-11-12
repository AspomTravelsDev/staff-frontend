"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { NotificationCountValue } from "@/lib/api/notifications";

export function NotificationsUpdater({
  notifications,
}: {
  notifications: Record<string, NotificationCountValue>;
}) {
  const queryClient = useQueryClient();
  const seededRef = useRef(false);

  // Seed synchronously before sibling/child hooks mount so initial render doesn't fire a duplicate server action
  if (!seededRef.current) {
    queryClient.setQueryData(["notifications"], notifications);
    seededRef.current = true;
  }

  useEffect(() => {
    queryClient.setQueryData(["notifications"], notifications);
  }, [notifications, queryClient]);

  return null;
}
