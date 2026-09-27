"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Camera,
  RotateCcw,
  Zap,
  ZapOff,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Script from "next/script";

interface CameraQrScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScanSuccess: (code: string) => void;
  isSubmitting?: boolean;
}

function playSuccessBeep() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(784, ctx.currentTime); // G5
    osc.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.08); // C6
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch {
    // Audio might be blocked by browser policy until gesture
  }
}

export function CameraQrScanner({
  open,
  onOpenChange,
  onScanSuccess,
  isSubmitting = false,
}: CameraQrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [jsQrLoaded, setJsQrLoaded] = useState(false);
  const [detectedCode, setDetectedCode] = useState<string | null>(null);

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setTorchOn(false);
  }, []);

  // Start camera stream
  const startCamera = useCallback(async () => {
    stopCamera();
    setErrorMessage(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setHasPermission(false);
      setErrorMessage("Camera access is not supported by your browser or connection.");
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setHasPermission(true);

      // Check if torch/flashlight is available
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities ? (track.getCapabilities() as any) : {};
      setHasTorch(Boolean(capabilities?.torch));
    } catch (err: any) {
      console.error("Camera access error:", err);
      setHasPermission(false);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setErrorMessage("Camera permission denied. Please allow camera access in your browser settings.");
      } else {
        setErrorMessage(err.message || "Failed to access camera.");
      }
    }
  }, [facingMode, stopCamera]);

  // Handle Torch toggle
  const toggleTorch = async () => {
    if (!streamRef.current || !hasTorch) return;
    const track = streamRef.current.getVideoTracks()[0];
    try {
      const nextState = !torchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: nextState }],
      });
      setTorchOn(nextState);
    } catch (e) {
      console.error("Failed to toggle torch:", e);
    }
  };

  // Flip between front/rear camera
  const flipCamera = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  // Scanning loop using BarcodeDetector or jsQR
  useEffect(() => {
    if (!open || !hasPermission || isSubmitting || detectedCode) return;

    let isScanning = true;
    let barcodeDetector: any = null;

    if (typeof window !== "undefined" && "BarcodeDetector" in window) {
      try {
        barcodeDetector = new (window as any).BarcodeDetector({
          formats: ["qr_code"],
        });
      } catch (e) {
        barcodeDetector = null;
      }
    }

    const scanFrame = async () => {
      if (!isScanning) return;

      const video = videoRef.current;
      if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
        let foundCode: string | null = null;

        // 1. Try native high-performance BarcodeDetector API
        if (barcodeDetector) {
          try {
            const barcodes = await barcodeDetector.detect(video);
            if (barcodes && barcodes.length > 0) {
              foundCode = barcodes[0].rawValue;
            }
          } catch (e) {
            // Ignore frame detection errors
          }
        }

        // 2. Fallback to jsQR canvas processing if BarcodeDetector not available
        if (!foundCode && (window as any).jsQR) {
          try {
            const canvas = canvasRef.current;
            if (canvas) {
              const ctx = canvas.getContext("2d", { willReadFrequently: true });
              if (ctx) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const code = (window as any).jsQR(imageData.data, imageData.width, imageData.height, {
                  inversionAttempts: "dontInvert",
                });
                if (code && code.data) {
                  foundCode = code.data;
                }
              }
            }
          } catch (e) {
            // Ignore canvas scanning errors
          }
        }

        // If a code was detected
        if (foundCode && !detectedCode) {
          isScanning = false;
          setDetectedCode(foundCode);
          playSuccessBeep();
          if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
          }
          stopCamera();
          onScanSuccess(foundCode);
          return;
        }
      }

      animationFrameRef.current = requestAnimationFrame(scanFrame);
    };

    animationFrameRef.current = requestAnimationFrame(scanFrame);

    return () => {
      isScanning = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [open, hasPermission, isSubmitting, detectedCode, jsQrLoaded, stopCamera, onScanSuccess]);

  // Open/close lifecycle
  useEffect(() => {
    if (open) {
      setDetectedCode(null);
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [open, startCamera, stopCamera]);

  return (
    <>
      {/* Load jsQR fallback from jsDelivr */}
      <Script
        src="https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js"
        strategy="lazyOnload"
        onLoad={() => setJsQrLoaded(true)}
      />

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-black text-white border-zinc-800">
          <DialogHeader className="p-4 bg-zinc-900/90 backdrop-blur-xs border-b border-zinc-800 flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="text-base font-bold flex items-center gap-2 text-white">
                <Camera className="h-4 w-4 text-primary" />
                Scan Office Wall QR
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-400">
                Point your camera at the attendance QR code on the wall.
              </DialogDescription>
            </div>
          </DialogHeader>

          {/* Hidden Canvas for jsQR Fallback */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Viewfinder Viewport */}
          <div className="relative w-full aspect-square bg-zinc-950 flex items-center justify-center overflow-hidden">
            {/* Live Video */}
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className={`w-full h-full object-cover ${
                facingMode === "user" ? "scale-x-[-1]" : ""
              }`}
            />

            {/* Viewfinder Overlay Reticle */}
            {hasPermission && !detectedCode && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-8">
                {/* Dark Mask Around Targeting Box */}
                <div className="relative w-64 h-64 border-2 border-white/60 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]">
                  {/* Glowing Corner Accents */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg" />

                  {/* Pulsating Scanning Laser Line */}
                  <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-bounce shadow-[0_0_8px_#3b82f6] opacity-80" />
                </div>

                <p className="mt-6 text-xs font-semibold text-white/90 bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-xs tracking-wide">
                  Align QR code inside the frame
                </p>
              </div>
            )}

            {/* Success Detected Feedback */}
            {detectedCode && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95">
                <div className="h-16 w-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
                  <CheckCircle2 className="h-10 w-10 animate-bounce" />
                </div>
                <h3 className="text-lg font-bold text-white">QR Code Detected!</h3>
                <p className="text-xs text-zinc-300 mt-1 max-w-xs">
                  {isSubmitting ? "Verifying location & clocking in..." : "Code recognized."}
                </p>
                {isSubmitting && <Loader2 className="h-5 w-5 animate-spin text-primary mt-4" />}
              </div>
            )}

            {/* Error or Permission Request State */}
            {hasPermission === false && (
              <div className="absolute inset-0 bg-zinc-950 p-6 flex flex-col items-center justify-center text-center">
                <AlertCircle className="h-12 w-12 text-rose-500 mb-3" />
                <h4 className="text-sm font-bold text-white">Camera Access Required</h4>
                <p className="text-xs text-zinc-400 mt-2 max-w-xs leading-relaxed">
                  {errorMessage || "Please allow camera access in your browser to scan the wall QR code."}
                </p>
                <Button
                  onClick={startCamera}
                  size="sm"
                  className="mt-4 gap-2"
                >
                  <Camera className="h-4 w-4" />
                  <span>Try Again</span>
                </Button>
              </div>
            )}

            {/* Initial Loading Spinner */}
            {hasPermission === null && (
              <div className="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center text-zinc-400 gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-xs">Initializing camera...</span>
              </div>
            )}
          </div>

          {/* Camera Controls Footer */}
          <div className="p-3 bg-zinc-900 flex items-center justify-between border-t border-zinc-800">
            <div className="flex items-center gap-2">
              {hasTorch && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={toggleTorch}
                  className="h-9 px-3 text-zinc-300 hover:text-white hover:bg-zinc-800 gap-1.5"
                >
                  {torchOn ? <ZapOff className="h-4 w-4 text-amber-400" /> : <Zap className="h-4 w-4" />}
                  <span className="text-xs">{torchOn ? "Torch Off" : "Torch"}</span>
                </Button>
              )}

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={flipCamera}
                className="h-9 px-3 text-zinc-300 hover:text-white hover:bg-zinc-800 gap-1.5"
              >
                <RotateCcw className="h-4 w-4" />
                <span className="text-xs">Flip</span>
              </Button>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-9 text-xs border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
