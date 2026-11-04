"use client";

import { useState, type FormEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { callAction } from "@/lib/api/action-result";
import { getPerformancePeriod, openPerformancePeriod, previewPerformancePeriod, savePerformancePeriod } from "@/lib/api/performance-period.actions";
import type { PerformancePeriod, PeriodCriterion, PeriodInput, PeriodPreview, PeriodPreviewItem, PeriodStaff, ReviewerRoute } from "@/lib/types/performance-period";

const selectClass = "h-9 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";
const routeLabels: Record<ReviewerRoute, string> = {
  supervisor: "Self → Department supervisor → MP", compliance: "Self → Compliance → MP", direct_mp: "Self → MP",
};

function PersonSelect({ id, label, value, options, onChange }: { id: string; label: string; value: string | null; options: PeriodStaff[]; onChange: (value: string | null) => void }) {
  return <div className="min-w-0 space-y-2"><Label htmlFor={id}>{label}</Label><select id={id} className={selectClass} value={value ?? ""} onChange={(event) => onChange(event.target.value || null)}>
    <option value="">Choose {label.toLowerCase()}</option>
    {value && !options.some((person) => person.id === value) && <option value={value}>Previously assigned reviewer — unavailable</option>}
    {options.map((person) => <option key={person.id} value={person.id}>{person.name} · {person.staff_id}</option>)}
  </select></div>;
}

function Criteria({ criteria }: { criteria: PeriodCriterion[] }) {
  return <details className="mt-3 text-sm"><summary className="cursor-pointer font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">View {criteria.length} KPI criteria</summary><ul className="mt-3 space-y-4">{criteria.map((criterion) => <li key={criterion.id} className="space-y-1"><p className="font-medium break-words">{criterion.name}</p><p className="whitespace-pre-wrap break-words text-muted-foreground">{criterion.description}</p><p className="whitespace-pre-wrap break-words"><span className="font-medium">Target: </span>{criterion.expectation}</p></li>)}</ul></details>;
}

function SetupSummary({ items }: { items: Omit<PeriodPreviewItem, "issues">[] }) {
  return <ul className="divide-y rounded-xl border">{items.map((item) => <li key={item.employee_id} className="p-4 sm:p-5"><h3 className="font-semibold break-words">{item.employee_name}</h3><p className="mt-1 text-sm text-muted-foreground">{item.employee_staff_id} · {item.department} · {routeLabels[item.reviewer_route]}</p><p className="mt-2 text-sm">{item.reviewer_name && <>Reviewer: {item.reviewer_name} · </>}MP: {item.mp_reviewer_name ?? "Unassigned"}</p><Criteria criteria={item.criteria} /></li>)}</ul>;
}

export function PeriodEditor({ initialPeriod, staff, onSaved, onClose }: {
  initialPeriod: PerformancePeriod | null; staff: PeriodStaff[];
  onSaved: (period: PerformancePeriod) => void; onClose: () => void;
}) {
  const [period, setPeriod] = useState(initialPeriod);
  const [values, setValues] = useState<PeriodInput>(() => initialPeriod ? {
    month: initialPeriod.month, submission_deadline: initialPeriod.submission_deadline, assignments: initialPeriod.assignments,
  } : { month: "", submission_deadline: "", assignments: [] });
  const [preview, setPreview] = useState<PeriodPreview | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const [bulkMp, setBulkMp] = useState<string | null>(null);
  const isOpened = !!period && period.status !== "draft";
  const detail = useQuery({ queryKey: ["performance", "period-setup", period?.id], queryFn: () => callAction(() => getPerformancePeriod(period!.id)), enabled: isOpened });

  const mutation = useMutation({
    mutationFn: async (action: "save" | "preview" | "open") => {
      setError("");
      if (action === "open") {
        if (!period || !preview?.ready) throw new Error("Preview this setup before opening.");
        const opened = await callAction(() => openPerformancePeriod(period.id, preview.preview_token));
        setPeriod(opened);
        setPreview(null);
        onSaved(opened);
        toast.success("Monthly period opened. Staff and KPI criteria have been saved.");
        return;
      }
      const saved = await callAction(() => savePerformancePeriod(period?.id ?? null, { ...values, ...(period ? { version: period.version } : {}) }));
      setPeriod(saved);
      onSaved(saved);
      setPreview(null);
      if (action === "preview") {
        setPreview(await callAction(() => previewPerformancePeriod(saved.id)));
      } else {
        toast.success("Monthly setup draft saved");
      }
    },
    onError: (failure) => { setPreview(null); setError(failure instanceof Error ? failure.message : "Unable to save. Please try again."); },
  });

  function change(next: PeriodInput) { setValues(next); setPreview(null); setError(""); }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!mutation.isPending) mutation.mutate("preview");
  }

  function updateAssignment(employeeId: string, key: "reviewer_id" | "mp_reviewer_id", value: string | null) {
    change({ ...values, assignments: values.assignments.map((assignment) => assignment.employee_id === employeeId ? { ...assignment, [key]: value } : assignment) });
  }

  const selected = new Set(values.assignments.map((assignment) => assignment.employee_id));
  const visibleStaff = staff.filter((person) => (department === "all" || person.department === department) && `${person.name} ${person.staff_id} ${person.department ?? ""}`.toLowerCase().includes(search.toLowerCase()));

  return <section className="space-y-6" aria-label="Period setup">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">{isOpened ? `${period.month} · Saved setup` : period ? `Draft · ${period.month}` : "New monthly period"}</h2><Button variant="outline" disabled={mutation.isPending} onClick={onClose}>Back to periods</Button></div>
    {error && <div role="alert" className="space-y-2 text-sm text-destructive"><p>{error}</p><p>For a changed draft, return to periods and reopen the latest saved version.</p></div>}
    {isOpened ? <div className="space-y-4"><p className="text-sm text-muted-foreground">Opened setup is locked. These staff identities, reviewer assignments and KPI criteria are preserved for this month. Submission deadline: {period.submission_deadline}.</p>{detail.isPending ? <p role="status">Loading saved setup…</p> : detail.error ? <div role="alert"><p>Could not load saved setup.</p><Button variant="outline" onClick={() => void detail.refetch()}>Retry</Button></div> : <SetupSummary items={detail.data.appraisals} />}</div> : <>
      <form onSubmit={submit} className="space-y-6">
        <fieldset disabled={mutation.isPending} className="min-w-0 space-y-6">
          <legend className="sr-only">Monthly period details and assignments</legend>
          <div className="grid max-w-2xl gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="appraisal-month">Appraisal month</Label><Input id="appraisal-month" type="month" required min="2000-01" max="2099-12" value={values.month} onChange={(event) => change({ ...values, month: event.target.value })} /></div><div className="space-y-2"><Label htmlFor="appraisal-deadline">Submission deadline</Label><Input id="appraisal-deadline" type="date" required min={values.month ? `${values.month}-01` : undefined} value={values.submission_deadline} onChange={(event) => change({ ...values, submission_deadline: event.target.value })} /></div></div>
          <section className="space-y-3" aria-labelledby="participants-heading"><div className="space-y-1"><h3 id="participants-heading" className="font-semibold">Select staff</h3><p className="text-sm text-muted-foreground">Active individual accounts only. Each person can have one appraisal per month.</p></div>
            <div className="grid gap-3 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="period-staff-search">Search staff</Label><Input id="period-staff-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name or staff ID" /></div><div className="space-y-2"><Label htmlFor="period-department">Department</Label><select id="period-department" className={selectClass} value={department} onChange={(event) => setDepartment(event.target.value)}><option value="all">All departments</option>{[...new Set(staff.map((person) => person.department).filter((value): value is string => !!value))].sort().map((name) => <option key={name}>{name}</option>)}</select></div></div>
            <div className="max-h-64 overflow-y-auto rounded-xl border p-2">{!visibleStaff.length ? <p className="p-3 text-sm text-muted-foreground">No matching staff. Try another search or department.</p> : visibleStaff.map((person) => <label key={person.id} className="flex cursor-pointer items-start gap-3 rounded-md p-3 hover:bg-muted/50"><input className="mt-1 size-4 accent-primary" type="checkbox" checked={selected.has(person.id)} onChange={(event) => change({ ...values, assignments: event.target.checked ? [...values.assignments, { employee_id: person.id, reviewer_id: null, mp_reviewer_id: bulkMp === person.id ? null : bulkMp }] : values.assignments.filter((row) => row.employee_id !== person.id) })} /><span className="min-w-0 text-sm"><span className="block break-words font-medium">{person.name}</span><span className="text-muted-foreground">{person.staff_id} · {person.department ?? "Department missing"}{person.is_supervisor ? " · Supervisor" : ""}</span></span></label>)}</div>
          </section>
          <section aria-labelledby="reviewers-heading" className="space-y-4"><div className="space-y-1"><h3 id="reviewers-heading" className="font-semibold">Reviewer assignments · {values.assignments.length} staff</h3><p className="max-w-2xl text-sm text-muted-foreground">Staff are reviewed by their department supervisor; supervisors by Compliance. The Compliance supervisor goes directly to MP. Reviewers cannot assess themselves.</p></div>
            {!!values.assignments.length && <div className="max-w-md"><PersonSelect id="bulk-mp" label="MP reviewer for all selected staff" options={staff.filter((person) => person.can_review_mp)} value={bulkMp} onChange={(value) => { setBulkMp(value); change({ ...values, assignments: values.assignments.map((row) => ({ ...row, mp_reviewer_id: row.employee_id === value || row.reviewer_id === value ? null : value })) }); }} /></div>}
            {!values.assignments.length ? <p className="text-sm text-muted-foreground">Select staff above to assign their reviewers.</p> : <ul className="divide-y rounded-xl border">{values.assignments.map((assignment) => {
              const person = staff.find((candidate) => candidate.id === assignment.employee_id);
              const route = person?.reviewer_route ?? "supervisor";
              const reviewers = staff.filter((candidate) => candidate.id !== assignment.employee_id && candidate.id !== assignment.mp_reviewer_id && (route === "compliance" ? candidate.can_review_compliance : candidate.is_supervisor && !!person?.department && candidate.department === person.department));
              return <li key={assignment.employee_id} className="space-y-4 p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h4 className="break-words font-medium">{person?.name ?? "Unavailable staff member"}</h4><p className="mt-1 text-sm text-muted-foreground">{person ? routeLabels[route] : "This staff member is no longer available. Remove them before opening."}</p></div><Button type="button" variant="ghost" size="sm" aria-label={`Remove ${person?.name ?? "unavailable staff member"}`} onClick={() => change({ ...values, assignments: values.assignments.filter((row) => row.employee_id !== assignment.employee_id) })}>Remove</Button></div>
                <div className="grid gap-4 sm:grid-cols-2">{route !== "direct_mp" ? <PersonSelect id={`reviewer-${assignment.employee_id}`} label={route === "compliance" ? "Compliance reviewer" : "Department supervisor"} value={assignment.reviewer_id} options={reviewers} onChange={(value) => updateAssignment(assignment.employee_id, "reviewer_id", value)} /> : <p className="self-center text-sm text-muted-foreground">No intermediate reviewer required.</p>}<PersonSelect id={`mp-${assignment.employee_id}`} label="MP reviewer" value={assignment.mp_reviewer_id} options={staff.filter((candidate) => candidate.can_review_mp && candidate.id !== assignment.employee_id && candidate.id !== assignment.reviewer_id)} onChange={(value) => updateAssignment(assignment.employee_id, "mp_reviewer_id", value)} /></div>
              </li>;
            })}</ul>}
          </section>
          <div className="flex flex-wrap gap-3"><Button type="button" variant="outline" onClick={() => mutation.mutate("save")}>Save draft</Button><Button type="submit">Save and preview</Button></div>
        </fieldset>
      </form>
      {mutation.isPending && <p role="status" className="text-sm text-muted-foreground">{mutation.variables === "open" ? "Opening period and saving KPI criteria…" : "Saving monthly setup…"}</p>}
      {preview && <section aria-labelledby="preview-heading" className="space-y-4" aria-live="polite"><div className="space-y-1"><h3 id="preview-heading" className="text-lg font-semibold">{preview.ready ? "Ready to open" : "Resolve these items before opening"}</h3><p className="text-sm text-muted-foreground">{preview.items.length} staff · {preview.items.reduce((sum, item) => sum + item.criteria.length, 0)} applicable KPI criteria. Opening preserves the criteria and reviewer assignments shown here.</p></div>
        {!!preview.errors.length && <ul className="list-disc space-y-1 pl-5 text-sm text-destructive">{preview.errors.map((issue) => <li key={issue}>{issue}</li>)}</ul>}
        {preview.items.some((item) => item.issues.length) && <ul className="space-y-3 text-sm">{preview.items.filter((item) => item.issues.length).map((item) => <li key={item.employee_id}><p className="font-medium">{item.employee_name}</p><ul className="mt-1 list-disc space-y-1 pl-5 text-destructive">{item.issues.map((issue) => <li key={issue}>{issue}</li>)}</ul></li>)}</ul>}
        <SetupSummary items={preview.items} />
        {preview.ready && <AlertDialog><AlertDialogTrigger asChild><Button disabled={mutation.isPending}>Open monthly period</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Open {values.month} for {preview.items.length} staff?</AlertDialogTitle><AlertDialogDescription>This locks the monthly setup and creates each appraisal with its assigned reviewers and a copy of its KPI criteria. You cannot edit this period after opening.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep as draft</AlertDialogCancel><AlertDialogAction onClick={() => mutation.mutate("open")}>Open period</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>}
      </section>}
    </>}
  </section>;
}
