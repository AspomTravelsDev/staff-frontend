"use client";

import { Monitor, QrCode, Layers, Loader2 } from "lucide-react";
import { useClockInMode } from "@/hooks/use-clock-in-mode";
import type { ClockInMode } from "@/lib/config/attendance";
import { cn } from "@/lib/utils";

const MODES: { value: ClockInMode; label: string; icon: React.ElementType; description: string }[] = [
  {
    value: "normal",
    label: "Normal",
    icon: Monitor,
    description: "Button clock-in only",
  },
  {
    value: "qrcode",
    label: "QR Code",
    icon: QrCode,
    description: "QR scan only",
  },
  {
    value: "both",
    label: "Both",
    icon: Layers,
    description: "Button + QR scan",
  },
];

interface ClockInModeToggleProps {
  /** If true, renders a compact icon-only version suited for tight spaces */
  compact?: boolean;
  className?: string;
}

export function ClockInModeToggle({ compact = false, className }: ClockInModeToggleProps) {
  const { mode, setMode, isSaving } = useClockInMode();

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {!compact && (
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-0.5">
          Clock-in Mode
        </span>
      )}
      <div
        role="group"
        aria-label="Clock-in mode"
        className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5 gap-0.5"
      >
        {MODES.map(({ value, label, icon: Icon, description }) => {
          const isActive = mode === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={isActive}
              aria-label={`${label} — ${description}`}
              title={`${label}: ${description}`}
              onClick={() => setMode(value)}
              disabled={isSaving}
              className={cn(
                "relative flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring select-none",
                isActive
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50",
                isSaving ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              )}
            >
              {isActive && isSaving ? (
                <Loader2 className="h-3.5 w-3.5 shrink-0 text-primary animate-spin" />
              ) : (
                <Icon
                  className={cn(
                    "h-3.5 w-3.5 shrink-0 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                />
              )}
              {!compact && (
                <span className="hidden sm:inline">{label}</span>
              )}
              {compact && <span className="sr-only">{label}</span>}
            </button>
          );
        })}
      </div>
      {!compact && (
        <p className="text-[11px] text-muted-foreground px-0.5 leading-relaxed">
          {MODES.find((m) => m.value === mode)?.description}.{" "}
          <span className="text-muted-foreground/70">Changes take effect immediately for all users.</span>
        </p>
      )}
    </div>
  );
}
