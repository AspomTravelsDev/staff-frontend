"use client";

import { useEffect, useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrCode, Printer, Download, Sparkles, Building2, ShieldCheck, CheckCircle2 } from "lucide-react";
import { QRCodeImage } from "@/components/ui/qr-code-image";

export function WallQrPosterDialog({
  trigger,
}: {
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [scanUrl, setScanUrl] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setScanUrl(`${window.location.origin}/attendance/scan`);
    }
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2 cursor-pointer">
            <QrCode className="h-4 w-4 text-primary" />
            <span>Wall QR Poster</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 border-border">
        <DialogHeader className="p-6 pb-2 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <QrCode className="h-5 w-5 text-primary" />
                Office Wall QR Poster
              </DialogTitle>
              <DialogDescription className="text-xs mt-1">
                Print and mount this poster at the office reception or entrance for staff clock-in.
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={handlePrint}
                className="gap-2 shadow-xs cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>Print Poster</span>
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Printable Poster Container */}
        <div className="p-6 bg-slate-100 dark:bg-slate-900/50 flex justify-center">
          <div
            ref={printRef}
            id="printable-attendance-poster"
            className="w-full max-w-md bg-white text-slate-900 rounded-2xl shadow-xl p-8 border border-slate-200 text-center flex flex-col items-center"
          >
            {/* Poster Header */}
            <div className="flex items-center gap-2.5 mb-2">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-base shadow-sm">
                AT
              </div>
              <div className="text-left">
                <h2 className="text-base font-extrabold tracking-tight text-slate-900 uppercase">
                  Aspom Travels
                </h2>
                <p className="text-[11px] font-semibold text-primary uppercase tracking-widest">
                  Staff Attendance
                </p>
              </div>
            </div>

            <div className="w-16 h-1 bg-primary rounded-full my-3" />

            <h3 className="text-xl font-black tracking-tight text-slate-900 mb-1">
              SCAN TO CLOCK IN
            </h3>
            <p className="text-xs text-slate-600 font-medium mb-6">
              Please scan this QR code on arrival to record your attendance.
            </p>

            {/* High Res QR Code Frame */}
            <div className="p-3 bg-slate-50 border-2 border-dashed border-primary/30 rounded-2xl shadow-inner mb-6">
              {scanUrl ? (
                <QRCodeImage
                  value={scanUrl}
                  size={240}
                  className="mx-auto"
                  alt="Aspom Attendance Scan QR"
                />
              ) : (
                <div className="w-60 h-60 flex items-center justify-center text-xs text-slate-400">
                  Generating...
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="w-full bg-slate-50 rounded-xl p-4 border border-slate-100 text-left space-y-2 mb-6 text-xs text-slate-700">
              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[11px]">
                  1
                </span>
                <p className="leading-tight font-medium">
                  Open the <strong>Camera</strong> app on your smartphone.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[11px]">
                  2
                </span>
                <p className="leading-tight font-medium">
                  Point at the QR code and tap the link that appears.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[11px]">
                  3
                </span>
                <p className="leading-tight font-medium">
                  Tap <strong>Confirm Clock In</strong> to record your arrival.
                </p>
              </div>
            </div>

            {/* Security Notice */}
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              <span>Office Geofence & Device Signature Verification Enforced</span>
            </div>

            <p className="text-[10px] text-slate-400 mt-4 font-mono">
              {scanUrl || "https://portal.aspomportal.com/attendance/scan"}
            </p>
          </div>
        </div>

        {/* Global Print Styles specifically for the poster */}
        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-attendance-poster,
            #printable-attendance-poster * {
              visibility: visible;
            }
            #printable-attendance-poster {
              position: fixed;
              left: 50%;
              top: 50%;
              transform: translate(-50%, -50%);
              width: 90% !important;
              max-width: 500px !important;
              box-shadow: none !important;
              border: 2px solid #000 !important;
            }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
