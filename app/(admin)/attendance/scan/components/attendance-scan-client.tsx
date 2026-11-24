"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Clock,
  MapPin,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  RefreshCw,
  ArrowRight,
  Loader2,
  Camera,
  RotateCcw,
  Coffee,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  clockIn,
  clockOut,
  endBreak,
  startBreak,
  type ClockInRecord,
  type LocationData,
} from "@/lib/api/clock-in";
import { getDeviceSignature } from "@/lib/utils/device-fingerprint";
import { getGPSLocation, getPublicIP } from "@/lib/utils/location";
import { LatePermissionRequestModal } from "@/components/late-permission-request-modal";
import { useUser } from "@/providers/user-provider";
import { toast } from "sonner";
import { CameraQrScanner } from "@/components/attendance/camera-qr-scanner";
import { useTodayAttendance } from "@/hooks/use-today-attendance";
import { toProxiedImageUrl } from "@/lib/utils/image-url";

function playSuccessChime() {
  try {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([40, 60, 100]);
    }
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sine";
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.setValueAtTime(880.0, now + 0.12); // A5

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.start(now);
    osc.stop(now + 0.36);
  } catch {
    // Non-critical audio
  }
}

export function AttendanceScanClient({
  initialStatus,
}: {
  initialStatus: ClockInRecord | null;
}) {
  const router = useRouter();
  const { user } = useUser();
  const [scannerOpen, setScannerOpen] = useState(false);
  const { status, updateStatus, refetch } = useTodayAttendance(initialStatus);
  const [imageFailed, setImageFailed] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<string>("");

  // Location & device state
  const [isLocating, setIsLocating] = useState(false);
  const [location, setLocation] = useState<LocationData | undefined>();
  const [clientIp, setClientIp] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justClockedIn, setJustClockedIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Automatically submit once when the office QR opens this page.
  const hasAutoTriggered = useRef(false);
  const scanIntentRef = useRef<"clock_in" | "start_break" | "end_break" | "clock_out">("clock_in");
  const [isAutoClockingIn, setIsAutoClockingIn] = useState(!initialStatus?.clock_in_at);
  const [clockOutConfirmOpen, setClockOutConfirmOpen] = useState(false);
  const [unclosedBreakConfirmOpen, setUnclosedBreakConfirmOpen] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [isAfterSixPm, setIsAfterSixPm] = useState(false);

  // Live Lagos time update
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setNowMs(now.getTime());
      const lagosHour = Number(
        now.toLocaleString("en-GB", {
          hour: "2-digit",
          hour12: false,
          timeZone: "Africa/Lagos",
        })
      );
      setIsAfterSixPm(lagosHour >= 18);
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
          timeZone: "Africa/Lagos",
        })
      );
      setCurrentDate(
        now.toLocaleDateString("en-US", {
          weekday: "long",
          month: "short",
          day: "numeric",
          year: "numeric",
          timeZone: "Africa/Lagos",
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Primary clock-in action (handles both auto on scan and manual retry)
  const handleClockIn = async (isQrScan: boolean = true) => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const deviceData = getDeviceSignature();

      // QR attendance requires GPS, so wait for a location fix before submitting.
      let resolvedLoc = location;
      let resolvedIp = clientIp;

      if (!resolvedLoc) {
        setIsLocating(true);
        try {
          resolvedLoc = await getGPSLocation();
          setLocation(resolvedLoc);
        } catch {
          const message = "Location isn't available. Allow location access and scan the office QR again.";
          setErrorMessage(message);
          toast.error(message);
          return;
        } finally {
          setIsLocating(false);
        }
      }
      if (!resolvedIp) {
        resolvedIp = await getPublicIP().catch(() => undefined);
        if (resolvedIp) setClientIp(resolvedIp);
      }

      // Explicitly pass qr_scan = true to backend
      const response = await clockIn(resolvedLoc, resolvedIp, deviceData, isQrScan);

      if (response.success) {
        await updateStatus(response.data.data);
        setJustClockedIn(true);
        playSuccessChime();
        toast.success(response.data.message || "Clock-in recorded successfully!");
        router.refresh();
      } else {
        const errorText =
          response.error?.error ||
          "Unable to clock in. Please ensure you are within office premises.";
        setErrorMessage(errorText);
        toast.error(errorText);
      }
    } catch (error) {
      console.error(error);
      const msg = "An unexpected error occurred while clocking in.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
      setIsAutoClockingIn(false);
    }
  };

  // Scanning the printed QR opens this route and starts the location check.
  useEffect(() => {
    const action = new URLSearchParams(window.location.search).get("action");
    if (!status || status.clock_out_at) return;

    if (action === "end_break" && status.is_on_break) {
      scanIntentRef.current = "end_break";
      setScannerOpen(true);
    } else if (action === "start_break" && !status.is_on_break) {
      scanIntentRef.current = "start_break";
      setScannerOpen(true);
    } else if (action === "clock_out" && !status.is_on_break) {
      scanIntentRef.current = "clock_out";
      setScannerOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!hasAutoTriggered.current && !status?.clock_in_at) {
      hasAutoTriggered.current = true;
      setIsAutoClockingIn(true);
      handleClockIn(true);
    }
  }, []);

  // Refetch status manually
  const refreshStatus = async () => {
    const result = await refetch();
    if (result.isError) toast.error("Unable to refresh attendance status. Please try again.");
  };

  const resolveFreshPresence = async (failureMessage: string): Promise<{
    location: LocationData;
    clientIp?: string;
  } | null> => {
    setIsLocating(true);
    try {
      const resolvedLocation = await getGPSLocation();
      setLocation(resolvedLocation);
      const resolvedIp = clientIp || await getPublicIP().catch(() => undefined);
      if (resolvedIp) setClientIp(resolvedIp);
      return { location: resolvedLocation, clientIp: resolvedIp };
    } catch {
      setErrorMessage(failureMessage);
      toast.error(failureMessage);
      return null;
    } finally {
      setIsLocating(false);
    }
  };

  const handleBreakScan = async (direction: "start" | "end", isQrScan: boolean = true) => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const presence = await resolveFreshPresence(
        "Location isn't available. Allow location access and try scanning the office QR again."
      );
      if (!presence) return;

      const response =
        direction === "start"
          ? await startBreak(presence.location, presence.clientIp, isQrScan)
          : await endBreak(presence.location, presence.clientIp, isQrScan);

      if (response.success) {
        await updateStatus(response.data.data);
        playSuccessChime();
        toast.success(
          response.data.message ||
            (direction === "start"
              ? "Break started via Office QR."
              : "Welcome back! Break ended via Office QR.")
        );
        router.refresh();
      } else {
        const msg = response.error?.error || `Unable to ${direction} break.`;
        setErrorMessage(msg);
        toast.error(msg);
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred while updating your break.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClockOut = async (isQrScan: boolean = true) => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      // Clock-out can happen long after the page loaded, so don't rely on the
      // location captured during clock-in (or an empty initial page state).
      const presence = await resolveFreshPresence(
        "Location isn't available. Allow location access and try scanning the office QR again."
      );
      if (!presence) return;

      const response = await clockOut(presence.location, presence.clientIp, isQrScan);

      if (response.success) {
        await updateStatus(response.data.data);
        playSuccessChime();
        toast.success("Clock-out recorded successfully via Wall QR!");
        router.refresh();
        const netMinutes = response.data.data.net_work_minutes ?? response.data.data.duration_minutes;
        if (netMinutes !== null && netMinutes !== undefined) {
          const hours = Math.floor(netMinutes / 60);
          const minutes = netMinutes % 60;
          toast.info(`Net work time: ${hours}h ${minutes}m`);
        }
        if (response.data.data.has_unclosed_break) {
          toast.warning("Your open break was left unclosed and flagged for HR review.");
        }
      } else {
        toast.error(response.error?.error || "Unable to clock out.");
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred while clocking out.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isClockedIn = Boolean(status && !status.clock_out_at);
  const isClockedOut = Boolean(status && status.clock_out_at);
  const isOnBreak = Boolean(isClockedIn && status?.is_on_break);
  const completedBreakMinutes = status?.completed_break_minutes ?? 0;
  const activeBreakMinutes =
    isOnBreak && status?.active_break?.started_at
      ? Math.max(0, Math.floor((nowMs - new Date(status.active_break.started_at).getTime()) / 60000))
      : 0;
  const liveBreakMinutes = completedBreakMinutes + activeBreakMinutes;
  const isBreakOverLimit = Boolean(status?.is_break_over_limit) || liveBreakMinutes > 60;

  useEffect(() => {
    if (!status?.id || !isOnBreak || liveBreakMinutes <= 60) return;

    const alertKey = `break-over-limit-alerted-${status.id}`;
    try {
      if (sessionStorage.getItem(alertKey)) return;
      sessionStorage.setItem(alertKey, "1");
    } catch {
      /* ignore */
    }

    toast.warning("You have passed your 60-minute daily break allowance.", {
      description: "Remember to return from break once you are back at work.",
      duration: 8000,
    });
  }, [status?.id, isOnBreak, liveBreakMinutes]);
  const profileImage = user?.image_url && !imageFailed
    ? toProxiedImageUrl(user.image_url)
    : undefined;

  return (
    <div className="flex w-full min-w-0 flex-1 flex-col items-center px-3 py-4 sm:px-6 sm:py-6">
      <main className="w-full max-w-xl space-y-4">
        {/* Compact Action-First Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-0.5">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Attendance Center
            </h1>
            <p className="text-xs text-muted-foreground">
              {currentDate || "Today"} &bull; Lagos Office (WAT)
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1.5 rounded-lg border bg-card px-2.5 py-1.5 shadow-2xs">
              <Clock className="size-3.5 text-primary" aria-hidden="true" />
              <span className="font-mono text-sm font-semibold tabular-nums tracking-tight text-foreground">
                {currentTime || "--:--:--"}
              </span>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={refreshStatus}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="Refresh attendance status"
              aria-label="Refresh attendance status"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* 1-Step Auto Clock-in Loading State */}
        {isAutoClockingIn && !isClockedIn ? (
          <Card className="border-primary/25 bg-primary/5 shadow-sm">
            <CardHeader className="space-y-3 p-5 text-center sm:p-6">
              <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-foreground">
                  Recording Your Attendance...
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-1">
                  Office QR scan verified. Registering arrival time in 1 step...
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        ) : isClockedIn ? (
          justClockedIn ? (
            /* Just Clocked In State - Celebratory Card */
            <Card className="border-emerald-500/30 bg-emerald-50/40 shadow-sm dark:bg-emerald-950/20">
              <CardHeader className="p-4 sm:p-5 text-center">
                <div className="mx-auto h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mb-2 shadow-xs">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <CardTitle className="text-xl font-bold text-emerald-900 dark:text-emerald-200">
                  Clock-in Successful!
                </CardTitle>
                <CardDescription className="text-xs text-emerald-700 dark:text-emerald-400">
                  Logged at{" "}
                  <span className="font-bold font-mono text-sm">
                    {status?.clock_in_at
                      ? new Date(status.clock_in_at).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })
                      : currentTime}
                  </span>{" "}
                  via Office Wall QR
                </CardDescription>

                {status?.is_flagged_proxy && (
                  <div className="mt-2 p-2 rounded bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300">
                    ⚠️ Note: {status.proxy_reason || "Flagged for administrative review."}
                  </div>
                )}
              </CardHeader>

              <CardContent className="p-4 sm:p-5 pt-0 space-y-2.5">
                <Button
                  asChild
                  className="w-full h-11 text-sm font-semibold tracking-wide gap-2 shadow-sm cursor-pointer"
                >
                  <Link href="/dashboard">
                    <span>Go to Staff Dashboard</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : isOnBreak ? (
            /* Currently On Break -> Single Primary CTA to Return from Break */
            <Card className="border-amber-500/35 bg-amber-50/30 shadow-sm dark:bg-amber-950/15">
              <CardHeader className="p-4 sm:p-5 text-center">
                <div className="mx-auto h-14 w-14 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 flex items-center justify-center mb-2 shadow-xs">
                  <Coffee className="h-7 w-7" />
                </div>
                <CardTitle className="text-xl font-bold text-foreground">
                  Welcome Back — Return from Break
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Break started at{" "}
                  <span className="font-bold font-mono text-foreground">
                    {status?.active_break?.started_at
                      ? new Date(status.active_break.started_at).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })
                      : currentTime}
                  </span>{" "}
                  &bull; Today&apos;s break total:{" "}
                  <span className={`font-bold font-mono ${isBreakOverLimit ? "text-rose-600 dark:text-rose-400" : "text-foreground"}`}>
                    {liveBreakMinutes}m
                  </span>
                </CardDescription>

                {isBreakOverLimit && (
                  <div className="mt-2 rounded-md border border-rose-300 bg-rose-500/10 p-2 text-[11px] font-medium text-rose-700 dark:border-rose-800 dark:text-rose-300">
                    You have passed your 60-minute daily break allowance. Scan to resume work.
                  </div>
                )}
              </CardHeader>

              <CardContent className="p-4 sm:p-5 pt-0 space-y-3">
                <Button
                  onClick={() => {
                    scanIntentRef.current = "end_break";
                    setScannerOpen(true);
                  }}
                  disabled={isSubmitting}
                  className="h-12 w-full gap-2 bg-emerald-600 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{isLocating ? "Getting Location..." : "Resuming Shift..."}</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      <span>Scan Office QR to Return from Break</span>
                    </>
                  )}
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="h-11 w-full gap-1.5 text-sm font-medium"
                >
                  <Link href="/dashboard">
                    <span>Back to Staff Dashboard</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>

                <div className="pt-1 text-center">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setUnclosedBreakConfirmOpen(true)}
                    className="text-[11px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline cursor-pointer"
                  >
                    Forgot to end break earlier and leaving for the day?
                  </button>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Clocked In & Working -> Separate Break vs End Shift Actions */
            <Card className="border-border/70 shadow-sm">
              <CardHeader className="p-4 sm:p-5 text-center">
                <div className={`mx-auto h-14 w-14 rounded-full flex items-center justify-center mb-2 shadow-xs ${
                  isAfterSixPm
                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                }`}>
                  {isAfterSixPm ? <LogOut className="h-7 w-7" /> : <Coffee className="h-7 w-7" />}
                </div>
                <CardTitle className="text-xl font-bold text-foreground">
                  {isAfterSixPm ? "Take a Break or End Shift?" : "Need a Break?"}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Shift started at{" "}
                  <span className="font-bold font-mono text-xs text-foreground">
                    {status?.clock_in_at
                      ? new Date(status.clock_in_at).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })
                      : currentTime}
                  </span>{" "}
                  &bull;{" "}
                  {completedBreakMinutes > 60
                    ? `60m break allowance exceeded (${completedBreakMinutes}m used)`
                    : `${Math.max(0, 60 - completedBreakMinutes)}m of 60m break left`}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-4 sm:p-5 pt-0 space-y-3">
                <Button
                  onClick={() => {
                    scanIntentRef.current = "start_break";
                    setScannerOpen(true);
                  }}
                  disabled={isSubmitting}
                  variant={isAfterSixPm ? "outline" : "default"}
                  className={`h-12 w-full gap-2 text-sm font-semibold shadow-sm ${
                    isAfterSixPm
                      ? "border-amber-300 bg-amber-50/70 text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
                      : "bg-amber-600 text-white hover:bg-amber-700"
                  }`}
                >
                  {isSubmitting && scanIntentRef.current === "start_break" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{isLocating ? "Getting Location..." : "Starting Break..."}</span>
                    </>
                  ) : (
                    <>
                      <Coffee className="h-4 w-4" />
                      <span>Scan Office QR to Take a Break</span>
                    </>
                  )}
                </Button>

                <div className="relative py-1">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border/70" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
                    <span className="bg-card px-2 text-muted-foreground">Or finish workday</span>
                  </div>
                </div>

                <Button
                  onClick={() => setClockOutConfirmOpen(true)}
                  disabled={isSubmitting}
                  variant={isAfterSixPm ? "destructive" : "outline"}
                  className={`h-11 w-full gap-2 text-sm font-semibold ${
                    isAfterSixPm
                      ? ""
                      : "border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  }`}
                >
                  {isSubmitting && scanIntentRef.current === "clock_out" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{isLocating ? "Getting Location..." : "Recording Clock Out..."}</span>
                    </>
                  ) : (
                    <>
                      <LogOut className="h-4 w-4" />
                      <span>End Shift for Today (Clock Out)</span>
                    </>
                  )}
                </Button>

                <Button
                  asChild
                  variant="ghost"
                  className="h-10 w-full gap-1.5 text-xs font-medium text-muted-foreground"
                >
                  <Link href="/dashboard">
                    <span>Continue Working / Dashboard</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )
        ) : isClockedOut && status ? (
          /* Clocked Out State */
          <Card className="border-border/60 shadow-xs">
            <CardHeader className="p-4 sm:p-5 text-center">
              <CardTitle className="text-lg font-bold">Shift Completed</CardTitle>
              <CardDescription className="text-xs">
                You have finished your work day for today.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 pt-0 space-y-3">
              <div className="p-3 rounded-lg bg-muted/40 border border-muted/60 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Clock In:</span>
                  <span className="font-mono font-medium">
                    {status.clock_in_at
                      ? new Date(status.clock_in_at).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Clock Out:</span>
                  <span className="font-mono font-medium">
                    {status.clock_out_at
                      ? new Date(status.clock_out_at).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })
                      : "-"}
                  </span>
                </div>
                {(status.completed_break_minutes ?? 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Break Time:</span>
                    <span className="font-mono font-medium">{status.completed_break_minutes}m</span>
                  </div>
                )}
                {(status.net_work_minutes ?? status.duration_minutes) !== null &&
                  (status.net_work_minutes ?? status.duration_minutes) !== undefined && (
                    <div className="flex justify-between pt-1 border-t border-muted/80">
                      <span className="font-semibold">Net Work Time:</span>
                      <span className="font-bold text-primary">
                        {Math.floor(((status.net_work_minutes ?? status.duration_minutes) || 0) / 60)}h{" "}
                        {((status.net_work_minutes ?? status.duration_minutes) || 0) % 60}m
                      </span>
                    </div>
                  )}
                {status.has_unclosed_break && (
                  <div className="mt-1 rounded border border-amber-300 bg-amber-500/10 p-2 text-[11px] text-amber-800 dark:border-amber-800 dark:text-amber-300">
                    An open break was left unclosed and flagged for HR review.
                  </div>
                )}
              </div>

              <Button asChild className="w-full h-11 text-xs font-semibold gap-2">
                <Link href="/dashboard">
                  <span>Go to Staff Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Error or Manual Retry State */
          <Card className="border-border/60 shadow-md">
            <CardHeader className="p-4 sm:p-5 pb-2 text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mb-1">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg font-bold">Action Required</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {errorMessage || "Attendance could not be automatically recorded."}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 sm:p-5 space-y-3">
              <Button
                onClick={() => handleClockIn(true)}
                disabled={isSubmitting}
                className="w-full h-12 text-sm font-bold uppercase tracking-wider gap-2 shadow-md cursor-pointer transition-all active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Recording Attendance...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4" />
                    <span>Retry Clock In Now</span>
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => setScannerOpen(true)}
                disabled={isSubmitting}
                className="w-full h-11 text-xs font-semibold gap-2 border-primary/30 hover:border-primary/60 text-primary cursor-pointer"
              >
                <Camera className="h-4 w-4 text-primary" />
                <span>Scan Wall QR with In-App Camera</span>
              </Button>

              <div className="flex items-center justify-center gap-1.5 pt-1">
                <span className="text-xs text-muted-foreground">Arrived after 9:00 AM?</span>
                <LatePermissionRequestModal
                  trigger={
                    <button
                      type="button"
                      className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                    >
                      Request Late Permission
                    </button>
                  }
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Compact Staff & Verification Summary */}
        <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card p-3.5 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            {profileImage ? (
              <div className="relative size-9 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
                <Image
                  src={profileImage}
                  alt={user?.name || "User"}
                  fill
                  unoptimized
                  className="object-cover"
                  onError={() => setImageFailed(true)}
                />
              </div>
            ) : (
              <div aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {user?.name?.trim()?.[0]?.toUpperCase() || "U"}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-tight text-foreground">
                {user?.name || "Staff Member"}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {user?.department || user?.role || "Aspom Staff"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/25 bg-emerald-500/10 px-2 py-1 font-medium text-emerald-700 dark:text-emerald-400">
              <MapPin className="size-3" aria-hidden="true" />
              Office QR
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/25 bg-emerald-500/10 px-2 py-1 font-medium text-emerald-700 dark:text-emerald-400">
              <Smartphone className="size-3" aria-hidden="true" />
              Device Verified
            </span>
            <span
              className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-1 text-muted-foreground"
              title="Device signature and physical office QR ensure authentic attendance."
            >
              <ShieldCheck className="size-3 text-primary" aria-hidden="true" />
              Protected
            </span>
          </div>
        </div>
      </main>

      {/* Smart Clock-Out Confirmation (prevents mistaking Break for End Shift) */}
      <AlertDialog open={clockOutConfirmOpen} onOpenChange={setClockOutConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End your shift for today?</AlertDialogTitle>
            <AlertDialogDescription>
              This marks your workday as finished and you won&apos;t be able to clock back in today. If you are only stepping out, take a break instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setClockOutConfirmOpen(false);
              scanIntentRef.current = "start_break";
              setScannerOpen(true);
            }}
            className="w-full border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
          >
            <Coffee className="mr-1.5 h-3.5 w-3.5" />
            Take a Break Instead
          </Button>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                setClockOutConfirmOpen(false);
                scanIntentRef.current = "clock_out";
                setScannerOpen(true);
              }}
            >
              Yes, Scan QR to End Shift
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unclosed Break Clock-Out Confirmation */}
      <AlertDialog open={unclosedBreakConfirmOpen} onOpenChange={setUnclosedBreakConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End shift with an unclosed break?</AlertDialogTitle>
            <AlertDialogDescription>
              You currently have an open break. If you forgot to check back in from break and are leaving for the day, ending your shift now will leave the break unclosed and flag it for HR review.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                setUnclosedBreakConfirmOpen(false);
                scanIntentRef.current = "clock_out";
                setScannerOpen(true);
              }}
            >
              Continue to Clock Out QR
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* In-App Camera Scanner Modal */}
      <CameraQrScanner
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        isSubmitting={isSubmitting}
        onScanSuccess={async (scannedCode) => {
          let isOfficeQr = false;
          try {
            const scannedUrl = new URL(scannedCode);
            isOfficeQr = scannedUrl.origin === window.location.origin &&
              scannedUrl.pathname === "/attendance/scan";
          } catch {
            isOfficeQr = false;
          }

          if (!isOfficeQr) {
            setErrorMessage("That isn’t the office attendance QR code. Scan the code on the office poster.");
            setScannerOpen(false);
            scanIntentRef.current = "clock_in";
            return;
          }

          const intent = scanIntentRef.current;
          scanIntentRef.current = "clock_in";

          if (intent === "end_break" && isClockedIn) {
            toast.success("Office QR code confirmed. Ending your break...");
            await handleBreakScan("end", true);
          } else if (intent === "start_break" && isClockedIn) {
            toast.success("Office QR code confirmed. Starting your break...");
            await handleBreakScan("start", true);
          } else if (intent === "clock_out" && isClockedIn) {
            toast.success("Office QR code confirmed. Getting your location...");
            await handleClockOut(true);
          } else {
            toast.success("Office QR Code verified! Clocking you in...");
            await handleClockIn(true);
          }
          setScannerOpen(false);
        }}
      />
    </div>
  );
}
