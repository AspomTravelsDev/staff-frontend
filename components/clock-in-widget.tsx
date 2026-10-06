"use client";

import { useState } from "react";
import { Clock, LogOut, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  clockIn,
  clockOut,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getDeviceSignature } from "@/lib/utils/device-fingerprint";
import { useClockInMode } from "@/hooks/use-clock-in-mode";
import { CameraQrScanner } from "@/components/attendance/camera-qr-scanner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTodayAttendance } from "@/hooks/use-today-attendance";

export function ClockInWidget() {
  const router = useRouter();
  const { isButtonEnabled, isQrCodeEnabled, mode } = useClockInMode();
  const [loading, setLoading] = useState(false);
  const { status, updateStatus, isPending, isError, refetch } = useTodayAttendance();
  const [scannerOpen, setScannerOpen] = useState(false);

  const handleClockIn = async (isQrScan: boolean = false) => {
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
        await updateStatus(response.data.data);
        router.refresh();
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

  if (isPending) return null;
  if (isError && !status) {
    return <Button variant="outline" size="sm" onClick={() => refetch()}>Retry attendance status</Button>;
  }

  const isClockedIn = status && !status.clock_out_at;

  return (
    <div id="tour-clock-widget" className="flex items-center gap-1.5 sm:gap-3">
      {isClockedIn ? (
        mode === "qrcode" ? (
          <Button
            asChild
            variant="outline"
            size="sm"
            className="gap-1.5 h-8 px-2.5 sm:px-3 border-primary/30 text-primary hover:bg-primary/5"
          >
            <Link href="/attendance/scan?action=clock_out" title="Scan the office QR code to clock out">
              <QrCode className="h-3.5 w-3.5" />
              <span className="text-xs font-bold uppercase tracking-wider">Clock Out</span>
            </Link>
          </Button>
        ) : (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                id="tour-clock-out-btn"
                disabled={loading}
                variant="destructive"
                size="sm"
                className="gap-1.5 h-8 px-2.5 sm:px-3"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  {loading ? (
                    "Clocking Out..."
                  ) : (
                    <>
                      <span className="hidden sm:inline">Clock Out</span>
                      <span className="sm:hidden">Out</span>
                    </>
                  )}
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
