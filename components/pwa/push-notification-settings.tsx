"use client";

import { Bell, BellOff, BellRing, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePushNotifications } from "@/lib/hooks/use-push-notifications";

interface PushNotificationSettingsProps {
  compact?: boolean;
}

export function PushNotificationSettings({ compact = false }: PushNotificationSettingsProps) {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    isActionPending,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  if (isLoading || !isSupported) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/40 text-xs">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <div>
            <div className="font-semibold flex items-center gap-1.5">
              <span>Push Reminders</span>
              {isSubscribed && (
                <Badge variant="outline" className="text-[10px] py-0 px-1 text-emerald-600 border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40">
                  Active
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-[11px]">
              8:50 AM Attendance & 5:55 PM Reports
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {isSubscribed ? (
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2.5 text-[11px] text-muted-foreground hover:text-destructive"
              disabled={isActionPending}
              onClick={unsubscribe}
            >
              Disable
            </Button>
          ) : (
            <Button
              size="sm"
              className="h-7 px-2.5 text-[11px] font-medium"
              disabled={isActionPending || permission === "denied"}
              onClick={subscribe}
            >
              {isActionPending ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <BellRing className="h-3 w-3 mr-1" />
              )}
              {permission === "denied" ? "Blocked" : "Enable"}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl border bg-card text-card-foreground shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
            {isSubscribed ? <BellRing className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold">Web Push Notifications</h4>
              {isSubscribed ? (
                <Badge variant="outline" className="text-[11px] text-emerald-600 border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Enabled
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[11px] text-amber-600 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40">
                  Not configured
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Get timely reminders directly on your phone or computer even when the portal is closed.
              Includes <strong>8:50 AM Clock-In</strong> and <strong>5:55 PM Daily Report</strong> alerts.
            </p>
            {permission === "denied" && (
              <p className="text-xs text-destructive mt-1.5 font-medium">
                ⚠️ Notifications are blocked in your browser settings. Please click the padlock or settings icon in your address bar to allow notifications.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3.5 pt-3 border-t flex items-center justify-end gap-2">
        {isSubscribed ? (
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8 text-muted-foreground hover:text-destructive"
            disabled={isActionPending}
            onClick={unsubscribe}
          >
            <BellOff className="h-3.5 w-3.5 mr-1" />
            Disable on this device
          </Button>
        ) : (
          <Button
            size="sm"
            className="text-xs h-8 font-medium"
            disabled={isActionPending || permission === "denied"}
            onClick={subscribe}
          >
            {isActionPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            ) : (
              <BellRing className="h-3.5 w-3.5 mr-1.5" />
            )}
            Enable Push Reminders
          </Button>
        )}
      </div>
    </div>
  );
}
