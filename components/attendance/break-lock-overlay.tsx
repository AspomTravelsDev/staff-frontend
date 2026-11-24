"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Coffee, Loader2, LogOut, Play, QrCode, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { logoutAction } from "@/app/(admin)/actions";
import { CameraQrScanner } from "@/components/attendance/camera-qr-scanner";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useClockInMode } from "@/hooks/use-clock-in-mode";
import { useTodayAttendance } from "@/hooks/use-today-attendance";
import { clockOut, endBreak, type LocationData } from "@/lib/api/clock-in";
import { formatLagosTime } from "@/lib/utils/attendance";
import { getGPSLocation, getPublicIP } from "@/lib/utils/location";

function formatBreakElapsed(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
  }
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

export function BreakLockOverlay() {
  const pathname = usePathname();
  const router = useRouter();
  const { mode } = useClockInMode();
  const { status, updateStatus, refetch, isFetching } = useTodayAttendance();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [unclosedConfirmOpen, setUnclosedConfirmOpen] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const scanIntentRef = useRef<"end_break" | "clock_out">("end_break");

  const isLocked = Boolean(
    status &&
      !status.clock_out_at &&
      status.is_on_break &&
      pathname !== "/attendance/scan"
  );

  useEffect(() => {
    if (!isLocked) return;
    setNowMs(Date.now());
    const interval = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isLocked]);

  const completedBreakMinutes = status?.completed_break_minutes ?? 0;
  const activeBreakSeconds =
    isLocked && status?.active_break?.started_at
      ? Math.max(0, Math.floor((nowMs - new Date(status.active_break.started_at).getTime()) / 1000))
      : 0;
  const liveBreakSeconds = completedBreakMinutes * 60 + activeBreakSeconds;
  const liveBreakMinutes = Math.floor(liveBreakSeconds / 60);
  const isBreakOverLimit = Boolean(status?.is_break_over_limit) || liveBreakMinutes > 60;

  useEffect(() => {
    if (!isLocked || !status?.id || liveBreakMinutes <= 60) return;

    const alertKey = `break-over-limit-alerted-${status.id}`;
    try {
      if (sessionStorage.getItem(alertKey)) return;
      sessionStorage.setItem(alertKey, "1");
    } catch {
      /* ignore */
    }

    toast.warning("You have passed your 60-minute daily break allowance.", {
      description: "Return from break to unlock the portal.",
      duration: 8000,
    });
  }, [isLocked, status?.id, liveBreakMinutes]);

  if (!isLocked || !status) {
    return null;
  }

  const resolvePresence = async (requireGps: boolean): Promise<{
    location?: LocationData;
    client_ip?: string;
  } | null> => {
    let location: LocationData | undefined;
    try {
      location = await getGPSLocation();
    } catch {
      if (requireGps) {
        toast.error("Location access is required with the office QR code. Please allow location and try again.");
        return null;
      }
    }

    const client_ip = await getPublicIP().catch(() => undefined);
    return { location, client_ip };
  };

  const handleReturnFromBreak = async (isQrScan: boolean) => {
    try {
      setIsSubmitting(true);
      const presence = await resolvePresence(isQrScan);
      if (!presence) return;

      const response = await endBreak(presence.location, presence.client_ip, isQrScan || undefined);
      if (response.success) {
        await updateStatus(response.data.data);
        toast.success(response.data.message || "Welcome back! Break ended.");
        router.refresh();
      } else {
        toast.error(response.error?.error || "Unable to end break.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong while returning from break.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnclosedClockOut = async (isQrScan: boolean) => {
    try {
      setIsSubmitting(true);
      const presence = await resolvePresence(isQrScan);
      if (!presence) return;

      const response = await clockOut(presence.location, presence.client_ip, isQrScan || undefined);
      if (response.success) {
        await updateStatus(response.data.data);
        toast.success("Successfully clocked out.");
        if (response.data.data.has_unclosed_break) {
          toast.warning("Your open break was left unclosed and flagged for HR review.");
        }
        router.refresh();
      } else {
        toast.error(response.error?.error || "Unable to clock out.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong while clocking out.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualRefresh = async () => {
    try {
      setIsRefreshing(true);
      const result = await refetch();
      if (result.isError) {
        toast.error("Could not refresh attendance status. Please try again.");
      } else if (result.data && !result.data.is_on_break) {
        toast.success("Welcome back! Portal unlocked.");
        router.refresh();
      } else {
        toast.info("Still on break. Scan or return from break to continue.");
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await logoutAction();
  };

  const progressPct = Math.min(100, Math.round((liveBreakMinutes / 60) * 100));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="break-lock-heading"
      className="fixed inset-0 z-[45] flex items-center justify-center bg-background bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.08),transparent_55%)] p-4"
    >
      <Card className="w-full max-w-md border-amber-500/35 shadow-xl">
        <CardHeader className="space-y-2.5 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300">
            <Coffee className="h-7 w-7" />
          </div>

          <div className="flex justify-center">
            <Badge
              variant="outline"
              className={`gap-1.5 px-2.5 py-0.5 font-mono text-xs tabular-nums ${
                isBreakOverLimit
                  ? "border-rose-300 bg-rose-500/10 text-rose-700 dark:border-rose-800 dark:text-rose-300"
                  : "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
              }`}
            >
              <span
                className={`size-2 rounded-full animate-pulse ${
                  isBreakOverLimit ? "bg-rose-500" : "bg-amber-500"
                }`}
              />
              On Break &bull; {formatBreakElapsed(liveBreakSeconds)}
            </Badge>
          </div>

          <CardTitle id="break-lock-heading" className="text-xl font-bold tracking-tight">
            You&apos;re Currently on Break
          </CardTitle>
          <CardDescription className="text-xs leading-relaxed">
            Portal access is paused while you&apos;re on break
            {status.active_break?.started_at
              ? ` (started at ${formatLagosTime(status.active_break.started_at)})`
              : ""}
            . Return from break to pick up right where you left off.
          </CardDescription>

          <div className="space-y-1 pt-1 text-left">
            <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
              <span>Daily break allowance</span>
              <span className={`font-mono tabular-nums ${isBreakOverLimit ? "text-rose-600 dark:text-rose-400 font-semibold" : ""}`}>
                {liveBreakMinutes}m / 60m
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isBreakOverLimit ? "bg-rose-500" : "bg-amber-500"
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {isBreakOverLimit && (
            <div className="rounded-md border border-rose-300 bg-rose-500/10 p-2 text-[11px] font-medium text-rose-700 dark:border-rose-800 dark:text-rose-300">
              You have passed your 60-minute daily break allowance. Return from break when you&apos;re back at work.
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-3">
          {mode === "qrcode" ? (
            <>
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  scanIntentRef.current = "end_break";
                  setScannerOpen(true);
                }}
                className="h-11 w-full gap-2 bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                {isSubmitting && scanIntentRef.current === "end_break" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Ending Break...</span>
                  </>
                ) : (
                  <>
                    <QrCode className="h-4 w-4" />
                    <span>Scan Office QR to Return from Break</span>
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting || isRefreshing || isFetching}
                onClick={() => void handleManualRefresh()}
                className="h-10 w-full gap-2 text-xs font-medium"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing || isFetching ? "animate-spin" : ""}`} />
                <span>I already scanned on my phone — Refresh</span>
              </Button>
            </>
          ) : (
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={() => void handleReturnFromBreak(false)}
              className="h-11 w-full gap-2 bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Returning from Break...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span>Return from Break</span>
                </>
              )}
            </Button>
          )}

          <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
            <button
              type="button"
              disabled={isSubmitting || isSigningOut}
              onClick={() => setUnclosedConfirmOpen(true)}
              className="text-[11px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline cursor-pointer text-left"
            >
              Forgot to end break and leaving for the day?
            </button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isSigningOut || isSubmitting}
              onClick={() => void handleSignOut()}
              className="shrink-0 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>{isSigningOut ? "Signing out..." : "Sign Out"}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={unclosedConfirmOpen} onOpenChange={setUnclosedConfirmOpen}>
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
                setUnclosedConfirmOpen(false);
                if (mode === "qrcode") {
                  scanIntentRef.current = "clock_out";
                  setScannerOpen(true);
                } else {
                  void handleUnclosedClockOut(false);
                }
              }}
            >
              {mode === "qrcode" ? "Continue to Clock Out QR" : "End Shift & Flag Break"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CameraQrScanner
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        isSubmitting={isSubmitting}
        onScanSuccess={async (scannedCode) => {
          let isOfficeQr = false;
          try {
            const scannedUrl = new URL(scannedCode);
            isOfficeQr =
              scannedUrl.origin === window.location.origin &&
              scannedUrl.pathname === "/attendance/scan";
          } catch {
            isOfficeQr = false;
          }

          if (!isOfficeQr) {
            toast.error("That isn’t the office attendance QR code. Scan the code on the office poster.");
            setScannerOpen(false);
            scanIntentRef.current = "end_break";
            return;
          }

          const intent = scanIntentRef.current;
          scanIntentRef.current = "end_break";
          setScannerOpen(false);

          if (intent === "clock_out") {
            toast.success("Office QR code confirmed. Recording clock out...");
            await handleUnclosedClockOut(true);
          } else {
            toast.success("Office QR code confirmed. Ending your break...");
            await handleReturnFromBreak(true);
          }
        }}
      />
    </div>
  );
}
