"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

interface QRCodeImageProps {
  value: string;
  size?: number;
  className?: string;
  alt?: string;
  imgRef?: React.Ref<HTMLImageElement>;
  onReady?: (imageUrl: string) => void;
}

export function QRCodeImage({
  value,
  size = 280,
  className = "",
  alt = "QR Code",
  imgRef,
  onReady,
}: QRCodeImageProps) {
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // High-res QR generation URL using standard encoding
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size * 2}x${size * 2}&margin=10&data=${encodeURIComponent(value)}`;
  const fallbackUrl = `https://quickchart.io/qr?text=${encodeURIComponent(value)}&size=${size * 2}&margin=2`;

  const currentSrc = hasError ? fallbackUrl : qrUrl;

  return (
    <div
      className={`relative flex items-center justify-center bg-white rounded-xl p-3 shadow-inner ${className}`}
      style={{ width: size, height: size }}
    >
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/90 z-10 rounded-xl">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-[11px] font-medium text-muted-foreground">
            Generating code...
          </span>
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        crossOrigin="anonymous"
        src={currentSrc}
        alt={alt}
        width={size}
        height={size}
        className="w-full h-full object-contain"
        onLoad={() => { setLoading(false); onReady?.(currentSrc); }}
        onError={() => {
          if (!hasError) {
            setHasError(true);
          } else {
            setLoading(false);
          }
        }}
      />
    </div>
  );
}
