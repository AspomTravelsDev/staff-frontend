"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CorrectionPlan } from "@/lib/types/compliance";
import { lagosDateKey } from "@/lib/utils/employee-headcount";

export function CorrectionPlanFields({ value, onChange, disabled }: { value: CorrectionPlan; onChange: (value: CorrectionPlan) => void; disabled?: boolean }) {
  return <fieldset disabled={disabled} className="space-y-3">
    <div className="space-y-1.5"><Label htmlFor="correction-notes">Correction required</Label><Textarea id="correction-notes" value={value.correction_notes} onChange={event => onChange({ ...value, correction_notes: event.target.value })} maxLength={5000} placeholder="Describe what must be corrected and how completion will be verified." required /></div>
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1.5"><Label htmlFor="correction-due">Correction deadline</Label><Input id="correction-due" type="date" min={lagosDateKey(new Date())} value={value.correction_due_date} onChange={event => onChange({ ...value, correction_due_date: event.target.value })} required /><p className="text-xs text-muted-foreground">End of day, Lagos time.</p></div>
      <div className="space-y-1.5"><Label htmlFor="correction-reminder">Remind me before deadline</Label><Input id="correction-reminder" type="number" min={0} max={30} step={1} value={Number.isNaN(value.correction_reminder_days) ? "" : value.correction_reminder_days} onChange={event => onChange({ ...value, correction_reminder_days: event.target.valueAsNumber })} required /><p className="text-xs text-muted-foreground">Days before (0–30). Use 0 for the due date.</p></div>
    </div>
    <p className="text-xs text-muted-foreground">The officer who saves this plan receives an email reminder and a browser notification where enabled, plus one overdue reminder. Checks run daily at 9:00 a.m. Lagos time.</p>
  </fieldset>;
}
