"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { AssessmentDefinition } from "@/lib/types/applicant-assessment";

export function PracticalWorkspace({ plan, marks, notes, disabled, onChange, onNotes }: {
  plan: AssessmentDefinition;
  marks: Record<string, number | null>;
  notes: Record<string, string>;
  disabled: boolean;
  onChange: (marks: Record<string, number | null>) => void;
  onNotes: (id: string, note: string) => void;
}) {
  const tasks = plan.practical_modules?.length ? plan.practical_modules : [{
    ...plan.practical_module!, duration_minutes: 0,
    scenario: plan.questions.filter(q => q.section === "practical" && q.scored).map(q => q.text).join("\n\n"),
    tasks: [], assessor_guide: "Use the saved marking criteria for this assessment.",
  }];
  return <section className="divide-y rounded-lg border">
    {tasks.map((task,index) => {
      const marked = task.criteria.filter(c => marks[c.id] != null).length;
      const max = task.criteria.reduce((sum,c) => sum+c.max,0);
      const earned = task.criteria.reduce((sum,c) => sum+(marks[c.id] ?? 0),0);
      return <details key={task.id} open={index === 0} className="group p-4">
        <summary className="cursor-pointer text-sm font-medium">
          <span>{task.name}</span>
          <span className="ml-3 font-normal text-muted-foreground">{marked === task.criteria.length ? `${earned}/${max} marks` : `${marked}/${task.criteria.length} marked`}</span>
        </summary>
        <div className="mt-4 space-y-4">
          <details className="text-sm text-muted-foreground">
            <summary className="w-fit cursor-pointer">Task brief and marking guidance</summary>
            <div className="mt-3 space-y-3 leading-relaxed">
              <p className="whitespace-pre-wrap">{task.scenario}</p>
              <ul className="list-disc space-y-1 pl-5">{task.tasks.map(item => <li key={item}>{item}</li>)}</ul>
              <p>{task.assessor_guide}</p>
              <dl className="space-y-2">{task.criteria.filter(c=>c.guide).map(c=><div key={c.id}><dt className="font-medium text-foreground">{c.label}</dt><dd>{c.guide}</dd></div>)}</dl>
            </div>
          </details>
          <div className="divide-y">
            {task.criteria.map(c => <div key={c.id} className="flex items-center justify-between gap-4 py-3">
              <label htmlFor={`mark-${c.id}`} className="text-sm">
                <span className="block font-medium">{c.label}</span>
                {c.required && <span className="text-xs text-muted-foreground">Required: at least {c.minimum ?? 1}/{c.max}</span>}
              </label>
              <div className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
                <Input id={`mark-${c.id}`} type="number" inputMode="numeric" min={0} max={c.max} step={1} className="h-10 w-20 text-center" disabled={disabled} value={marks[c.id] ?? ""} onChange={e => {
                  const value = e.target.value === "" ? null : Number(e.target.value);
                  if (value === null || (Number.isInteger(value) && value >= 0 && value <= c.max)) onChange({...marks,[c.id]:value});
                }}/>
                <span>/ {c.max}</span>
              </div>
            </div>)}
          </div>
          {!!plan.practical_modules?.length && <details className="text-sm text-muted-foreground">
            <summary className="w-fit cursor-pointer">Add evidence (optional)</summary>
            <Textarea className="mt-2" aria-label={`${task.name} evidence`} maxLength={10000} disabled={disabled} value={notes[`evidence-${task.id}`] ?? ""} onChange={e => onNotes(`evidence-${task.id}`,e.target.value)}/>
          </details>}
        </div>
      </details>;
    })}
  </section>;
}
