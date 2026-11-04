"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatLagosDate } from "@/lib/utils/attendance";
import type { SanctionGridResponse } from "@/lib/types/compliance";
import { SanctionLadderGrid } from "./sanction-ladder-grid";

export function previousSanctionWindowEnd(start: string): string {
  const date = new Date(`${start}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

export function SanctionGridSection({ data }: { data: SanctionGridResponse }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [endingOn, setEndingOn] = useState(data.windowEnd);
  const [pending, startTransition] = useTransition();
  const today = data.today ?? data.windowEnd;
  const historical = data.isHistorical ?? data.windowEnd < today;

  function viewWindow(date?: string) {
    if (pending) return;
    const params = new URLSearchParams(searchParams.toString());
    if (date && date !== today) params.set("grid_window_end", date);
    else params.delete("grid_window_end");
    const query = params.toString();
    startTransition(() => router.push(`${pathname}${query ? `?${query}` : ""}`));
  }

  return (
    <section aria-labelledby="sanction-window-heading" aria-busy={pending} className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 id="sanction-window-heading" className="text-lg font-semibold">Sanction grid</h2>
          <p className="text-sm text-muted-foreground">
            {formatLagosDate(data.windowStart)} – {formatLagosDate(data.windowEnd)}
          </p>
        </div>
        <form className="flex flex-wrap items-end gap-2" onSubmit={event => {
          event.preventDefault();
          if (endingOn && endingOn <= today) viewWindow(endingOn);
        }}>
          <div className="space-y-1">
            <Label htmlFor="sanction-window-end">Six-month window ending</Label>
            <Input id="sanction-window-end" type="date" name="grid_window_end" required max={today} value={endingOn} disabled={pending} onChange={event => setEndingOn(event.target.value)} />
          </div>
          <Button type="submit" variant="outline" disabled={pending || !endingOn || endingOn > today}>
            {pending ? "Loading window…" : "View window"}
          </Button>
          <Button type="button" variant="outline" disabled={pending || !historical} onClick={() => viewWindow()}>Current window</Button>
        </form>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => viewWindow(previousSanctionWindowEnd(data.windowStart))}>Previous window</Button>
        <p className="text-xs text-muted-foreground">Choose any past end date to review the six months ending that day.</p>
      </div>
      {historical && <p className="text-xs text-muted-foreground">Historical window · uses currently saved outcomes for incidents dated in this range, including staff who have since left.</p>}
      {data.items.length ? (
        <SanctionLadderGrid
          key={`${data.windowStart}:${data.windowEnd}`}
          items={data.items}
          steps={data.steps}
          windowStart={data.windowStart}
          windowEnd={data.windowEnd}
          periodLabel={data.periodLabel}
          title="Confirmed occurrences & actions"
          description={`${formatLagosDate(data.windowStart)} – ${formatLagosDate(data.windowEnd)}. Pending queries do not count toward the total. Steps are recommendations for review.`}
          defaultOpen
        />
      ) : <p role="status" className="text-sm text-muted-foreground">No confirmed occurrences or pending queries in this window.</p>}
    </section>
  );
}
