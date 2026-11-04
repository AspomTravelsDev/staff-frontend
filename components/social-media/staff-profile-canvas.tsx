"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Download,
  Copy,
  RefreshCw,
  ZoomIn,
  Move,
  Plus,
  Minus,
  Sliders,
  RotateCcw,
  Pipette,
  Layers,
  Wand2,
  Loader2,
  Check,
  LayoutGrid,
  Disc,
} from "lucide-react";
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
  const logoCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const keyedPhotoCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Design Mode Option State: "square" (Option 1) or "circle" (Option 2)
  const [designMode, setDesignMode] = useState<"square" | "circle">("square");

  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [copied, setCopied] = useState(false);
  const [rendering, setRendering] = useState(false);

  // Background Removal Tool State
  const [cloudProcessedUrl, setCloudProcessedUrl] = useState<string | null>(null);
  const [isCloudAiRemoving, setIsCloudAiRemoving] = useState(false);
  const [cloudAiSuccess, setCloudAiSuccess] = useState(false);
  const [cloudAiMsg, setCloudAiMsg] = useState<string | null>(null);

  const [removeBgMode, setRemoveBgMode] = useState<"none" | "white" | "gray" | "picked">("none");
  const [pickedColor, setPickedColor] = useState<{ r: number; g: number; b: number } | null>(null);
  const [threshold, setThreshold] = useState(20);
  const [isPickingColor, setIsPickingColor] = useState(false);

  const activePhotoSrc = cloudProcessedUrl || imageUrl;

  useEffect(() => {
    setCloudProcessedUrl(null);
    setCloudAiSuccess(false);
    setCloudAiMsg(null);
    setRemoveBgMode("none");
    setPickedColor(null);
    setIsPickingColor(false);
    keyedPhotoCanvasRef.current = null;
  }, [imageUrl]);

  // Cache Keyed ASPOM Logo ONCE for transparent rendering
  useEffect(() => {
    const logoImg = new Image();
    logoImg.src = "/aspom-logo.png";
    logoImg.onload = () => {
      const lCanvas = document.createElement("canvas");
      lCanvas.width = logoImg.naturalWidth;
      lCanvas.height = logoImg.naturalHeight;
      const lCtx = lCanvas.getContext("2d");
      if (lCtx) {
        lCtx.drawImage(logoImg, 0, 0);
        const imgData = lCtx.getImageData(0, 0, lCanvas.width, lCanvas.height);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          if (r > 235 && g > 235 && b > 235) {
            const avg = (r + g + b) / 3;
            if (avg > 250) {
              data[i + 3] = 0;
            } else {
              const alphaFactor = (250 - avg) / 15;
              data[i + 3] = Math.floor(data[i + 3] * alphaFactor);
            }
          }
        }
        lCtx.putImageData(imgData, 0, 0);
        logoCanvasRef.current = lCanvas;
      }
    };
  }, []);

  // Pre-process Background Keying per mode/threshold change
  useEffect(() => {
    if (removeBgMode === "none" || !activePhotoSrc) {
      keyedPhotoCanvasRef.current = null;
      return;
    }

    let isCancelled = false;
    const photoImg = new Image();
    if (activePhotoSrc.startsWith("http://") || activePhotoSrc.startsWith("https://")) {
      photoImg.crossOrigin = "anonymous";
    }
    photoImg.src = activePhotoSrc;

    photoImg.onload = () => {
      if (isCancelled) return;

      const maxDim = 1080;
      let w = photoImg.naturalWidth;
      let h = photoImg.naturalHeight;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }

      const pCanvas = document.createElement("canvas");
      pCanvas.width = w;
      pCanvas.height = h;
      const pCtx = pCanvas.getContext("2d");

      if (pCtx) {
        pCtx.drawImage(photoImg, 0, 0, w, h);
        const imgData = pCtx.getImageData(0, 0, w, h);
        const data = imgData.data;

        let targetR = 255;
        let targetG = 255;
        let targetB = 255;

        if (removeBgMode === "gray") {
          targetR = 195;
          targetG = 200;
          targetB = 205;
        } else if (removeBgMode === "picked" && pickedColor) {
          targetR = pickedColor.r;
          targetG = pickedColor.g;
          targetB = pickedColor.b;
        }

        const maxDiff = Math.round((threshold / 100) * 441);

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          const dist = Math.hypot(r - targetR, g - targetG, b - targetB);

          if (dist < maxDiff) {
            if (dist > maxDiff * 0.65) {
              const alphaRatio = (dist - maxDiff * 0.65) / (maxDiff * 0.35);
              data[i + 3] = Math.round(data[i + 3] * alphaRatio);
            } else {
              data[i + 3] = 0;
            }
          }
        }
        pCtx.putImageData(imgData, 0, 0);
        keyedPhotoCanvasRef.current = pCanvas;
      }
    };

    return () => {
      isCancelled = true;
    };
  }, [removeBgMode, activePhotoSrc, threshold, pickedColor]);

  // Main Canvas Render
  useEffect(() => {
    let isMounted = true;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setRendering(true);

    const CANVAS_SIZE = 1080;
    const CENTER = CANVAS_SIZE / 2;

    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;

    const photoImg = new Image();
    if (activePhotoSrc) {
      if (activePhotoSrc.startsWith("http://") || activePhotoSrc.startsWith("https://")) {
        photoImg.crossOrigin = "anonymous";
      }
      photoImg.src = activePhotoSrc;
    }

    const drawCanvas = () => {
      if (!isMounted) return;

      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      const photoSource = removeBgMode !== "none" && keyedPhotoCanvasRef.current
        ? keyedPhotoCanvasRef.current
        : (photoImg.complete && photoImg.naturalWidth > 0 ? photoImg : null);

      const displayName = name.trim();
      const displayRole = role.trim();
      const displayPhone = phone.trim();

      const startsWithVowelSound = (str: string) => {
        if (!str) return false;
        const lower = str.toLowerCase();
        return /^[aeiou]/i.test(lower) || /^hr\b/i.test(lower) || /^it\b/i.test(lower);
      };

      const article = displayRole
        ? (startsWithVowelSound(displayRole) ? "an" : "a")
        : "a/an";

      // ==========================================
      // OPTION 1: CLASSIC SQUARE CARD DESIGN
      // ==========================================
      if (designMode === "square") {
        // 1. Base White Fill
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        // 2. Top Half Background (Soft Grayish-Blue)
        const topHeight = 490;
        ctx.fillStyle = "#EEF3F8";
        ctx.fillRect(36, 36, CANVAS_SIZE - 72, topHeight - 36);

        // 3. Left-Side Vector Graphics (World Map Dot Matrix & Flying Airplane)
        const startX = 55;
        const startY = 55;
        const dotsCols = 14;
        const dotsRows = 14;
        const dotSpacing = 16;

        ctx.fillStyle = "rgba(11, 58, 148, 0.16)";
        for (let r = 0; r < dotsRows; r++) {
          for (let c = 0; c < dotsCols; c++) {
            const distFromCenter = Math.hypot(c - 7, r - 7);
            if (distFromCenter < 6.8 && (r + c) % 5 !== 0) {
              const x = startX + c * dotSpacing;
              const y = startY + r * dotSpacing;
              ctx.beginPath();
              ctx.arc(x, y, 2.2, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }

        // Airplane Trajectory Flight Trail (Dashed curve)
        ctx.save();
        ctx.beginPath();
        ctx.setLineDash([6, 8]);
        ctx.moveTo(70, 360);
        ctx.bezierCurveTo(110, 220, 160, 150, 240, 135);
        ctx.strokeStyle = "rgba(11, 58, 148, 0.35)";
        ctx.lineWidth = 3.5;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // Flying Airplane Vector Icon
        ctx.save();
        ctx.translate(245, 135);
        ctx.rotate(Math.PI * -0.22);
        ctx.fillStyle = "#0B3A94";
        ctx.beginPath();
        ctx.moveTo(0, -18);
        ctx.lineTo(6, -6); ctx.lineTo(24, 0); ctx.lineTo(24, 6);
        ctx.lineTo(6, 4); ctx.lineTo(4, 16); ctx.lineTo(10, 22);
        ctx.lineTo(10, 26); ctx.lineTo(0, 23); ctx.lineTo(-10, 26);
        ctx.lineTo(-10, 22); ctx.lineTo(-4, 16); ctx.lineTo(-6, 4);
        ctx.lineTo(-24, 6); ctx.lineTo(-24, 0); ctx.lineTo(-6, -6);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // 4. Bigger ASPOM Logo (Top Right)
        const logoWidth = 285;
        const logoX = CANVAS_SIZE - logoWidth - 55;
        const logoY = 60;

        if (logoCanvasRef.current) {
          const logoHeight = (logoCanvasRef.current.height / logoCanvasRef.current.width) * logoWidth;
          ctx.drawImage(logoCanvasRef.current, logoX, logoY, logoWidth, logoHeight);
        }

        // 5. Centered Circular Avatar
        const avatarCenterX = CANVAS_SIZE / 2;
        const avatarCenterY = 390;
        const avatarRadius = 225;

        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarCenterX, avatarCenterY, avatarRadius, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();

        if (photoSource) {
          const sourceWidth = "naturalWidth" in photoSource ? photoSource.naturalWidth : photoSource.width;
          const sourceHeight = "naturalHeight" in photoSource ? photoSource.naturalHeight : photoSource.height;
          const imgAspect = sourceWidth / sourceHeight;

          let drawW = avatarRadius * 2 * zoom;
          let drawH = (avatarRadius * 2 / imgAspect) * zoom;

          if (drawH < avatarRadius * 2 * zoom) {
            drawH = avatarRadius * 2 * zoom;
            drawW = drawH * imgAspect;
          }

          const drawX = avatarCenterX - drawW / 2 + offsetX;
          const drawY = avatarCenterY - drawH / 2 + offsetY;

          ctx.drawImage(photoSource, drawX, drawY, drawW, drawH);
        } else {
          ctx.fillStyle = "#E2E8F0";
          ctx.fillRect(avatarCenterX - avatarRadius, avatarCenterY - avatarRadius, avatarRadius * 2, avatarRadius * 2);
          ctx.fillStyle = "#64748B";
          ctx.font = "bold 80px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(displayName ? displayName[0].toUpperCase() : "A", avatarCenterX, avatarCenterY);
        }
        ctx.restore();

        // Avatar Outer Royal Blue Ring
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarCenterX, avatarCenterY, avatarRadius, 0, Math.PI * 2);
        ctx.strokeStyle = "#0B3A94";
        ctx.lineWidth = 14;
        ctx.stroke();
        ctx.restore();

        // 6. Outer Border Frame
        const borderThickness = 36;
        ctx.fillStyle = "#0B3A94";
        ctx.fillRect(0, 0, CANVAS_SIZE, borderThickness);
        ctx.fillRect(0, 0, borderThickness, topHeight);
        ctx.fillRect(CANVAS_SIZE - borderThickness, 0, borderThickness, topHeight);

        ctx.fillStyle = "#CBD5E1";
        ctx.fillRect(0, topHeight, borderThickness, CANVAS_SIZE - topHeight);
        ctx.fillRect(CANVAS_SIZE - borderThickness, topHeight, borderThickness, CANVAS_SIZE - topHeight);
        ctx.fillRect(0, CANVAS_SIZE - borderThickness, CANVAS_SIZE, borderThickness);

        // 7. Typography (Bottom Text Lines)
        ctx.fillStyle = "#0B3A94";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const line1Text = displayName
          ? `Hello! My name is ${displayName}, I am ${article}`
          : `Hello! My name is [Name], I am ${article}`;
        const line2Text = displayRole
          ? `${displayRole} at Aspom Travels.`
          : "[Role] at Aspom Travels.";
        const line3Text = "For any assistance, Whatsapp/Call me on";
        const line4Text = displayPhone ? displayPhone : "[Phone Number]";

        ctx.font = "bold 42px 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
        ctx.fillText(line1Text, CENTER, 700);

        ctx.font = "bold 42px 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
        ctx.fillText(line2Text, CENTER, 760);

        ctx.font = "bold 42px 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
        ctx.fillText(line3Text, CENTER, 822);

        ctx.font = "bold 40px 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
        ctx.fillText(line4Text, CENTER, 886);
      }

      // ==========================================
      // OPTION 2: MODERN FULL CIRCULAR BADGE GRAPHIC
      // ==========================================
      else {
        const RADIUS = 515;

        ctx.save();
        ctx.beginPath();
        ctx.arc(CENTER, CENTER, RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = "#F8FAFC";
        ctx.fill();
        ctx.clip();

        // Staff Photo
        ctx.save();
        if (photoSource) {
          const photoBaseWidth = 1080;
          const sourceWidth = "naturalWidth" in photoSource ? photoSource.naturalWidth : photoSource.width;
          const sourceHeight = "naturalHeight" in photoSource ? photoSource.naturalHeight : photoSource.height;
          const imgAspect = sourceWidth / sourceHeight;

          let drawW = photoBaseWidth * zoom;
          let drawH = (photoBaseWidth / imgAspect) * zoom;

          if (drawH < photoBaseWidth * zoom) {
            drawH = photoBaseWidth * zoom;
            drawW = drawH * imgAspect;
          }

          const photoCenterX = CENTER;
          const photoCenterY = 460;
          const drawX = photoCenterX - drawW / 2 + offsetX;
          const drawY = photoCenterY - drawH / 2 + offsetY;

          ctx.drawImage(photoSource, drawX, drawY, drawW, drawH);
        } else {
          ctx.fillStyle = "#E2E8F0";
          ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

          ctx.fillStyle = "#0B3A94";
          ctx.font = "bold 140px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(
            displayName ? displayName[0].toUpperCase() : "A",
            CENTER,
            430,
          );
        }
        ctx.restore();

        // Bottom Wavy Dark Royal Blue Container
        const waveTopOffset = 665;
        const waveDip = 725;

        ctx.beginPath();
        ctx.moveTo(0, waveTopOffset);
        ctx.quadraticCurveTo(CENTER, waveDip, CANVAS_SIZE, waveTopOffset);
        ctx.lineTo(CANVAS_SIZE, CANVAS_SIZE);
        ctx.lineTo(0, CANVAS_SIZE);
        ctx.closePath();
        ctx.fillStyle = "#0B3A94";
        ctx.fill();

        // Dot Matrix Graphic
        const startX = 50;
        const startY = 70;
        const dotsCols = 18;
        const dotsRows = 16;
        const dotSpacing = 16;

        ctx.fillStyle = "rgba(160, 174, 192, 0.45)";
        for (let r = 0; r < dotsRows; r++) {
          for (let c = 0; c < dotsCols; c++) {
            const distFromCenter = Math.hypot(c - 9, r - 8);
            if (distFromCenter < 8.5 && (r + c) % 5 !== 0) {
              const x = startX + c * dotSpacing;
              const y = startY + r * dotSpacing;
              ctx.beginPath();
              ctx.arc(x, y, 2.2, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }

        // Airplane Trajectory Trail
        ctx.save();
        ctx.beginPath();
        ctx.setLineDash([6, 8]);
        ctx.moveTo(85, 430);
        ctx.bezierCurveTo(125, 280, 175, 210, 270, 195);
        ctx.strokeStyle = "rgba(160, 174, 192, 0.75)";
        ctx.lineWidth = 3.5;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // Flying Airplane Icon
        ctx.save();
        ctx.translate(275, 195);
        ctx.rotate(Math.PI * -0.22);
        ctx.fillStyle = "rgba(160, 174, 192, 0.85)";
        ctx.beginPath();
        ctx.moveTo(0, -18);
        ctx.lineTo(6, -6); ctx.lineTo(24, 0); ctx.lineTo(24, 6);
        ctx.lineTo(6, 4); ctx.lineTo(4, 16); ctx.lineTo(10, 22);
        ctx.lineTo(10, 26); ctx.lineTo(0, 23); ctx.lineTo(-10, 26);
        ctx.lineTo(-10, 22); ctx.lineTo(-4, 16); ctx.lineTo(-6, 4);
        ctx.lineTo(-24, 6); ctx.lineTo(-24, 0); ctx.lineTo(-6, -6);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // ASPOM Logo
        const logoWidth = 270;
        const logoX = CANVAS_SIZE - logoWidth - 95;
        const logoY = 320;

        if (logoCanvasRef.current) {
          const logoHeight = (logoCanvasRef.current.height / logoCanvasRef.current.width) * logoWidth;
          ctx.drawImage(logoCanvasRef.current, logoX, logoY, logoWidth, logoHeight);
        }

        // Typography inside Wave
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 72px Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.fillText(displayName || "Staff Name", CENTER, 775);

        ctx.fillStyle = "#F1F5F9";
        ctx.font = "500 44px Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.fillText(displayRole || "Position Title", CENTER, 848);

        ctx.fillStyle = "#E85028";
        ctx.fillRect(CENTER - 45, 888, 90, 7);

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "500 40px Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        const phoneText = displayPhone ? displayPhone : "Aspom Travels";
        ctx.fillText(phoneText, CENTER, 930);

        if (displayPhone) {
          ctx.fillStyle = "#93C5FD";
          ctx.font = "500 34px Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
          ctx.fillText("Aspom Travels", CENTER, 978);
        }

        ctx.restore();

        // Outer Border Frame
        ctx.save();
        ctx.beginPath();
        ctx.arc(CENTER, CENTER, RADIUS - 12, 0, Math.PI * 2);
        ctx.strokeStyle = "#0B3A94";
        ctx.lineWidth = 26;
        ctx.stroke();
        ctx.restore();
      }

      setRendering(false);
    };

    const handleImageEvent = () => {
      if (isMounted) {
        drawCanvas();
      }
    };

    if (activePhotoSrc) {
      photoImg.onload = handleImageEvent;
      photoImg.onerror = handleImageEvent;
    }

    drawCanvas();

    return () => {
      isMounted = false;
    };
  }, [name, role, phone, activePhotoSrc, zoom, offsetX, offsetY, removeBgMode, threshold, pickedColor, designMode]);

  const handleCloudAiRemoveBg = async () => {
    if (!activePhotoSrc) return;
    setIsCloudAiRemoving(true);
    setCloudAiMsg("Sending to Cloud AI...");
    setCloudAiSuccess(false);

    try {
      const apiFormData = new FormData();

      if (activePhotoSrc.startsWith("data:image")) {
        const res = await fetch(activePhotoSrc);
        const blob = await res.blob();
        apiFormData.append("image", blob, "photo.png");
      } else {
        apiFormData.append("imageUrl", activePhotoSrc);
      }

      const response = await fetch("/api/social-media/remove-bg", {
        method: "POST",
        body: apiFormData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Cloud AI removal unavailable.");
      }

      const resultBlob = await response.blob();
      const resultUrl = URL.createObjectURL(resultBlob);
      setCloudProcessedUrl(resultUrl);
      setCloudAiSuccess(true);
      setCloudAiMsg(null);
    } catch (err: any) {
      console.error("Cloud AI Background removal error", err);
      setCloudAiMsg(err.message || "Cloud AI busy. Studio keyer active.");
      setRemoveBgMode("white");
      setTimeout(() => setCloudAiMsg(null), 4000);
    } finally {
      setIsCloudAiRemoving(false);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPickingColor || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 1080;
    const clickY = ((e.clientY - rect.top) / rect.height) * 1080;

    const ctx = canvasRef.current.getContext("2d");
    if (ctx) {
      const pixel = ctx.getImageData(Math.round(clickX), Math.round(clickY), 1, 1).data;
      setPickedColor({ r: pixel[0], g: pixel[1], b: pixel[2] });
      setRemoveBgMode("picked");
      setIsPickingColor(false);
    }
  };

  const handleRestorePhoto = () => {
    setCloudProcessedUrl(null);
    setCloudAiSuccess(false);
    setCloudAiMsg(null);
    setRemoveBgMode("none");
    setPickedColor(null);
    setIsPickingColor(false);
    keyedPhotoCanvasRef.current = null;
  };

  const handleDownload = (format: "png" | "jpeg") => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    const filename = `${(name || "staff").toLowerCase().replace(/\s+/g, "_")}_profile_${designMode}.${format}`;
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
          new ClipboardItem({ "image/png": blob }),
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
      {/* Design Mode Selector Options */}
      <div className="flex items-center justify-center gap-2 p-1.5 bg-muted/60 rounded-xl border w-full max-w-md shadow-xs">
        <Button
          variant={designMode === "square" ? "default" : "ghost"}
          size="sm"
          onClick={() => setDesignMode("square")}
          className="flex-1 text-xs font-bold gap-1.5"
        >
          <LayoutGrid className="h-3.5 w-3.5" /> Option 1: Classic Card
        </Button>
        <Button
          variant={designMode === "circle" ? "default" : "ghost"}
          size="sm"
          onClick={() => setDesignMode("circle")}
          className="flex-1 text-xs font-bold gap-1.5"
        >
          <Disc className="h-3.5 w-3.5" /> Option 2: Badge Graphic
        </Button>
      </div>

      {/* Canvas Display */}
      <div
        className={`relative overflow-hidden shadow-2xl border bg-background p-2 group w-full aspect-square max-w-[500px] transition-all duration-300 ${
          designMode === "circle" ? "rounded-full" : "rounded-2xl"
        }`}
      >
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className={`w-full h-full object-contain ${
            designMode === "circle" ? "rounded-full" : "rounded-xl"
          } ${isPickingColor ? "cursor-crosshair ring-4 ring-primary" : ""}`}
        />
        {(rendering || isCloudAiRemoving) && (
          <div
            className={`absolute inset-0 bg-background/60 backdrop-blur-xs flex flex-col items-center justify-center space-y-2 p-4 text-center ${
              designMode === "circle" ? "rounded-full" : "rounded-2xl"
            }`}
          >
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-sm font-bold text-primary animate-pulse">
              {cloudAiMsg || "Rendering Graphic..."}
            </p>
          </div>
        )}
        {isPickingColor && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3 py-1.5 rounded-full font-bold shadow-lg animate-bounce flex items-center gap-1.5">
            <Pipette className="h-3.5 w-3.5" /> Click anywhere on photo background to erase
          </div>
        )}
      </div>

      {/* Free Background Removal Tool Section */}
      <div className="w-full space-y-3 bg-gradient-to-br from-primary/5 via-primary/10 to-transparent p-4 rounded-xl border border-primary/20">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
             Free Background Removal Tools
          </span>
          {(cloudProcessedUrl || removeBgMode !== "none") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRestorePhoto}
              className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3" /> Restore Photo
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Cloud AI Remove Background */}
          <Button
            onClick={handleCloudAiRemoveBg}
            disabled={!imageUrl || isCloudAiRemoving}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs gap-2"
          >
            {isCloudAiRemoving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : cloudAiSuccess ? (
              <Check className="h-3.5 w-3.5 text-green-400" />
            ) : (
              <Wand2 className="h-3.5 w-3.5" />
            )}
            {cloudAiSuccess ? "Cloud AI Removed" : "Cloud AI Remove BG"}
          </Button>

          {/* Studio White Wall Keyer */}
          <Button
            variant={removeBgMode === "white" ? "default" : "outline"}
            size="sm"
            onClick={() => setRemoveBgMode(removeBgMode === "white" ? "none" : "white")}
            disabled={!imageUrl}
            className="text-xs gap-1.5"
          >
            <Layers className="h-3.5 w-3.5" />
            {removeBgMode === "white" ? "White Wall: ON" : "Erase White Wall"}
          </Button>

          {/* Studio Gray Wall Keyer */}
          <Button
            variant={removeBgMode === "gray" ? "default" : "outline"}
            size="sm"
            onClick={() => setRemoveBgMode(removeBgMode === "gray" ? "none" : "gray")}
            disabled={!imageUrl}
            className="text-xs gap-1.5"
          >
            <Layers className="h-3.5 w-3.5" />
            {removeBgMode === "gray" ? "Gray Wall: ON" : "Erase Gray Wall"}
          </Button>

          {/* Eye-dropper Color Pick Eraser */}
          <Button
            variant={isPickingColor || removeBgMode === "picked" ? "default" : "outline"}
            size="sm"
            onClick={() => setIsPickingColor(!isPickingColor)}
            disabled={!imageUrl}
            className="text-xs gap-1.5"
          >
            <Pipette className="h-3.5 w-3.5" />
            {isPickingColor
              ? "Click Photo to Pick..."
              : removeBgMode === "picked"
              ? "Color Erased"
              : "Pick Color to Erase"}
          </Button>
        </div>

        {/* Tolerance & Edge Softness Slider */}
        {removeBgMode !== "none" && (
          <div className="pt-2 flex items-center gap-3">
            <Label className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
              <Sliders className="h-3 w-3" /> Eraser Tolerance:
            </Label>
            <input
              type="range"
              min="5"
              max="50"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer h-1.5 bg-muted rounded-lg"
            />
            <span className="text-xs font-bold text-primary w-8">
              {threshold}%
            </span>
          </div>
        )}
      </div>

      {/* Photo Controls: Zoom and Pan Buttons */}
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
                onClick={() =>
                  setZoom((z) => Math.max(0.5, Number((z - 0.1).toFixed(2))))
                }
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs font-bold w-12 text-center">
                {zoom.toFixed(1)}x
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() =>
                  setZoom((z) => Math.min(3.0, Number((z + 0.1).toFixed(2))))
                }
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
              <span className="text-xs font-bold w-12 text-center">
                {offsetX > 0 ? `+${offsetX}` : offsetX}
              </span>
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
              <span className="text-xs font-bold w-12 text-center">
                {offsetY > 0 ? `+${offsetY}` : offsetY}
              </span>
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
