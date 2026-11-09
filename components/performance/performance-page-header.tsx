import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";

export function PerformancePageHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  meta,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  icon: LucideIcon;
  meta?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="relative overflow-hidden rounded-xl border bg-card px-5 py-5 shadow-sm sm:px-6 sm:py-6">
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-primary/5 [clip-path:polygon(35%_0,100%_0,100%_100%,0_100%)]" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
            <Icon className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 space-y-1">
            {eyebrow && <Badge variant="outline" className="mb-1 text-[10px] uppercase tracking-[0.14em]">{eyebrow}</Badge>}
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
            {meta}
          </div>
        </div>
        {actions && <div className="relative flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  );
}

export function PerformanceMetric({ label, value, detail, tone = "default" }: { label: string; value: React.ReactNode; detail?: string; tone?: "default" | "primary" | "amber" }) {
  const toneClass = tone === "primary" ? "border-primary/20 bg-primary/5" : tone === "amber" ? "border-amber-500/20 bg-amber-500/5" : "bg-card";
  return <div className={`rounded-lg border px-4 py-3 ${toneClass}`}><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>{detail && <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}</div>;
}
