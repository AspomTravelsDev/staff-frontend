"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function NotificationsUpdater({
  notifications,
}: {
  notifications: Record<
    string,
    number | { count: number; latest_id: string | null }
  >;
}) {
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.setQueryData(["notifications"], notifications);
  }, [notifications, queryClient]);

  return null;
}
