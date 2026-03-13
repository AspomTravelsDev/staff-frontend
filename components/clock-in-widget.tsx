"use client";

import { useEffect, useState } from "react";
import { Clock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  clockIn,
  clockOut,
  getTodayStatus,
  type ClockInRecord,
} from "@/lib/api/clock-in";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function ClockInWidget() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<ClockInRecord | null>(null);
  const [isFetched, setIsFetched] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await getTodayStatus();
        if (response.success) {
          setStatus(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch clock-in status:", error);
      } finally {
        setIsFetched(true);
      }
    };

    fetchStatus();
  }, []);

  const handleClockIn = async () => {
    try {
      setLoading(true);

      // Attempt to get location and IP
      let location = undefined;
      let client_ip = undefined;

      try {
        const { getGPSLocation, getPublicIP } = await import(
          "@/lib/utils/location"
        );
        [location, client_ip] = await Promise.all([
          getGPSLocation().catch(() => undefined),
          getPublicIP().catch(() => undefined),
        ]);
      } catch (err) {
        console.error("Failed to fetch location/IP:", err);
      }

      const response = await clockIn(location, client_ip);
      if (response.success) {
        toast.success(response.data.message || "Successfully clocked in");
        setStatus(response.data.data);
      } else {
        toast.error(response.error?.error || "Failed to clock in");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong during clock-in");
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    try {
      setLoading(true);

      // Attempt to get location and IP
      let location = undefined;
      let client_ip = undefined;

      try {
        const { getGPSLocation, getPublicIP } = await import(
          "@/lib/utils/location"
        );
        [location, client_ip] = await Promise.all([
          getGPSLocation().catch(() => undefined),
          getPublicIP().catch(() => undefined),
        ]);
      } catch (err) {
        console.error("Failed to fetch location/IP:", err);
      }

      const response = await clockOut(location, client_ip);
      if (response.success) {
        toast.success("Successfully clocked out");
        setStatus(response.data.data);
        if (response.data.data.duration_minutes) {
          const hours = Math.floor(response.data.data.duration_minutes / 60);
          const minutes = response.data.data.duration_minutes % 60;
          toast.info(`Total duration: ${hours}h ${minutes}m`);
        }
      } else {
        toast.error(response.error?.error || "Failed to clock out");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!isFetched) return null;

  const isClockedIn = status && !status.clock_out_at;

  return (
    <div className="flex items-center gap-3">
      {isClockedIn ? (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              disabled={loading}
              variant="destructive"
              size="sm"
              className="gap-2 h-8 px-3"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="text-xs font-bold uppercase tracking-wider">
                {loading ? "Clocking Out..." : "Clock Out"}
              </span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmation</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to clock out for today?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleClockOut}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Confirm Clock Out
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : status?.clock_out_at ? (
        <Badge
          variant="outline"
          className="h-8 gap-2 px-3 border-muted-foreground/20 text-muted-foreground font-medium"
        >
          <Clock className="h-3.5 w-3.5" />
          <span className="text-[10px] uppercase tracking-widest">
            Work Completed
          </span>
        </Badge>
      ) : (
        <Button
          disabled={loading}
          onClick={handleClockIn}
          variant="outline"
          size="sm"
          className="gap-2 h-8 px-3 border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all"
        >
          <Clock className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            {loading ? "Clocking In..." : "Clock In Now"}
          </span>
        </Button>
      )}
    </div>
  );
}
