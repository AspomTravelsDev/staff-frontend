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
  Building2,
  Calendar,
  Sparkles,
  ArrowRight,
  Loader2,
  Camera,
  RotateCcw,
  ArrowLeft,
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
  getTodayStatus,
  type ClockInRecord,
  type LocationData,
} from "@/lib/api/clock-in";
import { getDeviceSignature } from "@/lib/utils/device-fingerprint";
import { getGPSLocation, getPublicIP } from "@/lib/utils/location";
import { LatePermissionRequestModal } from "@/components/late-permission-request-modal";
import { useUser } from "@/providers/user-provider";
import { toast } from "sonner";
import { CameraQrScanner } from "@/components/attendance/camera-qr-scanner";

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
  const [status, setStatus] = useState<ClockInRecord | null>(initialStatus);
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
  const clockOutScanRequested = useRef(false);
  const [isAutoClockingIn, setIsAutoClockingIn] = useState(!initialStatus?.clock_in_at);

  // Live Lagos time update
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
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
        setStatus(response.data.data);
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
    const requestedClockOut = new URLSearchParams(window.location.search).get("action") === "clock_out";
    if (requestedClockOut && status && !status.clock_out_at) {
      clockOutScanRequested.current = true;
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
    try {
      const res = await getTodayStatus();
      if (res.success) {
        setStatus(res.data.data);
      }
    } catch (e) {
      console.error("Failed to refresh status:", e);
    }
  };

  const handleClockOut = async (isQrScan: boolean = true) => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      // Clock-out can happen long after the page loaded, so don't rely on the
      // location captured during clock-in (or an empty initial page state).
      setIsLocating(true);
      let resolvedLocation: LocationData;
      try {
        resolvedLocation = await getGPSLocation();
        setLocation(resolvedLocation);
      } catch {
        const message = "Location isn't available. Allow location access and try scanning the office QR again.";
        setErrorMessage(message);
        toast.error(message);
        return;
      } finally {
        setIsLocating(false);
      }

      const resolvedIp = clientIp || await getPublicIP().catch(() => undefined);
      if (resolvedIp) setClientIp(resolvedIp);

      const response = await clockOut(resolvedLocation, resolvedIp, isQrScan);

      if (response.success) {
        setStatus(response.data.data);
        playSuccessChime();
        toast.success("Clock-out recorded successfully via Wall QR!");
        router.refresh();
        if (response.data.data.duration_minutes) {
          const hours = Math.floor(response.data.data.duration_minutes / 60);
          const minutes = response.data.data.duration_minutes % 60;
          toast.info(`Total time logged: ${hours}h ${minutes}m`);
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

  return (
    <div className="relative isolate min-h-dvh overflow-hidden bg-linear-to-b from-slate-50 via-slate-100/50 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col items-center justify-start px-4 py-5 sm:px-6 sm:py-8">
      <div aria-hidden="true" className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-80 w-[36rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      {/* Brand Header */}
      <div className="w-full max-w-xl flex items-center justify-between py-2 mb-5">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-md font-bold text-sm ring-4 ring-primary/10">
            AT
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight">Aspom Travels</h1>
            <p className="text-[11px] text-muted-foreground font-medium">Attendance center</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button asChild variant="ghost" size="sm" className="h-9 gap-1.5 px-2.5 text-muted-foreground hover:text-foreground">
            <Link href="/dashboard" title="Return to the staff portal">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline text-xs font-medium">Portal</span>
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={refreshStatus}
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
            title="Refresh attendance status"
            aria-label="Refresh attendance status"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <main className="w-full max-w-xl space-y-5">
        <div className="px-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Staff attendance</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Clock in and out</h2>
          <p className="mt-1 text-sm text-muted-foreground">Verify your office presence and view today&apos;s attendance status.</p>
        </div>
        {/* User Card & Digital Clock */}
        <Card className="border-border/70 shadow-sm backdrop-blur-sm overflow-hidden rounded-2xl">
          <div className="h-2 bg-linear-to-r from-primary via-indigo-500 to-sky-400" />
          <CardHeader className="p-4 sm:p-5 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {user?.image_url ? (
                  <div className="relative h-11 w-11 rounded-full overflow-hidden border border-border">
                    <Image
                      src={user.image_url}
                      alt={user.name || "User"}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-11 w-11 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-base">
                    {user?.name?.[0] || "U"}
                  </div>
                )}
                <div>
                  <h2 className="font-semibold text-base leading-tight">
                    {user?.name || "Staff Member"}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {user?.department || user?.role || "Aspom Staff"}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1 justify-end">
                  <Calendar className="h-3 w-3" />
                  WAT
                </span>
                <p className="text-xs font-medium text-foreground">
                  {currentDate || "Today"}
                </p>
              </div>
            </div>

            {/* Big Live Clock */}
            <div className="mt-4 p-3 rounded-xl bg-muted/40 border border-muted/60 flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4 text-primary animate-pulse" />
                <span className="text-xs font-medium">Lagos Office Time</span>
              </div>
              <span className="text-lg sm:text-xl font-mono font-bold tracking-tight text-foreground">
                {currentTime || "--:--:--"}
              </span>
            </div>
          </CardHeader>

          {/* Verification Indicators */}
          <CardContent className="p-4 sm:p-5 pt-0">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-background border border-border/70">
                <MapPin className="h-4 w-4 shrink-0 text-emerald-500" />
                <div className="min-w-0">
                  <p className="font-medium text-[11px] truncate">Presence Proof</p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold truncate">
                    Office Wall QR Scanned
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-background border border-border/70">
                <Smartphone className="h-4 w-4 shrink-0 text-emerald-500" />
                <div className="min-w-0">
                  <p className="font-medium text-[11px] truncate">Device Signature</p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium truncate">
                    Hardware Verified
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 1-Step Auto Clock-in Loading State */}
        {isAutoClockingIn && !isClockedIn ? (
          <Card className="border-primary/30 bg-primary/5 shadow-md animate-pulse">
            <CardHeader className="p-6 text-center space-y-3">
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
            <Card className="border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-md">
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
          ) : (
            /* Re-scanned Wall QR While Clocked In -> Ready to Clock Out */
            <Card className="border-primary/30 bg-linear-to-b from-primary/5 via-card to-card shadow-md">
              <CardHeader className="p-4 sm:p-5 text-center">
                <div className="mx-auto h-14 w-14 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-2 shadow-xs">
                  <LogOut className="h-7 w-7" />
                </div>
                <CardTitle className="text-xl font-bold text-foreground">
                  Ready to Clock Out?
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Office Wall QR verified &bull; Shift started at{" "}
                  <span className="font-bold font-mono text-xs text-foreground">
                    {status?.clock_in_at
                      ? new Date(status.clock_in_at).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })
                      : currentTime}
                  </span>
                </CardDescription>
              </CardHeader>

              <CardContent className="p-4 sm:p-5 pt-0 space-y-3">
                <Button
                  onClick={() => {
                    clockOutScanRequested.current = true;
                    setScannerOpen(true);
                  }}
                  disabled={isSubmitting}
                  className="w-full h-12 text-sm font-bold uppercase tracking-wider gap-2 shadow-md cursor-pointer bg-destructive hover:bg-destructive/90 text-destructive-foreground transition-all active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{isLocating ? "Getting Location..." : "Recording Clock Out..."}</span>
                    </>
                  ) : (
                    <>
                      <LogOut className="h-4 w-4" />
                      <span>Scan Office QR to Clock Out</span>
                    </>
                  )}
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="w-full h-10 text-xs font-semibold tracking-wide gap-1.5 cursor-pointer"
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
              <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-1">
                <Sparkles className="h-6 w-6" />
              </div>
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
                {status.duration_minutes !== null && status.duration_minutes !== undefined && (
                  <div className="flex justify-between pt-1 border-t border-muted/80">
                    <span className="font-semibold">Total Duration:</span>
                    <span className="font-bold text-primary">
                      {Math.floor(status.duration_minutes / 60)}h{" "}
                      {status.duration_minutes % 60}m
                    </span>
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

        {/* Security & Anti-Proxy Notice */}
        <div className="p-3.5 rounded-xl bg-background/70 border border-border/70 text-center shadow-xs">
          <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            Device signature & physical office QR ensure authentic attendance.
          </p>
        </div>
      </main>

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
            clockOutScanRequested.current = false;
            return;
          }

          if (clockOutScanRequested.current && isClockedIn) {
            clockOutScanRequested.current = false;
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
