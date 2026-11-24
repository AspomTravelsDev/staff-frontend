"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Clock, Coffee, LogOut, Play, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  clockIn,
  clockOut,
  endBreak,
  startBreak,
  type LocationData,
} from "@/lib/api/clock-in";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { LatePermissionRequestModal } from "@/components/late-permission-request-modal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getDeviceSignature } from "@/lib/utils/device-fingerprint";
import { useClockInMode } from "@/hooks/use-clock-in-mode";
import { CameraQrScanner } from "@/components/attendance/camera-qr-scanner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTodayAttendance } from "@/hooks/use-today-attendance";

async function fetchPresenceContext(): Promise<{
  location?: LocationData;
  client_ip?: string;
}> {
  try {
    const { getGPSLocation, getPublicIP } = await import("@/lib/utils/location");
    const [location, client_ip] = await Promise.all([
      getGPSLocation().catch(() => undefined),
      getPublicIP().catch(() => undefined),
    ]);
    return { location, client_ip };
  } catch (err) {
    console.error("Failed to fetch location/IP:", err);
    return {};
  }
}

function formatBreakElapsed(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  }
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

export function ClockInWidget() {
  const router = useRouter();
  const { isButtonEnabled, isQrCodeEnabled, mode } = useClockInMode();
  const [loading, setLoading] = useState(false);
  const { status, updateStatus, isPending, isError, refetch } = useTodayAttendance();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [clockOutDialogOpen, setClockOutDialogOpen] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const isClockedIn = Boolean(status && !status.clock_out_at);
  const isOnBreak = Boolean(isClockedIn && status?.is_on_break);

  useEffect(() => {
    if (!isOnBreak) return;
    setNowMs(Date.now());
    const interval = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isOnBreak]);

  const completedBreakMinutes = status?.completed_break_minutes ?? 0;
  const activeBreakSeconds =
    isOnBreak && status?.active_break?.started_at
      ? Math.max(0, Math.floor((nowMs - new Date(status.active_break.started_at).getTime()) / 1000))
      : 0;
  const liveBreakSeconds = completedBreakMinutes * 60 + activeBreakSeconds;
  const liveBreakMinutes = Math.floor(liveBreakSeconds / 60);
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

  const handleClockIn = async (isQrScan: boolean = false) => {
    try {
      setLoading(true);
      const { location, client_ip } = await fetchPresenceContext();
      const deviceData = getDeviceSignature();
      const response = await clockIn(location, client_ip, deviceData, isQrScan);
      if (response.success) {
        toast.success(response.data.message || "Successfully clocked in");
        await updateStatus(response.data.data);
        router.refresh();
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
      const { location, client_ip } = await fetchPresenceContext();
      const response = await clockOut(location, client_ip);
      if (response.success) {
        toast.success("Successfully clocked out");
        await updateStatus(response.data.data);
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
        toast.error(response.error?.error || "Failed to clock out");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleBreakAction = async (action: "start" | "end") => {
    try {
      setLoading(true);
      const { location, client_ip } = await fetchPresenceContext();
      const response = action === "start"
        ? await startBreak(location, client_ip)
        : await endBreak(location, client_ip);

      if (response.success) {
        toast.success(
          response.data.message ||
            (action === "start" ? "Break started" : "Welcome back! Break ended")
        );
        await updateStatus(response.data.data);
        router.refresh();
      } else {
        toast.error(response.error?.error || `Failed to ${action} break`);
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong while updating break status");
    } finally {
      setLoading(false);
    }
  };

  if (isPending) return null;
  if (isError && !status) {
    return (
      <Button variant="outline" size="sm" onClick={() => refetch()}>
        Retry attendance status
      </Button>
    );
  }

  const remainingBreakMinutes = Math.max(0, 60 - completedBreakMinutes);

  return (
    <div id="tour-clock-widget" className="flex items-center gap-1.5 sm:gap-3">
      {isClockedIn ? (
        isOnBreak ? (
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Badge
              variant="outline"
              title="Cumulative break time today"
              className={`h-8 gap-1.5 px-2 sm:px-2.5 font-mono text-xs tabular-nums ${
                isBreakOverLimit
                  ? "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
                  : "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
              }`}
            >
              <span
                className={`size-2 rounded-full animate-pulse ${
                  isBreakOverLimit ? "bg-rose-500" : "bg-amber-500"
                }`}
              />
              <Coffee className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden md:inline">On Break &bull;</span>
              <span>{formatBreakElapsed(liveBreakSeconds)}</span>
            </Badge>

            {mode === "qrcode" ? (
              <Button
                asChild
                size="sm"
                className="h-8 gap-1.5 px-2.5 sm:px-3 bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <Link
                  href="/attendance/scan?action=end_break"
                  prefetch={false}
                  title="Scan the office QR code to return from break"
                >
                  <QrCode className="h-3.5 w-3.5" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    <span className="hidden sm:inline">Return from Break</span>
                    <span className="sm:hidden">Resume</span>
                  </span>
                </Link>
              </Button>
            ) : (
              <Button
                disabled={loading}
                onClick={() => handleBreakAction("end")}
                size="sm"
                className="h-8 gap-1.5 px-2.5 sm:px-3 bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <Play className="h-3.5 w-3.5" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  {loading ? (
                    "Resuming..."
                  ) : (
                    <>
                      <span className="hidden sm:inline">Return from Break</span>
                      <span className="sm:hidden">Resume</span>
                    </>
                  )}
                </span>
              </Button>
            )}
          </div>
        ) : (
          <>
            <Popover open={menuOpen} onOpenChange={setMenuOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="tour-clock-out-btn"
                  disabled={loading}
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 px-2.5 sm:px-3 border-emerald-500/40 bg-emerald-500/10 text-emerald-800 hover:bg-emerald-500/20 dark:text-emerald-300"
                >
                  <span className="size-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {loading ? "Updating..." : "Working"}
                  </span>
                  {completedBreakMinutes > 0 && (
                    <span className="hidden sm:inline text-[11px] font-medium opacity-75">
                      &bull; {completedBreakMinutes}m break
                    </span>
                  )}
                  <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64 gap-2 p-2.5">
                <div className="px-1.5 py-0.5">
                  <p className="text-xs font-semibold text-foreground">Active Shift</p>
                  <p className="text-[11px] text-muted-foreground">
                    {completedBreakMinutes > 60
                      ? `Daily 60m break exceeded (${completedBreakMinutes}m used)`
                      : `${remainingBreakMinutes}m of 60m break allowance left`}
                  </p>
                </div>

                {mode === "qrcode" ? (
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full h-auto px-2.5 py-2 justify-start gap-2.5 border-amber-300/80 bg-amber-50/70 text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
                  >
                    <Link
                      href="/attendance/scan?action=start_break"
                      prefetch={false}
                      onClick={() => setMenuOpen(false)}
                    >
                      <Coffee className="h-4 w-4 shrink-0" />
                      <div className="flex flex-col items-start text-left leading-tight">
                        <span className="text-xs font-semibold">Take a Break</span>
                        <span className="text-[10px] opacity-75">Keeps your shift open</span>
                      </div>
                    </Link>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={loading}
                    onClick={() => {
                      setMenuOpen(false);
                      void handleBreakAction("start");
                    }}
                    className="w-full h-auto px-2.5 py-2 justify-start gap-2.5 border-amber-300/80 bg-amber-50/70 text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
                  >
                    <Coffee className="h-4 w-4 shrink-0" />
                    <div className="flex flex-col items-start text-left leading-tight">
                      <span className="text-xs font-semibold">Take a Break</span>
                      <span className="text-[10px] opacity-75">Keeps your shift open</span>
                    </div>
                  </Button>
                )}

                <div className="border-t border-border" />

                {mode === "qrcode" ? (
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="w-full h-auto px-2.5 py-2 justify-start gap-2.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Link
                      href="/attendance/scan?action=clock_out"
                      prefetch={false}
                      onClick={() => setMenuOpen(false)}
                    >
                      <LogOut className="h-4 w-4 shrink-0" />
                      <div className="flex flex-col items-start text-left leading-tight">
                        <span className="text-xs font-semibold">End Shift (Clock Out)</span>
                        <span className="text-[10px] opacity-75">Final for today</span>
                      </div>
                    </Link>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={loading}
                    onClick={() => {
                      setMenuOpen(false);
                      setClockOutDialogOpen(true);
                    }}
                    className="w-full h-auto px-2.5 py-2 justify-start gap-2.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <LogOut className="h-4 w-4 shrink-0" />
                    <div className="flex flex-col items-start text-left leading-tight">
                      <span className="text-xs font-semibold">End Shift (Clock Out)</span>
                      <span className="text-[10px] opacity-75">Final for today</span>
                    </div>
                  </Button>
                )}
              </PopoverContent>
            </Popover>

            <AlertDialog open={clockOutDialogOpen} onOpenChange={setClockOutDialogOpen}>
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
                  disabled={loading}
                  onClick={() => {
                    setClockOutDialogOpen(false);
                    void handleBreakAction("start");
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
                    onClick={handleClockOut}
                  >
                    Yes, End Shift
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )
      ) : status?.clock_out_at ? (
        <Badge
          id="tour-clock-completed-badge"
          variant="outline"
          className="h-8 gap-1.5 px-2.5 sm:px-3 border-muted-foreground/20 text-muted-foreground font-medium"
        >
          <Clock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="text-[10px] uppercase tracking-widest">
            <span className="hidden sm:inline">Work Completed</span>
            <span className="sm:hidden">Done</span>
          </span>
        </Badge>
      ) : (
        <div className="flex items-center gap-1.5 sm:gap-2">
          {isButtonEnabled && (
            <Button
              id="tour-clock-in-btn"
              disabled={loading}
              onClick={() => handleClockIn(false)}
              variant="outline"
              size="sm"
              className="gap-1.5 h-8 px-2.5 sm:px-3 border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all"
            >
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                {loading ? (
                  "Clocking In..."
                ) : (
                  <>
                    <span className="hidden sm:inline">Clock In Now</span>
                    <span className="sm:hidden">Clock In</span>
                  </>
                )}
              </span>
            </Button>
          )}

          {isQrCodeEnabled && (
            <Button
              id="tour-clock-scan-btn"
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => setScannerOpen(true)}
              className="gap-1.5 h-8 px-2 sm:px-2.5 border-primary/30 hover:border-primary/60 hover:bg-primary/5 transition-all text-primary cursor-pointer"
              title="Scan the office QR code to clock in"
            >
              <QrCode className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider">
                <span className={mode === "qrcode" ? "" : "hidden sm:inline"}>
                  Clock In
                </span>
              </span>
            </Button>
          )}
          <LatePermissionRequestModal
            trigger={
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-1.5 sm:px-2 text-muted-foreground hover:text-foreground text-xs"
                title="Request permission to be late"
              >
                <Clock className="h-3.5 w-3.5 text-indigo-500" />
              </Button>
            }
          />
        </div>
      )}

      {/* In-Portal Camera Scanner Modal */}
      <CameraQrScanner
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        isSubmitting={loading}
        onScanSuccess={async () => {
          toast.success("Office QR Code verified! Clocking you in...");
          await handleClockIn(true);
          setScannerOpen(false);
        }}
      />
    </div>
  );
}
