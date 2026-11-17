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
import { QrCode, Download, ShieldCheck, Loader2, Image as ImageIcon } from "lucide-react";
import { QRCodeImage } from "@/components/ui/qr-code-image";
import { toast } from "sonner";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function WallQrPosterDialog({
  trigger,
}: {
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [scanUrl, setScanUrl] = useState("");
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isDownloadingImage, setIsDownloadingImage] = useState(false);
  const posterRef = useRef<HTMLDivElement>(null);
  const pureQrRef = useRef<HTMLDivElement>(null);
  const qrImageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setScanUrl(`${window.location.origin}/attendance/scan`);
    }
  }, []);

  const handleDownloadQrImage = async () => {
    if (!scanUrl) return;
    setIsDownloadingImage(true);
    try {
      // 1. Attempt high-resolution fetch (1200x1200px) from primary QR generator
      const highResUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1200x1200&margin=24&data=${encodeURIComponent(scanUrl)}`;
      const fallbackUrl = `https://quickchart.io/qr?text=${encodeURIComponent(scanUrl)}&size=1200&margin=4`;

      let blob: Blob | null = null;
      try {
        const res = await fetch(highResUrl);
        if (res.ok) {
          blob = await res.blob();
        }
      } catch (err) {
        console.warn("Primary QR download fetch failed, attempting fallback:", err);
      }

      if (!blob) {
        try {
          const res = await fetch(fallbackUrl);
          if (res.ok) {
            blob = await res.blob();
          }
        } catch (err) {
          console.warn("Secondary QR download fetch failed:", err);
        }
      }

      if (blob) {
        downloadBlob(blob, "Aspom_Attendance_QR.png");
        toast.success("QR code image exported successfully");
        return;
      }

      // 2. Fallback: Draw the rendered <img> directly onto an offscreen canvas
      const imgEl = qrImageRef.current;
      if (imgEl && imgEl.complete && imgEl.naturalWidth > 0) {
        const canvas = document.createElement("canvas");
        const size = Math.max(imgEl.naturalWidth * 2, 1000);
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.imageSmoothingEnabled = false;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(imgEl, 0, 0, canvas.width, canvas.height);

          await new Promise<void>((resolve, reject) => {
            canvas.toBlob((b) => {
              if (b) {
                downloadBlob(b, "Aspom_Attendance_QR.png");
                toast.success("QR code image exported successfully");
                resolve();
              } else {
                reject(new Error("Canvas toBlob failed"));
              }
            }, "image/png");
          });
          return;
        }
      }

      // 3. Fallback: html-to-image on the pure QR container
      if (pureQrRef.current) {
        const { toPng } = await import("html-to-image");
        const dataUrl = await toPng(pureQrRef.current, {
          pixelRatio: 4,
          backgroundColor: "#ffffff",
        });
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = "Aspom_Attendance_QR.png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success("QR code image exported successfully");
        return;
      }

      throw new Error("Unable to capture QR code image");
    } catch (err) {
      console.error("QR code export failed:", err);
      toast.error("Failed to export QR code image. Please check your connection.");
    } finally {
      setIsDownloadingImage(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!posterRef.current) return;
    setIsDownloadingPdf(true);
    try {
      const { toPng } = await import("html-to-image");
      const { jsPDF } = await import("jspdf");

      // Render at 2× scale for crisp output, excluding non-print helper controls
      const dataUrl = await toPng(posterRef.current, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        filter: (node) => {
          if (
            node instanceof HTMLElement &&
            (node.dataset.noPrint === "true" || node.classList.contains("no-poster-print"))
          ) {
            return false;
          }
          return true;
        },
      });

      const img = new Image();
      img.src = dataUrl;
      await new Promise((res) => (img.onload = res));

      const pxW = img.naturalWidth;
      const pxH = img.naturalHeight;

      // A4 in mm, 10 mm padding each side
      const pageW = 210;
      const pageH = 297;
      const maxW = pageW - 20;
      const maxH = pageH - 20;
      const ratio = Math.min(maxW / pxW, maxH / pxH);
      const imgW = pxW * ratio;
      const imgH = pxH * ratio;
      const offsetX = (pageW - imgW) / 2;
      const offsetY = (pageH - imgH) / 2;

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      pdf.addImage(dataUrl, "PNG", offsetX, offsetY, imgW, imgH);
      pdf.save("Aspom_Attendance_QR_Poster.pdf");
      toast.success("Wall poster PDF generated successfully");
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Failed to generate PDF poster.");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2 cursor-pointer">
            <QrCode className="h-4 w-4 text-primary" />
            <span>QR Code &amp; Poster</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl lg:min-w-4xl max-h-[90vh] overflow-y-auto p-0 border-border">
        <DialogHeader className="p-6 pb-3 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <QrCode className="h-5 w-5 text-primary" />
                Office Attendance QR &amp; Poster
              </DialogTitle>
              <DialogDescription className="text-xs mt-1">
                Export just the raw QR code as an image (no text or branding), or download the full A4 wall poster as a PDF.
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadQrImage}
                disabled={isDownloadingImage || !scanUrl}
                className="gap-2 cursor-pointer shadow-xs"
                title="Export only the QR code as a PNG image"
              >
                {isDownloadingImage ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ImageIcon className="h-4 w-4 text-primary" />
                )}
                <span>{isDownloadingImage ? "Exporting…" : "Export QR Image"}</span>
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf || !scanUrl}
                className="gap-2 shadow-xs cursor-pointer"
                title="Download complete A4 wall poster as PDF"
              >
                {isDownloadingPdf ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span>{isDownloadingPdf ? "Generating…" : "Download Poster (PDF)"}</span>
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Poster preview */}
        <div className="p-6 bg-slate-100 dark:bg-slate-900/50 flex justify-center">
          <div
            ref={posterRef}
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
              SCAN TO CLOCK IN / OUT
            </h3>
            <p className="text-xs text-slate-600 font-medium mb-5">
              One QR code for arrival <strong>&amp;</strong> departure — the system detects your state automatically.
            </p>

            {/* High Res QR Code Frame */}
            <div className="flex flex-col items-center gap-2 mb-5">
              <div className="p-3 bg-slate-50 border-2 border-dashed border-primary/30 rounded-2xl shadow-inner inline-block">
                <div ref={pureQrRef} className="bg-white p-2 rounded-lg">
                  {scanUrl ? (
                    <QRCodeImage
                      imgRef={qrImageRef}
                      value={scanUrl}
                      size={240}
                      className="mx-auto !p-0 shadow-none rounded-none"
                      alt="Aspom Attendance Scan QR"
                    />
                  ) : (
                    <div className="w-60 h-60 flex items-center justify-center text-xs text-slate-400">
                      Generating...
                    </div>
                  )}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                data-no-print="true"
                onClick={handleDownloadQrImage}
                disabled={isDownloadingImage || !scanUrl}
                className="no-poster-print text-xs text-slate-600 hover:text-slate-900 gap-1.5 h-7 px-2.5 cursor-pointer font-medium"
                title="Download just this QR code as a PNG image (no text, no instructions)"
              >
                {isDownloadingImage ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                ) : (
                  <ImageIcon className="h-3.5 w-3.5 text-primary" />
                )}
                <span>Export QR code only (PNG)</span>
              </Button>
            </div>

            {/* How to scan */}
            <div className="w-full bg-slate-50 rounded-xl p-4 border border-slate-100 text-left space-y-2 mb-4 text-xs text-slate-700">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">How to scan</p>
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
                  Confirm the action on screen — clock-in or clock-out is detected automatically.
                </p>
              </div>
            </div>

            {/* Clock-in / Clock-out guide */}
            <div className="w-full grid grid-cols-2 gap-2 mb-4 text-xs">
              {/* Clock In */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-left space-y-1">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">▶</div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wide text-emerald-800">Arriving</span>
                </div>
                <p className="text-[11px] text-emerald-700 font-medium leading-snug">
                  Scan on arrival. The system clocks you <strong>in</strong> instantly.
                </p>
              </div>
              {/* Clock Out */}
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-left space-y-1">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="h-5 w-5 rounded-full bg-rose-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">■</div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wide text-rose-800">Leaving</span>
                </div>
                <p className="text-[11px] text-rose-700 font-medium leading-snug">
                  Scan again at end of day to clock <strong>out</strong> and log your hours.
                </p>
              </div>
            </div>

            {/* Security Notice */}
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              <span>Office Geofence &amp; Device Signature Verification Enforced</span>
            </div>

            <p className="text-[10px] text-slate-400 mt-3 font-mono">
              {scanUrl || "https://portal.aspomportal.com/attendance/scan"}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
