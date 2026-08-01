"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Copy, RefreshCw, ZoomIn, Move, Plus, Minus } from "lucide-react";
import { Label } from "@/components/ui/label";

interface StaffProfileCanvasProps {
  name: string;
  role: string;
  phone: string;
  imageUrl: string | null;
}

export function StaffProfileCanvas({
  name,
  role,
  phone,
  imageUrl,
}: StaffProfileCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [copied, setCopied] = useState(false);
  const [rendering, setRendering] = useState(false);

  // Re-draw canvas whenever inputs change
  useEffect(() => {
    let isMounted = true;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setRendering(true);

    const CANVAS_SIZE = 1080;
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;

    // Load ASPOM Logo
    const logoImg = new Image();
    logoImg.crossOrigin = "anonymous";
    logoImg.src = "/aspom-logo.png";

    // Load Staff Photo
    const photoImg = new Image();
    photoImg.crossOrigin = "anonymous";
    if (imageUrl) {
      photoImg.src = imageUrl;
    }

    const drawCanvas = () => {
      if (!isMounted) return;

      // 1. Clear background
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      // 2. Base Fill (White)
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      // 3. Top Half Background (Soft Grayish-Blue with Watermark)
      const topHeight = 490;
      ctx.fillStyle = "#EEF3F8";
      ctx.fillRect(36, 36, CANVAS_SIZE - 72, topHeight - 36);

      // 3b. Subtle Globe/Watermark Pattern
      ctx.save();
      ctx.strokeStyle = "rgba(11, 58, 148, 0.08)";
      ctx.lineWidth = 4;
      // Draw concentric globe/passport watermark lines
      ctx.beginPath();
      ctx.arc(200, 240, 140, 0, Math.PI * 2);
      ctx.arc(200, 240, 100, 0, Math.PI * 2);
      ctx.moveTo(60, 240); ctx.lineTo(340, 240);
      ctx.moveTo(200, 100); ctx.lineTo(200, 380);
      ctx.stroke();
      ctx.restore();

      // 4. ASPOM Logo (Top Right)
      if (logoImg.complete && logoImg.naturalWidth > 0) {
        const logoWidth = 240;
        const logoHeight = (logoImg.naturalHeight / logoImg.naturalWidth) * logoWidth;
        ctx.drawImage(logoImg, CANVAS_SIZE - logoWidth - 65, 65, logoWidth, logoHeight);
      }

      // 5. Staff Photo with Circular Crop & Royal Blue Ring
      const avatarCenterX = CANVAS_SIZE / 2;
      const avatarCenterY = 390;
      const avatarRadius = 225;

      // Draw Photo inside Circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarCenterX, avatarCenterY, avatarRadius, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();

      if (photoImg.complete && photoImg.naturalWidth > 0) {
        const imgAspect = photoImg.naturalWidth / photoImg.naturalHeight;
        let drawW = avatarRadius * 2 * zoom;
        let drawH = (avatarRadius * 2 / imgAspect) * zoom;

        if (drawH < avatarRadius * 2 * zoom) {
          drawH = avatarRadius * 2 * zoom;
          drawW = drawH * imgAspect;
        }

        const drawX = avatarCenterX - drawW / 2 + offsetX;
        const drawY = avatarCenterY - drawH / 2 + offsetY;

        ctx.drawImage(photoImg, drawX, drawY, drawW, drawH);
      } else {
        // Fallback Avatar Background if photo not loaded
        ctx.fillStyle = "#E2E8F0";
        ctx.fillRect(avatarCenterX - avatarRadius, avatarCenterY - avatarRadius, avatarRadius * 2, avatarRadius * 2);
        ctx.fillStyle = "#64748B";
        ctx.font = "bold 80px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(name.trim() ? name.trim()[0].toUpperCase() : "A", avatarCenterX, avatarCenterY);
      }
      ctx.restore();

      // Draw Outer Royal Blue Circular Border Ring
      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarCenterX, avatarCenterY, avatarRadius + 12, 0, Math.PI * 2);
      ctx.strokeStyle = "#0B3A94";
      ctx.lineWidth = 24;
      ctx.stroke();
      ctx.restore();

      // 6. Outer Border Frame (Royal Blue Top/Left/Right, Slate Blue Bottom)
      const borderThickness = 36;
      ctx.fillStyle = "#0B3A94"; // Royal Blue
      // Top Border
      ctx.fillRect(0, 0, CANVAS_SIZE, borderThickness);
      // Left Border
      ctx.fillRect(0, 0, borderThickness, CANVAS_SIZE - borderThickness);
      // Right Border
      ctx.fillRect(CANVAS_SIZE - borderThickness, 0, borderThickness, CANVAS_SIZE - borderThickness);
      // Bottom Accent Border
      ctx.fillStyle = "#CBD5E1"; // Slate Blue Accent
      ctx.fillRect(0, CANVAS_SIZE - borderThickness, CANVAS_SIZE, borderThickness);

      // 7. Typography (Bottom Text Area - Reduced Line Height)
      ctx.fillStyle = "#0B3A94"; // Dark Royal Blue Text
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const displayName = name.trim();
      const displayRole = role.trim();
      const displayPhone = phone.trim();

      const line1Text = displayName ? `Hello! My name is ${displayName} , I am a` : "Hello! My name is [Name] , I am a";
      const line2Text = displayRole ? `${displayRole} at Aspom Travels.` : "[Role] at Aspom Travels.";
      const line3Text = "For any assistance, Whatsapp/Call me on";
      const line4Text = displayPhone ? displayPhone : "[Phone Number]";

      // Line 1: Hello! My name is {Name} , I am a
      ctx.font = "bold 32px 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
      ctx.fillText(line1Text, CANVAS_SIZE / 2, 720);

      // Line 2: {Role} at Aspom Travels.
      ctx.font = "bold 34px 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
      ctx.fillText(line2Text, CANVAS_SIZE / 2, 768);

      // Line 3: For any assistance, Whatsapp/Call me on
      ctx.font = "bold 32px 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
      ctx.fillText(line3Text, CANVAS_SIZE / 2, 816);

      // Line 4: {Phone}
      ctx.font = "bold 38px 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
      ctx.fillText(line4Text, CANVAS_SIZE / 2, 868);

      setRendering(false);
    };

    let loadedCount = 0;
    const checkLoaded = () => {
      loadedCount++;
      if (loadedCount >= 2) {
        drawCanvas();
      }
    };

    logoImg.onload = checkLoaded;
    logoImg.onerror = checkLoaded;
    photoImg.onload = checkLoaded;
    photoImg.onerror = checkLoaded;

    // Trigger initial draw in case images cached
    drawCanvas();

    return () => {
      isMounted = false;
    };
  }, [name, role, phone, imageUrl, zoom, offsetX, offsetY]);

  const handleDownload = (format: "png" | "jpeg") => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    const filename = `${(name || "staff").toLowerCase().replace(/\s+/g, "_")}_profile.${format}`;
    link.download = filename;
    link.href = canvas.toDataURL(`image/${format}`, 0.95);
    link.click();
  };

  const handleCopy = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob })
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    } catch (err) {
      console.error("Failed to copy image to clipboard", err);
    }
  };

  const handleResetAdjustments = () => {
    setZoom(1);
    setOffsetX(0);
    setOffsetY(0);
  };

  return (
    <div className="flex flex-col items-center space-y-6 w-full max-w-xl mx-auto">
      {/* Canvas Display */}
      <div className="relative rounded-2xl overflow-hidden shadow-2xl border bg-background p-2 group w-full aspect-square max-w-[500px]">
        <canvas
          ref={canvasRef}
          className="w-full h-full object-contain rounded-xl"
        />
        {rendering && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-xs flex items-center justify-center">
            <RefreshCw className="h-8 w-8 text-primary animate-spin" />
          </div>
        )}
      </div>

      {/* Photo Controls: + and - Buttons */}
      <div className="w-full space-y-4 bg-muted/40 p-4 rounded-xl border">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Move className="h-3.5 w-3.5" /> Adjust Photo Position & Scale
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetAdjustments}
            className="h-7 text-xs gap-1 text-muted-foreground"
          >
            <RefreshCw className="h-3 w-3" /> Reset
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Zoom Controls */}
          <div className="space-y-1.5 flex flex-col items-center">
            <Label className="text-xs flex items-center gap-1">
              <ZoomIn className="h-3 w-3" /> Zoom
            </Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.1).toFixed(2))))}
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs font-bold w-12 text-center">{zoom.toFixed(1)}x</span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setZoom((z) => Math.min(3.0, Number((z + 0.1).toFixed(2))))}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Pan X Controls */}
          <div className="space-y-1.5 flex flex-col items-center">
            <Label className="text-xs">Pan Horizontal (X)</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setOffsetX((x) => x - 10)}
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs font-bold w-12 text-center">{offsetX > 0 ? `+${offsetX}` : offsetX}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setOffsetX((x) => x + 10)}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Pan Y Controls */}
          <div className="space-y-1.5 flex flex-col items-center">
            <Label className="text-xs">Pan Vertical (Y)</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setOffsetY((y) => y - 10)}
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs font-bold w-12 text-center">{offsetY > 0 ? `+${offsetY}` : offsetY}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setOffsetY((y) => y + 10)}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Export / Download Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 w-full">
        <Button
          onClick={() => handleDownload("png")}
          className="flex-1 min-w-[140px] bg-[#0B3A94] hover:bg-[#082b70] text-white font-bold gap-2"
        >
          <Download className="h-4 w-4" /> Download PNG
        </Button>
        <Button
          onClick={() => handleDownload("jpeg")}
          variant="outline"
          className="flex-1 min-w-[140px] font-semibold gap-2 border-[#0B3A94] text-[#0B3A94] hover:bg-[#0B3A94]/10"
        >
          <Download className="h-4 w-4" /> Download JPEG
        </Button>
        <Button
          onClick={handleCopy}
          variant="secondary"
          className="min-w-[120px] font-semibold gap-2"
        >
          <Copy className="h-4 w-4" /> {copied ? "Copied!" : "Copy Image"}
        </Button>
      </div>
    </div>
  );
}
