"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { NotificationCountValue } from "@/lib/api/notifications";

export function NotificationsUpdater({
  notifications,
}: {
  notifications: Record<string, NotificationCountValue>;
}) {
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.setQueryData(["notifications"], notifications);
  }, [notifications, queryClient]);

  return null;
}
