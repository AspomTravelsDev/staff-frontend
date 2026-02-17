"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  MapPin,
  LogOut,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  clockIn,
  clockOut,
  type ClockInRecord,
  type LocationData,
} from "@/lib/api/clock-in";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

interface ClockInActionProps {
  initialStatus: ClockInRecord | null;
}

export function ClockInAction({ initialStatus }: ClockInActionProps) {
  const router = useRouter();
  const [status, setStatus] = useState<ClockInRecord | null>(initialStatus);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [elapsedTime, setElapsedTime] = useState<string>("00:00:00");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to calculate elapsed time
  const updateTimer = () => {
    if (status?.clock_in_at && !status.clock_out_at) {
      const start = new Date(status.clock_in_at).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, now - start);

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setElapsedTime(
        `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
      );
    }
  };

  useEffect(() => {
    if (status?.clock_in_at && !status.clock_out_at) {
      updateTimer(); // Initial update
      timerRef.current = setInterval(updateTimer, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsedTime("00:00:00");
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  const getLocation = (): Promise<LocationData | undefined> => {
    return new Promise((resolve) => {
      if (!("geolocation" in navigator)) {
        toast.warning("Geolocation not supported. Trying IP fallback...");
        resolve(undefined);
        return;
      }

      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocating(false);
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          setLocating(false);
          console.error("Location error:", error);
          if (error.code === error.PERMISSION_DENIED) {
            toast.error(
              "Location permission denied. Please enable it to use GPS validation.",
            );
          } else if (error.code === error.TIMEOUT) {
            toast.error("Location request timed out.");
          } else {
            toast.error("Could not get location. Trying IP fallback...");
          }
          resolve(undefined);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000,
        },
      );
    });
  };

  const handleAction = async (action: "in" | "out") => {
    // 1. Get client IP (optional, backend can also get it from headers)
    let clientIp: string | undefined;
    try {
      const ipRes = await fetch("https://api.ipify.org?format=json");
      const ipData = await ipRes.json();
      clientIp = ipData.ip;
    } catch (e) {
      console.warn("Could not fetch client IP", e);
    }

    // 2. Get Location
    const location = await getLocation();

    setLoading(true);

    try {
      let result;
      if (action === "in") {
        result = await clockIn(location, clientIp);
      } else {
        result = await clockOut(location, clientIp);
      }

      if (result.success) {
        setStatus(result.data.data);
        if (action === "in") {
          toast.success("Successfully clocked in!");
        } else {
          toast.success("Successfully clocked out!");
          // Stop timer immediately for better UX
          if (timerRef.current) clearInterval(timerRef.current);
        }
        router.refresh(); // Refresh server components
      } else {
        const errorMsg = result.error?.error || "Action failed";
        const errorCode = result.error?.code;

        if (errorCode === "LOCATION_RESTRICTED") {
          // Check for specific 6pm message or generic location message
          if (errorMsg.includes("after 6:00 PM")) {
            toast.error("Time Restriction", {
              description: "Clock-out is only allowed after 6:00 PM.",
            });
          } else {
            toast.error("Location restricted!", {
              description: "You must be at the office or on office WiFi.",
            });
          }
        } else {
          toast.error(errorMsg);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const isClockedIn =
    status?.is_clocked_in || (status?.clock_in_at && !status?.clock_out_at);
  const isDoneForDay = status?.clock_in_at && status?.clock_out_at;

  return (
    <Card
      className={cn(
        "border-l-4 shadow-sm",
        isClockedIn
          ? "border-l-green-500"
          : isDoneForDay
            ? "border-l-blue-500"
            : "border-l-amber-500",
      )}
    >
      <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "p-3 rounded-full",
              isClockedIn
                ? "bg-green-100 text-green-700"
                : isDoneForDay
                  ? "bg-blue-100 text-blue-700"
                  : "bg-amber-100 text-amber-700",
            )}
          >
            {isDoneForDay ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : (
              <Clock className="w-6 h-6" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-lg">
              {isClockedIn
                ? "You are Clocked In"
                : isDoneForDay
                  ? "Work Completed for Today"
                  : "Not Clocked In"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isClockedIn
                ? `Working for: ${elapsedTime}`
                : isDoneForDay
                  ? "You have clocked out for the day. See you tomorrow!"
                  : "Please clock in when you arrive at the office."}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {isDoneForDay ? (
            <Button
              variant="outline"
              disabled
              className="w-full sm:w-auto min-w-[140px]"
            >
              Completed
            </Button>
          ) : isClockedIn ? (
            <Button
              variant="destructive"
              size="lg"
              onClick={() => handleAction("out")}
              disabled={loading || locating}
              className="w-full sm:w-auto min-w-[140px]"
            >
              {loading || locating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {locating ? "Locating..." : "Clocking Out..."}
                </>
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" />
                  Clock Out
                </>
              )}
            </Button>
          ) : (
            <Button
              variant="default"
              size="lg"
              onClick={() => handleAction("in")}
              disabled={loading || locating}
              className="w-full sm:w-auto min-w-[140px] bg-green-600 hover:bg-green-700"
            >
              {loading || locating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {locating ? "Locating..." : "Clocking In..."}
                </>
              ) : (
                <>
                  <MapPin className="mr-2 h-4 w-4" />
                  Clock In
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
