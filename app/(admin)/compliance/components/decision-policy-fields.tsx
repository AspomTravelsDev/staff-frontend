"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { isSuspensionOutcome } from "@/lib/compliance-outcome";
import type { ComplianceDecisionOptions, ComplianceIssue } from "@/lib/types/compliance";

const selectClass = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm";

export function DecisionPolicyFields({ issue, points, outcome = "", value, onChange, onPointsChange, onUseOutcome }: {
  issue: ComplianceIssue; points: number; outcome?: string; value: ComplianceDecisionOptions;
  onChange: (value: ComplianceDecisionOptions) => void; onPointsChange: (value: string) => void;
  onUseOutcome: (value: string) => void;
}) {
  const policy = issue.policy_context;
  if (!policy) return null;
  const currentPoints = policy.counts_in_current_window !== false && Number.isFinite(points) ? points : 0;
  const total = policy.existing_points + currentPoints;
  const step = [...policy.steps].reverse().find(item => total >= item.threshold);
  const existingStep = [...policy.steps].reverse().find(item => policy.existing_points >= item.threshold)?.step ?? 0;
  const reentered = Boolean(step && policy.previous_action_step >= step.step && existingStep < step.step);
  const clientError = ["Client information / processing error", "Errors during client application review"].includes(issue.type);
  const priorFeedback = policy.prior_incidents.filter(item => item.feedback);
  const repeated = value.client_error_level === 2 || value.client_error_level === 3;
  const selectedStep = policy.steps.find(item => item.label === outcome)?.step ?? 0;
  const formalReview = outcome === "Termination" || (isSuspensionOutcome(outcome) && (
    (value.client_error_level ?? 0) >= 5 || (selectedStep >= 5 && issue.type.toLowerCase().includes("insubordination"))
  ));
  const coaching = <div className="space-y-1.5"><Label htmlFor="prior-coaching">Previous coaching{repeated ? " (required)" : ""}</Label><select id="prior-coaching" className={selectClass} value={value.prior_coaching_id || ""} onChange={event => onChange({ ...value, prior_coaching_id: event.target.value || null })}><option value="">Select earlier feedback</option>{priorFeedback.map(item => <option key={item.id} value={item.id}>{item.date} · {item.type}</option>)}</select>{repeated && priorFeedback.length === 0 && <p className="text-xs text-muted-foreground">Document the earlier coaching before confirming a repeated error.</p>}</div>;

  return <div className="space-y-4">
    <div className="space-y-1 rounded-md bg-muted/50 px-3 py-2.5 text-sm" aria-live="polite">
      <p><span className="tabular-nums">{policy.existing_points} + {currentPoints} = <strong>{total}</strong></span> confirmed occurrences <span className="text-muted-foreground">· rolling six months</span></p>
      {reentered ? <p className="text-xs text-muted-foreground">Threshold previously actioned. Re-entering it does not increase punishment.</p> : step && <p className="text-xs text-muted-foreground">Recommended: Step {step.step} · {step.label}{outcome !== step.label && <Button type="button" variant="link" size="sm" className="ml-1 h-auto p-0 text-xs" onClick={() => onUseOutcome(step.label)}>Use recommended action</Button>}</p>}
    </div>
    {clientError && <div className="space-y-1.5"><Label htmlFor="client-error-level">Client error level</Label><select id="client-error-level" className={selectClass} value={value.client_error_level || ""} onChange={event => {
      const level = Number(event.target.value) || null;
      onChange({ ...value, client_error_level: level });
      if (level) onPointsChange(level === 1 ? "0" : "1");
      if (level === 1) onUseOutcome("Resolved (No Action)");
    }}><option value="">Select error level</option>{policy.client_error_levels.map(level => <option key={level.level} value={level.level}>{level.level}. {level.label}</option>)}</select>{value.client_error_level && <p className="text-xs text-muted-foreground">{policy.client_error_levels.find(level => level.level === value.client_error_level)?.action}</p>}</div>}
    {repeated && coaching}
    {formalReview && <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-0.5 size-4" checked={value.formal_review_confirmed ?? false} onChange={event => onChange({ ...value, formal_review_confirmed: event.target.checked })} /><span>Investigation and HR review completed</span></label>}
    {policy.prior_incidents.length > 0 && <details className="space-y-3 text-sm" open={value.related_incident_id ? true : undefined}>
      <summary className="cursor-pointer text-muted-foreground">Link related history</summary>
      {!repeated && priorFeedback.length > 0 && coaching}
      <div className="space-y-1.5"><Label htmlFor="related-incident">Same incident as an earlier query?</Label><select id="related-incident" className={selectClass} value={value.related_incident_id || ""} onChange={event => onChange({ ...value, related_incident_id: event.target.value || null })}><option value="">Separate incident</option>{policy.prior_incidents.map(item => <option key={item.id} value={item.id}>{item.date} · {item.type}</option>)}</select></div>
      {value.related_incident_id && currentPoints > 0 && <div className="space-y-1.5"><Label htmlFor="separate-breach">Why is this a separate breach?</Label><Textarea id="separate-breach" rows={2} value={value.separate_breach_reason || ""} maxLength={5000} onChange={event => onChange({ ...value, separate_breach_reason: event.target.value })} /></div>}
    </details>}
  </div>;
}