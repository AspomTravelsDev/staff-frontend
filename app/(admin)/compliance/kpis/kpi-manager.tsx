"use client";

import { useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Target } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { callAction } from "@/lib/api/action-result";
import { listDepartmentKpis, saveDepartmentKpi } from "@/lib/api/department-kpi.actions";
import type { DepartmentKpi, DepartmentKpiInput, DepartmentKpiList } from "@/lib/types/department-kpi";

const queryKey = ["performance", "department-kpis"] as const;
const selectClass = "h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

function emptyKpi(department: string): DepartmentKpiInput {
  return { department, name: "", description: "", expectation: "", applies_to: "all_staff", is_active: true };
}

export function DepartmentKpiManager({ initialData }: { initialData: DepartmentKpiList }) {
  const client = useQueryClient();
  const { data, error, isFetching, refetch } = useQuery({ queryKey, queryFn: () => callAction(listDepartmentKpis), initialData });
  const [department, setDepartment] = useState(() =>
    initialData.departments.find((value) => initialData.items.some((item) => item.department === value && item.is_active))
    ?? initialData.departments.find((value) => initialData.items.some((item) => item.department === value))
    ?? initialData.departments[0] ?? ""
  );
  const [status, setStatus] = useState("active");
  const [search, setSearch] = useState("");
  const [editor, setEditor] = useState<{ id: string | null; values: DepartmentKpiInput } | null>(null);
  const [saveError, setSaveError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);
  const addRef = useRef<HTMLButtonElement>(null);

  const save = useMutation({
    mutationFn: ({ id, values }: { id: string | null; values: DepartmentKpiInput }) => callAction(() => saveDepartmentKpi(id, values)),
    onSuccess: (saved) => {
      client.setQueryData<DepartmentKpiList>(queryKey, (old) => old ? { ...old, items: [...old.items.filter((item) => item.id !== saved.id), saved] } : old);
      setDepartment(saved.department);
      setStatus(saved.is_active ? "active" : "inactive");
      setSearch("");
      setEditor(null);
      setSaveError("");
      toast.success("KPI saved");
      addRef.current?.focus();
      void client.invalidateQueries({ queryKey });
    },
    onError: (failure) => setSaveError(failure instanceof Error ? failure.message : "Unable to save. Please try again."),
  });

  function openEditor(kpi?: DepartmentKpi) {
    setSaveError("");
    setEditor({ id: kpi?.id ?? null, values: kpi ? { department: kpi.department, name: kpi.name, description: kpi.description, expectation: kpi.expectation, applies_to: kpi.applies_to, is_active: kpi.is_active } : emptyKpi(department) });
    requestAnimationFrame(() => { nameRef.current?.focus(); nameRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }); });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor || save.isPending) return;
    const values = { ...editor.values, name: editor.values.name.trim(), description: editor.values.description.trim(), expectation: editor.values.expectation.trim() };
    if (!values.name || !values.description || !values.expectation) {
      setSaveError("Enter a KPI name, description, and target or expectation.");
      return;
    }
    setSaveError("");
    save.mutate({ id: editor.id, values });
  }

  function field<K extends keyof DepartmentKpiInput>(key: K, value: DepartmentKpiInput[K]) {
    setEditor((old) => old ? { ...old, values: { ...old.values, [key]: value } } : old);
  }

  const departmentItems = data.items.filter((item) => item.department === department);
  const activeCount = departmentItems.filter((item) => item.is_active).length;
  const items = departmentItems.filter((item) => (status === "all" || item.is_active === (status === "active")) && `${item.name} ${item.description} ${item.expectation}`.toLowerCase().includes(search.toLowerCase())).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Department KPIs</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">Set the criteria and expectations staff will use in their performance appraisals.</p>
          <p className="text-sm text-muted-foreground">{data.items.length} KPIs in the catalogue · {data.items.filter((item) => item.is_active).length} active · {data.items.filter((item) => !item.is_active).length} inactive. Choose a department below to view its KPIs.</p>
        </div>
        <Button ref={addRef} size="lg" disabled={!!editor || !department} onClick={() => openEditor()}><Plus aria-hidden="true" />Add KPI</Button>
      </header>

      <div className="flex flex-wrap items-end gap-4">
        <div className="grid gap-2"><Label htmlFor="department-filter">Department</Label><select id="department-filter" className={selectClass} value={department} disabled={!!editor} onChange={(event) => setDepartment(event.target.value)}>{data.departments.map((value) => <option key={value}>{value}</option>)}</select></div>
        <div className="grid gap-2"><Label htmlFor="status-filter">Status</Label><select id="status-filter" className={selectClass} value={status} onChange={(event) => setStatus(event.target.value)}><option value="active">Active</option><option value="inactive">Inactive</option><option value="all">All statuses</option></select></div>
        <div className="grid min-w-48 flex-1 gap-2 sm:max-w-sm"><Label htmlFor="kpi-search">Find a KPI</Label><Input id="kpi-search" className="h-9" placeholder="Search names and expectations" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
      </div>

      {error && <div role="alert" className="flex flex-wrap items-center gap-3 text-sm text-destructive">Unable to refresh KPIs. Your last loaded list is shown.<Button variant="outline" disabled={isFetching} onClick={() => void refetch()}>Retry</Button></div>}

      {editor && (
        <section aria-labelledby="kpi-editor-title" className="rounded-xl border p-4 sm:p-6">
          <h2 id="kpi-editor-title" className="text-lg font-semibold">{editor.id ? "Edit KPI" : "Add KPI"} · {editor.values.department}</h2>
          <p className="mt-1 text-sm text-muted-foreground">Use a clear expectation that staff and reviewers can assess consistently.</p>
          <form onSubmit={submit} className="mt-5 max-w-3xl space-y-4">
            <fieldset disabled={save.isPending} className="space-y-4 disabled:opacity-60">
              <div className="grid gap-2"><Label htmlFor="kpi-name">KPI name</Label><Input ref={nameRef} id="kpi-name" required maxLength={180} value={editor.values.name} onChange={(event) => field("name", event.target.value)} placeholder="e.g. Timely completion of assigned work" /></div>
              <div className="grid gap-2"><Label htmlFor="kpi-description">What is measured?</Label><Textarea id="kpi-description" required maxLength={3000} value={editor.values.description} onChange={(event) => field("description", event.target.value)} placeholder="Describe the responsibility or result being assessed." /></div>
              <div className="grid gap-2"><Label htmlFor="kpi-expectation">Target or expectation</Label><Textarea id="kpi-expectation" required maxLength={3000} value={editor.values.expectation} onChange={(event) => field("expectation", event.target.value)} placeholder="e.g. Complete at least 90% of assigned tasks by the agreed deadline." /></div>
              <div className="flex flex-wrap gap-4">
                <div className="grid gap-2"><Label htmlFor="kpi-applies">Applies to</Label><select id="kpi-applies" className={selectClass} value={editor.values.applies_to} onChange={(event) => field("applies_to", event.target.value as DepartmentKpiInput["applies_to"])}><option value="all_staff">All department staff</option><option value="supervisors">Supervisors only</option></select></div>
                <div className="grid gap-2"><Label htmlFor="kpi-active">Status</Label><select id="kpi-active" className={selectClass} value={editor.values.is_active ? "active" : "inactive"} onChange={(event) => field("is_active", event.target.value === "active")}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
              </div>
              <p className="text-xs text-muted-foreground">Inactive KPIs are kept for reference and excluded from future appraisals. Changes will not alter appraisals already opened.</p>
            </fieldset>
            {saveError && <p role="alert" className="text-sm text-destructive">{saveError}</p>}
            <div className="flex gap-2"><Button type="submit" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save KPI"}</Button><Button type="button" variant="outline" disabled={save.isPending} onClick={() => { setEditor(null); setSaveError(""); addRef.current?.focus(); }}>Cancel</Button></div>
          </form>
        </section>
      )}

      <section aria-label={`${department} KPIs`} className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2"><h2 className="text-lg font-semibold">{department}</h2><p className="text-sm text-muted-foreground" aria-live="polite">{activeCount} active · {departmentItems.length - activeCount} inactive</p></div>
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed px-6 py-12 text-center"><Target className="mx-auto mb-3 size-7 text-muted-foreground" aria-hidden="true" /><h3 className="font-medium">{departmentItems.length === 0 ? "No KPIs for this department yet" : "No matching KPIs"}</h3><p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{departmentItems.length === 0 ? "Add the first KPI to define what good performance looks like for this department." : "Try another search or status filter."}</p>{departmentItems.length === 0 && <Button className="mt-4" variant="outline" disabled={!!editor} onClick={() => openEditor()}>Add first KPI</Button>}</div>
        ) : <ul className="divide-y rounded-xl border">{items.map((kpi) => (
          <li key={kpi.id} className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3"><div className="min-w-0 space-y-2"><h3 className="break-words font-semibold">{kpi.name}</h3><div className="flex flex-wrap gap-2"><Badge variant="secondary">{kpi.applies_to === "supervisors" ? "Supervisors only" : "All department staff"}</Badge>{!kpi.is_active && <Badge variant="outline">Inactive</Badge>}</div></div><Button variant="outline" disabled={!!editor} aria-label={`Edit ${kpi.name}`} onClick={() => openEditor(kpi)}><Pencil aria-hidden="true" />Edit</Button></div>
            <p className="mt-3 whitespace-pre-wrap break-words text-sm text-muted-foreground">{kpi.description}</p>
            <p className="mt-3 whitespace-pre-wrap break-words text-sm"><span className="font-medium">Expectation: </span>{kpi.expectation}</p>
          </li>
        ))}</ul>}
      </section>
    </div>
  );
}
