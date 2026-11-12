"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Papa, { type ParseResult } from "papaparse";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ArrowUpDown, Plus, Pencil, Search, Target, ListFilter, MoreHorizontal, Eye, Building2, Download, Upload, Trash2, EyeOff, CheckSquare } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { StatsCard } from "@/components/stats-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PerformancePageHeader } from "@/components/performance/performance-page-header";
import { callAction } from "@/lib/api/action-result";
import {
  bulkDeleteDepartmentKpis,
  bulkDeleteKpiCategories,
  bulkUpdateDepartmentKpisStatus,
  bulkUpdateKpiCategoriesStatus,
  deleteAllDepartmentKpis,
  listDepartmentKpis,
  listKpiCategories,
  saveDepartmentKpi,
  saveDepartmentKpisBulk,
  saveKpiCategory,
} from "@/lib/api/department-kpi.actions";
import type { DepartmentKpi, DepartmentKpiInput, DepartmentKpiList, KpiCategory } from "@/lib/types/department-kpi";

const queryKey = ["performance", "department-kpis"] as const;
const sortOptions = ["category", "name", "status"] as const;
const pageSizeOptions = [10, 25, 50] as const;
const importHeaders = ["category", "name", "description", "expectation", "measurement_method", "applies_to", "is_active", "score_1", "score_2", "score_3", "score_4", "score_5"];

function SortIcon({ active, direction }: { active: boolean; direction: "asc" | "desc" }) {
  if (!active) return <ArrowUpDown className="size-3.5 text-muted-foreground" aria-hidden="true" />;
  return direction === "asc"
    ? <ArrowUp className="size-3.5" aria-hidden="true" />
    : <ArrowDown className="size-3.5" aria-hidden="true" />;
}

function emptyKpi(): DepartmentKpiInput {
  return { name: "", description: "", expectation: "", measurement_method: "", scoring_guide: { 1: "", 2: "", 3: "", 4: "", 5: "" }, applies_to: "all_staff", is_active: true, category_id: null };
}

type BatchAction = "delete" | "activate" | "deactivate";

interface BatchConfirm {
  action: BatchAction;
  ids: string[];
  label: string;
}

export function DepartmentKpiManager({ initialData, isSuperAdmin = false }: { initialData: DepartmentKpiList; isSuperAdmin?: boolean }) {
  const client = useQueryClient();
  const { data, error, isFetching, refetch } = useQuery({ queryKey, queryFn: () => callAction(listDepartmentKpis), initialData });
  const categories = useQuery({ queryKey: ["performance", "kpi-categories"], queryFn: () => callAction(listKpiCategories) });
  const [department, setDepartment] = useState("all");
  const [status, setStatus] = useState("active");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof pageSizeOptions)[number]>(10);
  const [editor, setEditor] = useState<{ id: string | null; values: DepartmentKpiInput } | null>(null);
  const [categoryEditor, setCategoryEditor] = useState<{ id: string | null; name: string; description: string; departments: string[]; is_active: boolean } | null>(null);
  const [viewing, setViewing] = useState<DepartmentKpi | null>(null);
  const [saveError, setSaveError] = useState("");
  const [categorySaveError, setCategorySaveError] = useState("");
  const [importError, setImportError] = useState("");
  const [importing, setImporting] = useState(false);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

  // Multi-select state for KPIs
  const [selectedKpiIds, setSelectedKpiIds] = useState<Set<string>>(new Set());
  const [kpiBatchConfirm, setKpiBatchConfirm] = useState<BatchConfirm | null>(null);

  // Multi-select state for Categories
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(new Set());
  const [categoryBatchConfirm, setCategoryBatchConfirm] = useState<BatchConfirm | null>(null);

  const deleteAll = useMutation({
    mutationFn: () => callAction(deleteAllDepartmentKpis),
    onSuccess: () => {
      client.setQueryData<DepartmentKpiList>(queryKey, (old) => old ? { ...old, items: [] } : old);
      void client.invalidateQueries({ queryKey });
      setSelectedKpiIds(new Set());
      toast.success("All department KPIs deleted successfully");
      setConfirmDeleteAll(false);
    },
    onError: (failure) => {
      toast.error(failure instanceof Error ? failure.message : "Unable to delete KPIs.");
      setConfirmDeleteAll(false);
    },
  });

  const kpiBatch = useMutation({
    mutationFn: async ({ action, ids }: { action: BatchAction; ids: string[] }) => {
      if (action === "delete") return callAction(() => bulkDeleteDepartmentKpis(ids));
      return callAction(() => bulkUpdateDepartmentKpisStatus(ids, action === "activate"));
    },
    onSuccess: (_result, { action, ids }) => {
      if (action === "delete") {
        client.setQueryData<DepartmentKpiList>(queryKey, (old) => old ? { ...old, items: old.items.filter((k) => !ids.includes(k.id)) } : old);
      } else {
        client.setQueryData<DepartmentKpiList>(queryKey, (old) => old ? { ...old, items: old.items.map((k) => ids.includes(k.id) ? { ...k, is_active: action === "activate" } : k) } : old);
      }
      void client.invalidateQueries({ queryKey });
      setSelectedKpiIds(new Set());
      setKpiBatchConfirm(null);
      const noun = ids.length === 1 ? "KPI" : "KPIs";
      if (action === "delete") toast.success(`${ids.length} ${noun} deleted`);
      else toast.success(`${ids.length} ${noun} ${action === "activate" ? "activated" : "deactivated"}`);
    },
    onError: (failure) => {
      toast.error(failure instanceof Error ? failure.message : "Batch action failed.");
      setKpiBatchConfirm(null);
    },
  });

  const categoryBatch = useMutation({
    mutationFn: async ({ action, ids }: { action: BatchAction; ids: string[] }) => {
      if (action === "delete") return callAction(() => bulkDeleteKpiCategories(ids));
      return callAction(() => bulkUpdateKpiCategoriesStatus(ids, action === "activate"));
    },
    onSuccess: (_result, { action, ids }) => {
      void categories.refetch();
      void client.invalidateQueries({ queryKey });
      setSelectedCategoryIds(new Set());
      setCategoryBatchConfirm(null);
      const noun = ids.length === 1 ? "category" : "categories";
      if (action === "delete") toast.success(`${ids.length} ${noun} deleted`);
      else toast.success(`${ids.length} ${noun} ${action === "activate" ? "activated" : "deactivated"}`);
    },
    onError: (failure) => {
      toast.error(failure instanceof Error ? failure.message : "Batch action failed.");
      setCategoryBatchConfirm(null);
    },
  });

  const nameRef = useRef<HTMLInputElement>(null);
  const addRef = useRef<HTMLButtonElement>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const save = useMutation({
    mutationFn: ({ id, values }: { id: string | null; values: DepartmentKpiInput }) => callAction(() => saveDepartmentKpi(id, values)),
    onSuccess: (saved) => {
      client.setQueryData<DepartmentKpiList>(queryKey, (old) => old ? { ...old, items: [...old.items.filter((item) => item.id !== saved.id), saved] } : old);
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

  const saveCategory = useMutation({
    mutationFn: () => categoryEditor ? saveKpiCategory(categoryEditor.id, categoryEditor) : Promise.reject(new Error("No category selected")),
    onSuccess: () => { setCategoryEditor(null); setCategorySaveError(""); void categories.refetch(); void client.invalidateQueries({ queryKey }); toast.success("KPI category saved"); },
    onError: (failure) => setCategorySaveError(failure instanceof Error ? failure.message : "Unable to save this category."),
  });

  function openEditor(kpi?: DepartmentKpi) {
    setSaveError("");
    setEditor({ id: kpi?.id ?? null, values: kpi ? { category_id: kpi.category_id ?? null, name: kpi.name, description: kpi.description, expectation: kpi.expectation, measurement_method: kpi.measurement_method, scoring_guide: kpi.scoring_guide, applies_to: kpi.applies_to, is_active: kpi.is_active } : emptyKpi() });
    requestAnimationFrame(() => { nameRef.current?.focus(); nameRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }); });
  }

  function openCategoryEditor(category?: KpiCategory) {
    setCategorySaveError("");
    setCategoryEditor(category ? { id: category.id, name: category.name, description: category.description ?? "", departments: category.departments, is_active: category.is_active } : { id: null, name: "", description: "", departments: [], is_active: true });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor || save.isPending) return;
    const values = { ...editor.values, name: editor.values.name.trim(), description: editor.values.description.trim(), expectation: editor.values.expectation.trim(), measurement_method: editor.values.measurement_method.trim(), scoring_guide: Object.fromEntries([1, 2, 3, 4, 5].map((score) => [score, editor.values.scoring_guide[score as 1 | 2 | 3 | 4 | 5].trim()])) as DepartmentKpiInput["scoring_guide"] };
    if (!values.name || !values.description || !values.expectation || values.measurement_method.length < 10 || Object.values(values.scoring_guide).some((guide) => guide.length < 5)) {
      setSaveError("Complete the KPI details, measurement method, target, and all five scoring descriptions.");
      return;
    }
    setSaveError("");
    save.mutate({ id: editor.id, values });
  }

  function field<K extends keyof DepartmentKpiInput>(key: K, value: DepartmentKpiInput[K]) {
    setEditor((old) => old ? { ...old, values: { ...old.values, [key]: value } } : old);
  }

  function downloadTemplate() {
    const csv = Papa.unparse({
      fields: importHeaders,
      data: [["Quality", "Work is accurate and precise", "Describe the result being measured", "State the expected outcome", "Explain how the result is measured", "all_staff", "true", "Below standard", "Needs improvement", "Meets standard", "Exceeds standard", "Exceptional"]],
    });
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "department-kpi-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importFile(file: File) {
    setImportError("");
    setImporting(true);
    try {
      const parsed = await new Promise<ParseResult<Record<string, string>>>((resolve, reject) => {
        Papa.parse<Record<string, string>>(file, { header: true, skipEmptyLines: true, complete: resolve, error: reject });
      });
      const categoryMap = new Map((categories.data?.items ?? []).map((category) => [category.name.trim().toLowerCase(), category.id]));
      const errors: string[] = [];
      const pendingRows: { categoryName: string; input: Omit<DepartmentKpiInput, "category_id"> }[] = [];
      parsed.data.forEach((row, index) => {
        const line = index + 2;
        const categoryName = (row.category ?? "").trim();
        const appliesTo = !row.applies_to?.trim() || row.applies_to.trim() === "all_staff" ? "all_staff" : row.applies_to.trim() === "supervisors" ? "supervisors" : null;
        const scoringGuide: DepartmentKpiInput["scoring_guide"] = {
          1: row.score_1?.trim() ?? "",
          2: row.score_2?.trim() ?? "",
          3: row.score_3?.trim() ?? "",
          4: row.score_4?.trim() ?? "",
          5: row.score_5?.trim() ?? "",
        };
        if (!categoryName) errors.push(`Row ${line}: category is required.`);
        if (!row.name?.trim() || !row.description?.trim() || !row.expectation?.trim() || !row.measurement_method?.trim()) errors.push(`Row ${line}: name, description, expectation, and measurement_method are required.`);
        if (!appliesTo) errors.push(`Row ${line}: applies_to must be all_staff or supervisors.`);
        if (Object.values(scoringGuide).some((value) => value.length < 5)) errors.push(`Row ${line}: every score description must be at least 5 characters.`);
        if (categoryName && appliesTo) pendingRows.push({ categoryName, input: { name: row.name.trim(), description: row.description.trim(), expectation: row.expectation.trim(), measurement_method: row.measurement_method.trim(), applies_to: appliesTo, is_active: row.is_active?.trim().toLowerCase() !== "false", scoring_guide: { 1: scoringGuide[1], 2: scoringGuide[2], 3: scoringGuide[3], 4: scoringGuide[4], 5: scoringGuide[5] } } });
      });
      if (errors.length) throw new Error(errors.slice(0, 8).join(" "));
      let createdCategories = 0;
      for (const row of pendingRows) {
        const key = row.categoryName.toLowerCase();
        if (!categoryMap.has(key)) {
          const category = await callAction(() => saveKpiCategory(null, { name: row.categoryName, description: "", is_active: true, departments: [] }));
          categoryMap.set(key, category.id);
          createdCategories++;
        }
      }
      const preparedItems = pendingRows.map((row) => ({
        ...row.input,
        category_id: categoryMap.get(row.categoryName.toLowerCase()) ?? null,
      }));
      const chunkSize = 100;
      for (let i = 0; i < preparedItems.length; i += chunkSize) {
        const chunk = preparedItems.slice(i, i + chunkSize);
        await callAction(() => saveDepartmentKpisBulk(chunk));
      }
      await Promise.all([refetch(), categories.refetch()]);
      toast.success(`${pendingRows.length} KPI${pendingRows.length === 1 ? "" : "s"} imported${createdCategories ? ` · ${createdCategories} categor${createdCategories === 1 ? "y" : "ies"} created` : ""}`);
    } catch (failure) {
      setImportError(failure instanceof Error ? failure.message : "Unable to import this file.");
    } finally {
      setImporting(false);
      if (importRef.current) importRef.current.value = "";
    }
  }

  function toggleSort(nextSort: (typeof sortOptions)[number]) {
    if (sort === nextSort) {
      setSortDirection((value) => value === "asc" ? "desc" : "asc");
      return;
    }
    setSort(nextSort);
    setSortDirection("asc");
  }

  // KPI selection helpers
  function toggleKpi(id: string) {
    setSelectedKpiIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllVisibleKpis(checked: boolean) {
    setSelectedKpiIds((prev) => {
      const next = new Set(prev);
      visibleItems.forEach((kpi) => checked ? next.add(kpi.id) : next.delete(kpi.id));
      return next;
    });
  }

  // Category selection helpers
  function toggleCategory(id: string) {
    setSelectedCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllVisibleCategories(checked: boolean) {
    const items = categories.data?.items ?? [];
    setSelectedCategoryIds((prev) => {
      const next = new Set(prev);
      items.forEach((cat) => checked ? next.add(cat.id) : next.delete(cat.id));
      return next;
    });
  }

  function openKpiBatchConfirm(action: BatchAction) {
    const ids = Array.from(selectedKpiIds);
    const count = ids.length;
    const noun = count === 1 ? "KPI" : "KPIs";
    const labels: Record<BatchAction, string> = {
      delete: `Permanently delete ${count} ${noun}? This cannot be undone.`,
      activate: `Mark ${count} ${noun} as active?`,
      deactivate: `Mark ${count} ${noun} as inactive? They will be excluded from future appraisals.`,
    };
    setKpiBatchConfirm({ action, ids, label: labels[action] });
  }

  function openCategoryBatchConfirm(action: BatchAction) {
    const ids = Array.from(selectedCategoryIds);
    const count = ids.length;
    const noun = count === 1 ? "category" : "categories";
    const labels: Record<BatchAction, string> = {
      delete: `Permanently delete ${count} ${noun} and all their KPIs? This cannot be undone.`,
      activate: `Mark ${count} ${noun} as active?`,
      deactivate: `Mark ${count} ${noun} as inactive?`,
    };
    setCategoryBatchConfirm({ action, ids, label: labels[action] });
  }

  const departmentItems = data.items.filter((item) => department === "all" || item.category?.name === department);
  const [sort, setSort] = useState<(typeof sortOptions)[number]>("category");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const items = departmentItems.filter((item) => (status === "all" || item.is_active === (status === "active")) && `${item.category?.name ?? ""} ${item.name} ${item.description} ${item.expectation}`.toLowerCase().includes(search.toLowerCase())).sort((a, b) => {
    const comparison = sort === "name"
      ? a.name.localeCompare(b.name)
      : sort === "status"
        ? Number(b.is_active) - Number(a.is_active) || a.name.localeCompare(b.name)
        : (a.category?.name ?? "").localeCompare(b.category?.name ?? "") || a.name.localeCompare(b.name);
    return sortDirection === "asc" ? comparison : -comparison;
  });
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const visibleItems = items.slice((page - 1) * pageSize, page * pageSize);
  const allVisibleSelected = visibleItems.length > 0 && visibleItems.every((kpi) => selectedKpiIds.has(kpi.id));
  const someVisibleSelected = visibleItems.some((kpi) => selectedKpiIds.has(kpi.id)) && !allVisibleSelected;

  const categoryItems = categories.data?.items ?? [];
  const allCategoriesSelected = categoryItems.length > 0 && categoryItems.every((cat) => selectedCategoryIds.has(cat.id));
  const someCategoriesSelected = categoryItems.some((cat) => selectedCategoryIds.has(cat.id)) && !allCategoriesSelected;

  useEffect(() => { setPage(1); }, [department, status, search, sort, sortDirection, pageSize]);
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);

  // Clear selection when visible items change significantly
  useEffect(() => { setSelectedKpiIds(new Set()); }, [department, status, search]);

  const isBusy = !!editor || !!categoryEditor || importing;
  const kpiSelectedCount = selectedKpiIds.size;
  const categorySelectedCount = selectedCategoryIds.size;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PerformancePageHeader
        eyebrow="Performance setup"
        title="Department KPIs"
        description="Build the criteria staff use in monthly appraisals. Keep targets specific, measurable, and easy to review."
        icon={Target}
        actions={<div className="flex flex-wrap gap-2"><input ref={importRef} className="sr-only" type="file" accept=".csv,text/csv" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importFile(file); }} /><Button variant="outline" disabled={isBusy} onClick={downloadTemplate}><Download aria-hidden="true" />Template</Button><Button variant="outline" disabled={isBusy || !categories.data?.items.length} onClick={() => importRef.current?.click()}><Upload aria-hidden="true" />{importing ? "Importing…" : "Import CSV"}</Button>{isSuperAdmin && Boolean(data.items.length) && (
            <Button
              variant="destructive"
              disabled={isBusy || deleteAll.isPending}
              onClick={() => setConfirmDeleteAll(true)}
            >
              <Trash2 aria-hidden="true" />
              {deleteAll.isPending ? "Deleting…" : "Delete All"}
            </Button>
          )}<Button ref={addRef} disabled={isBusy || !data.departments.length} onClick={() => openEditor()}><Plus aria-hidden="true" />Add KPI</Button></div>}
      />

      {/* Delete All confirmation */}
      <AlertDialog open={confirmDeleteAll} onOpenChange={setConfirmDeleteAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all department KPIs?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all {data.items.length} KPIs from the catalogue. Existing appraisals will retain their criteria snapshots, but past references will be unlinked. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteAll.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteAll.isPending}
              onClick={() => deleteAll.mutate()}
            >
              {deleteAll.isPending ? "Deleting…" : "Yes, delete all KPIs"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* KPI batch action confirmation */}
      <AlertDialog open={!!kpiBatchConfirm} onOpenChange={(open) => { if (!open && !kpiBatch.isPending) setKpiBatchConfirm(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {kpiBatchConfirm?.action === "delete" ? "Delete selected KPIs?" : kpiBatchConfirm?.action === "activate" ? "Activate selected KPIs?" : "Deactivate selected KPIs?"}
            </AlertDialogTitle>
            <AlertDialogDescription>{kpiBatchConfirm?.label}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={kpiBatch.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={kpiBatchConfirm?.action === "delete" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined}
              disabled={kpiBatch.isPending}
              onClick={() => kpiBatchConfirm && kpiBatch.mutate({ action: kpiBatchConfirm.action, ids: kpiBatchConfirm.ids })}
            >
              {kpiBatch.isPending ? "Processing…" : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Category batch action confirmation */}
      <AlertDialog open={!!categoryBatchConfirm} onOpenChange={(open) => { if (!open && !categoryBatch.isPending) setCategoryBatchConfirm(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {categoryBatchConfirm?.action === "delete" ? "Delete selected categories?" : categoryBatchConfirm?.action === "activate" ? "Activate selected categories?" : "Deactivate selected categories?"}
            </AlertDialogTitle>
            <AlertDialogDescription>{categoryBatchConfirm?.label}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={categoryBatch.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={categoryBatchConfirm?.action === "delete" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined}
              disabled={categoryBatch.isPending}
              onClick={() => categoryBatchConfirm && categoryBatch.mutate({ action: categoryBatchConfirm.action, ids: categoryBatchConfirm.ids })}
            >
              {categoryBatch.isPending ? "Processing…" : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!importError} onOpenChange={(open) => { if (!open) setImportError(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import could not be completed</DialogTitle>
            <DialogDescription>
              No KPIs were imported. Fix the rows below and try again.
            </DialogDescription>
          </DialogHeader>
          <div role="alert" className="max-h-64 overflow-y-auto rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {importError}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setImportError("")}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <section aria-label="KPI totals" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Total KPIs" icon={Target} value={data.items.length} description={`Across ${categories.data?.items.length ?? 0} categories`} compact />
        <StatsCard title="Active KPIs" icon={ListFilter} value={data.items.filter((item) => item.is_active).length} description="Available for new appraisal periods" iconClassName="text-green-600" compact />
        <StatsCard title="Inactive KPIs" icon={Pencil} value={data.items.filter((item) => !item.is_active).length} description="Kept in the catalogue for reference" iconClassName="text-muted-foreground" compact />
        <StatsCard title="Departments covered" icon={Building2} value={new Set(categories.data?.items.flatMap((item) => item.departments) ?? []).size} description={`Of ${data.departments.length} available departments`} iconClassName="text-blue-600" compact />
      </section>

      <Tabs defaultValue="kpis" className="w-full space-y-4">
        <TabsList aria-label="KPI management sections">
          <TabsTrigger value="kpis">KPI catalogue</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        {/* CATEGORIES TAB */}
        <TabsContent value="categories" className="space-y-4">
          <section aria-labelledby="category-management-heading" className="space-y-3 rounded-xl border bg-card p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="category-management-heading" className="text-lg font-semibold">Category management</h2>
                <p className="mt-1 text-sm text-muted-foreground">Choose which departments receive each category&apos;s active KPIs in future appraisal periods.</p>
              </div>
              <Button variant="outline" disabled={isBusy} onClick={() => openCategoryEditor()}><Plus aria-hidden="true" />Add category</Button>
            </div>

            {/* Category batch toolbar */}
            {categorySelectedCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2">
                <CheckSquare className="size-4 text-muted-foreground" aria-hidden="true" />
                <span className="text-sm font-medium">{categorySelectedCount} selected</span>
                <div className="ml-auto flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" disabled={categoryBatch.isPending} onClick={() => openCategoryBatchConfirm("activate")}>
                    <Eye className="mr-1 size-3.5" aria-hidden="true" />Activate
                  </Button>
                  <Button size="sm" variant="outline" disabled={categoryBatch.isPending} onClick={() => openCategoryBatchConfirm("deactivate")}>
                    <EyeOff className="mr-1 size-3.5" aria-hidden="true" />Deactivate
                  </Button>
                  <Button size="sm" variant="destructive" disabled={categoryBatch.isPending} onClick={() => openCategoryBatchConfirm("delete")}>
                    <Trash2 className="mr-1 size-3.5" aria-hidden="true" />Delete
                  </Button>
                </div>
              </div>
            )}

            {categories.error && <div role="alert" className="flex flex-wrap items-center gap-3 text-sm text-destructive"><span>Unable to load categories.</span><Button type="button" size="sm" variant="outline" disabled={categories.isFetching} onClick={() => void categories.refetch()}>Retry</Button></div>}
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allCategoriesSelected ? true : someCategoriesSelected ? "indeterminate" : false}
                        onCheckedChange={(checked) => toggleAllVisibleCategories(!!checked)}
                        aria-label="Select all categories"
                        disabled={isBusy || categoryItems.length === 0}
                      />
                    </TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Departments</TableHead>
                    <TableHead>KPIs</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.isLoading && <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Loading categories…</TableCell></TableRow>}
                  {!categories.isLoading && !categories.error && !categoryItems.length && <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No categories yet. Add a category to group KPIs by performance area.</TableCell></TableRow>}
                  {categoryItems.map((category) => (
                    <TableRow key={category.id} data-state={selectedCategoryIds.has(category.id) ? "selected" : undefined}>
                      <TableCell>
                        <Checkbox
                          checked={selectedCategoryIds.has(category.id)}
                          onCheckedChange={() => toggleCategory(category.id)}
                          aria-label={`Select ${category.name}`}
                          disabled={isBusy}
                        />
                      </TableCell>
                      <TableCell className="min-w-48">
                        <p className="font-medium">{category.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{category.description || "No description"}</p>
                      </TableCell>
                      <TableCell className="min-w-48">{category.departments.length ? category.departments.join(", ") : <span className="text-muted-foreground">None assigned</span>}</TableCell>
                      <TableCell className="whitespace-nowrap">{category.kpis.filter((kpi) => kpi.is_active).length} active · {category.kpis.length} total</TableCell>
                      <TableCell><Badge variant={category.is_active ? "default" : "secondary"}>{category.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                      <TableCell className="text-right"><Button type="button" size="sm" variant="outline" disabled={isBusy} onClick={() => openCategoryEditor(category)}><Pencil aria-hidden="true" />Edit</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        </TabsContent>

        {/* KPIS TAB */}
        <TabsContent value="kpis" className="space-y-4">
          <section className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3 sm:p-4">
              <div className="relative min-w-0 flex-1 sm:max-w-md"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input id="kpi-search" aria-label="Search KPI names and targets" className="h-10 pl-9" placeholder="Search KPI name, measure, or target…" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
              <div className="flex flex-wrap items-center gap-2"><Label htmlFor="department-filter" className="text-sm">Category</Label><Select value={department} disabled={!!editor} onValueChange={setDepartment}><SelectTrigger id="department-filter" className="w-47.5"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All categories</SelectItem>{categories.data?.items.map((value) => <SelectItem key={value.id} value={value.name}>{value.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="flex flex-wrap items-center gap-2"><Label htmlFor="status-filter" className="text-sm">Status</Label><Select value={status} onValueChange={setStatus}><SelectTrigger id="status-filter" className="w-37.5"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem><SelectItem value="all">All statuses</SelectItem></SelectContent></Select></div>
              <div className="flex flex-wrap items-center gap-2"><Label htmlFor="page-size" className="text-sm">Show</Label><Select value={String(pageSize)} onValueChange={(value) => setPageSize(Number(value) as (typeof pageSizeOptions)[number])}><SelectTrigger id="page-size" className="w-22.5"><SelectValue /></SelectTrigger><SelectContent>{pageSizeOptions.map((value) => <SelectItem key={value} value={String(value)}>{value}</SelectItem>)}</SelectContent></Select><span className="text-sm text-muted-foreground">per page</span></div>
            </div>

            {error && <div role="alert" className="flex flex-wrap items-center gap-3 rounded-lg border border-destructive/30 p-3 text-sm text-destructive">Unable to refresh KPIs. Your loaded list is shown.<Button variant="outline" disabled={isFetching} onClick={() => void refetch()}>Retry</Button></div>}

            {/* KPI batch toolbar */}
            {kpiSelectedCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2">
                <CheckSquare className="size-4 text-muted-foreground" aria-hidden="true" />
                <span className="text-sm font-medium">{kpiSelectedCount} selected</span>
                <div className="ml-auto flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" disabled={kpiBatch.isPending} onClick={() => openKpiBatchConfirm("activate")}>
                    <Eye className="mr-1 size-3.5" aria-hidden="true" />Activate
                  </Button>
                  <Button size="sm" variant="outline" disabled={kpiBatch.isPending} onClick={() => openKpiBatchConfirm("deactivate")}>
                    <EyeOff className="mr-1 size-3.5" aria-hidden="true" />Deactivate
                  </Button>
                  <Button size="sm" variant="destructive" disabled={kpiBatch.isPending} onClick={() => openKpiBatchConfirm("delete")}>
                    <Trash2 className="mr-1 size-3.5" aria-hidden="true" />Delete
                  </Button>
                </div>
              </div>
            )}

            <Dialog open={!!editor} onOpenChange={(open) => { if (!open && !save.isPending) { setEditor(null); setSaveError(""); } }}>
              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader><DialogTitle>{editor?.id ? "Edit KPI" : "Add KPI"}</DialogTitle><DialogDescription>Define how the result is measured and what each rating means. All five score descriptions are required.</DialogDescription></DialogHeader>
              {editor && <form onSubmit={submit} className="space-y-4">
                <fieldset disabled={save.isPending} className="grid gap-4 sm:grid-cols-2 disabled:opacity-60">
                  <div className="grid gap-2 sm:col-span-2"><Label htmlFor="kpi-category">Category</Label><Select required value={editor.values.category_id ?? ""} onValueChange={(value) => field("category_id", value)}><SelectTrigger id="kpi-category"><SelectValue placeholder="Choose a category" /></SelectTrigger><SelectContent>{categories.data?.items.filter((category) => category.is_active).map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}</SelectContent></Select></div>
                  <div className="grid gap-2"><Label htmlFor="kpi-active">Status</Label><Select value={editor.values.is_active ? "active" : "inactive"} onValueChange={(value) => field("is_active", value === "active")}><SelectTrigger id="kpi-active"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select></div>
                  <div className="grid gap-2 sm:col-span-2"><Label htmlFor="kpi-name">KPI name</Label><Input ref={nameRef} id="kpi-name" required maxLength={180} value={editor.values.name} onChange={(event) => field("name", event.target.value)} placeholder="e.g. Timely completion of assigned work" /></div>
                  <div className="grid gap-2 sm:col-span-2"><Label htmlFor="kpi-description">What is measured?</Label><Textarea id="kpi-description" required maxLength={3000} rows={3} value={editor.values.description} onChange={(event) => field("description", event.target.value)} placeholder="Describe the responsibility or result being assessed." /></div>
                  <div className="grid gap-2 sm:col-span-2"><Label htmlFor="kpi-expectation">Target or expectation</Label><Textarea id="kpi-expectation" required maxLength={3000} rows={3} value={editor.values.expectation} onChange={(event) => field("expectation", event.target.value)} placeholder="e.g. Complete at least 90% of assigned tasks by the agreed deadline." /></div>
                  <div className="grid gap-2 sm:col-span-2"><Label htmlFor="kpi-measurement">How is it measured?</Label><Textarea id="kpi-measurement" required minLength={10} maxLength={3000} rows={3} value={editor.values.measurement_method} onChange={(event) => field("measurement_method", event.target.value)} placeholder="Name the evidence source, calculation, and review period. e.g. Email timestamps: replies within one business hour ÷ eligible confirmation emails, measured monthly." /><p className="text-xs text-muted-foreground">Specify the evidence source, calculation or counting rule, and monthly review period.</p></div>
                  <fieldset className="space-y-3 sm:col-span-2"><legend className="text-sm font-medium">What does each rating mean?</legend><p className="text-xs text-muted-foreground">Write observable results or behaviors for this KPI. Make the bands distinct and cover below target through exceptional performance.</p><div className="grid gap-3">{([1, 2, 3, 4, 5] as const).map((score) => <div key={score} className="grid gap-2"><Label htmlFor={`kpi-score-${score}`}>{score} · {(["Well below expectations", "Below expectations", "Meets expectations", "Exceeds expectations", "Substantially exceeds expectations"] as const)[score - 1]}</Label><Textarea id={`kpi-score-${score}`} required minLength={5} maxLength={1000} rows={2} value={editor.values.scoring_guide[score]} onChange={(event) => field("scoring_guide", { ...editor.values.scoring_guide, [score]: event.target.value })} placeholder={score === 3 ? "Describe the result that meets the target." : `Describe the observable result for rating ${score}.`} /></div>)}</div></fieldset>
                  <div className="grid gap-2 sm:col-span-2"><Label htmlFor="kpi-applies">Who should be assessed?</Label><Select value={editor.values.applies_to} onValueChange={(value) => field("applies_to", value as DepartmentKpiInput["applies_to"])}><SelectTrigger id="kpi-applies"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all_staff">All staff in assigned departments</SelectItem><SelectItem value="supervisors">Supervisors in assigned departments</SelectItem></SelectContent></Select></div>
                </fieldset>
                <p className="text-xs text-muted-foreground">Inactive KPIs are excluded from future appraisals. Changes do not alter periods that are already open.</p>
                {saveError && <p role="alert" className="text-sm text-destructive">{saveError}</p>}
                <DialogFooter><Button type="submit" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save KPI"}</Button><Button type="button" variant="outline" disabled={save.isPending} onClick={() => { setEditor(null); setSaveError(""); addRef.current?.focus(); }}>Cancel</Button></DialogFooter>
              </form>
              }
              </DialogContent>
            </Dialog>

            <Sheet open={!!viewing} onOpenChange={(open) => { if (!open) setViewing(null); }}>
              <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
                <SheetHeader className="border-b px-6 py-5"><SheetTitle>{viewing?.name ?? "KPI details"}</SheetTitle><SheetDescription>{viewing ? `${viewing.category?.name ?? "Uncategorised"} · ${viewing.applies_to === "supervisors" ? "Supervisors" : "All staff"}` : ""}</SheetDescription></SheetHeader>
                {viewing && <div className="space-y-6 px-6 py-5"><Badge variant={viewing.is_active ? "outline" : "secondary"}>{viewing.is_active ? "Active" : "Inactive"}</Badge><section className="space-y-2"><h3 className="text-sm font-semibold">What is measured?</h3><p className="whitespace-pre-wrap text-sm leading-6">{viewing.description}</p></section><section className="space-y-2 border-t pt-5"><h3 className="text-sm font-semibold">Target or expectation</h3><p className="whitespace-pre-wrap text-sm leading-6">{viewing.expectation}</p></section><section className="space-y-2 border-t pt-5"><h3 className="text-sm font-semibold">Measurement method</h3><p className="whitespace-pre-wrap text-sm leading-6">{viewing.measurement_method}</p></section><section className="space-y-3 border-t pt-5"><h3 className="text-sm font-semibold">Rating guidance</h3>{([1, 2, 3, 4, 5] as const).map((score) => <p key={score} className="text-sm"><strong>{score}:</strong> {viewing.scoring_guide[score]}</p>)}</section><Button variant="outline" onClick={() => { openEditor(viewing); setViewing(null); }}><Pencil aria-hidden="true" />Edit KPI</Button></div>}
              </SheetContent>
            </Sheet>

            <div className="overflow-hidden rounded-lg border bg-card">
              <div className="flex items-center justify-between gap-4 border-b px-4 py-3">
                <div>
                  <h2 className="text-base font-semibold">KPI catalogue</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">Select rows to batch-action, or use the row menu to view or edit.</p>
                </div>
                <Badge variant="secondary" className="shrink-0 tabular-nums">{items.length} shown</Badge>
              </div>
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allVisibleSelected ? true : someVisibleSelected ? "indeterminate" : false}
                        onCheckedChange={(checked) => toggleAllVisibleKpis(!!checked)}
                        aria-label="Select all visible KPIs"
                        disabled={isBusy || visibleItems.length === 0}
                      />
                    </TableHead>
                    <TableHead aria-sort={sort === "category" ? sortDirection === "asc" ? "ascending" : "descending" : "none"}><button type="button" className="inline-flex items-center gap-1 font-medium hover:text-foreground" onClick={() => toggleSort("category")}>Category<SortIcon active={sort === "category"} direction={sortDirection} /></button></TableHead>
                    <TableHead aria-sort={sort === "name" ? sortDirection === "asc" ? "ascending" : "descending" : "none"}><button type="button" className="inline-flex items-center gap-1 font-medium hover:text-foreground" onClick={() => toggleSort("name")}>KPI<SortIcon active={sort === "name"} direction={sortDirection} /></button></TableHead>
                    <TableHead>Measure / target</TableHead>
                    <TableHead>Applies to</TableHead>
                    <TableHead aria-sort={sort === "status" ? sortDirection === "asc" ? "ascending" : "descending" : "none"}><button type="button" className="inline-flex items-center gap-1 font-medium hover:text-foreground" onClick={() => toggleSort("status")}>Status<SortIcon active={sort === "status"} direction={sortDirection} /></button></TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!items.length && <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">{departmentItems.length === 0 ? "No KPIs are set up for this category yet." : "No KPIs match these filters."}</TableCell></TableRow>}
                  {visibleItems.map((kpi) => (
                    <TableRow key={kpi.id} data-state={selectedKpiIds.has(kpi.id) ? "selected" : undefined}>
                      <TableCell className="py-3.5">
                        <Checkbox
                          checked={selectedKpiIds.has(kpi.id)}
                          onCheckedChange={() => toggleKpi(kpi.id)}
                          aria-label={`Select ${kpi.name}`}
                          disabled={isBusy}
                        />
                      </TableCell>
                      <TableCell className="whitespace-nowrap py-3.5"><Badge variant="secondary">{kpi.category?.name ?? "Uncategorised"}</Badge></TableCell>
                      <TableCell className="min-w-44 py-3.5"><p className="font-medium">{kpi.name}</p></TableCell>
                      <TableCell className="min-w-64 max-w-xl py-3.5"><p className="line-clamp-1 whitespace-pre-wrap text-sm">{kpi.description}</p><p className="mt-1 line-clamp-1 whitespace-pre-wrap text-xs text-muted-foreground"><span className="font-medium">Target: </span>{kpi.expectation}</p><p className="mt-1 line-clamp-1 whitespace-pre-wrap text-xs text-muted-foreground"><span className="font-medium">Measured by: </span>{kpi.measurement_method}</p></TableCell>
                      <TableCell className="whitespace-nowrap py-3.5"><Badge variant="outline">{kpi.applies_to === "supervisors" ? "Supervisors" : "All staff"}</Badge></TableCell>
                      <TableCell className="py-3.5"><Badge variant={kpi.is_active ? "default" : "secondary"}>{kpi.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                      <TableCell className="py-3.5 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="size-8" aria-label={`Actions for ${kpi.name}`}><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onSelect={() => setViewing(kpi)}><Eye className="mr-2 size-4" />View details</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => openEditor(kpi)}><Pencil className="mr-2 size-4" />Edit KPI</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">Showing {items.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, items.length)} of {items.length} KPIs</p>
              <Pagination className="mx-0 w-auto justify-end">
                <PaginationContent>
                  <PaginationItem><PaginationPrevious href="#" aria-disabled={page === 1} className={page === 1 ? "pointer-events-none opacity-50" : undefined} onClick={(event) => { event.preventDefault(); setPage((value) => Math.max(1, value - 1)); }} /></PaginationItem>
                  {Array.from({ length: pageCount }, (_, index) => index + 1).slice(Math.max(0, page - 2), page + 1).map((value) => <PaginationItem key={value}><PaginationLink href="#" isActive={value === page} onClick={(event) => { event.preventDefault(); setPage(value); }}>{value}</PaginationLink></PaginationItem>)}
                  <PaginationItem><PaginationNext href="#" aria-disabled={page === pageCount} className={page === pageCount ? "pointer-events-none opacity-50" : undefined} onClick={(event) => { event.preventDefault(); setPage((value) => Math.min(pageCount, value + 1)); }} /></PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </section>
        </TabsContent>
      </Tabs>

      {/* Category editor dialog */}
      <Dialog open={!!categoryEditor} onOpenChange={(open) => { if (!open && !saveCategory.isPending) setCategoryEditor(null); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>{categoryEditor?.id ? "Edit KPI category" : "Add KPI category"}</DialogTitle><DialogDescription>Choose the departments that receive this category&apos;s active KPIs when future appraisal periods are opened. Existing appraisal periods keep their saved criteria.</DialogDescription></DialogHeader>
          {categoryEditor && <form onSubmit={(event) => { event.preventDefault(); if (!categoryEditor.name.trim() || !categoryEditor.departments.length) return; saveCategory.mutate(); }} className="space-y-4"><div className="grid gap-2"><Label htmlFor="kpi-category-name">Category name</Label><Input id="kpi-category-name" required maxLength={180} value={categoryEditor.name} onChange={(event) => setCategoryEditor({ ...categoryEditor, name: event.target.value })} placeholder="e.g. Client service" /></div><div className="grid gap-2"><Label htmlFor="kpi-category-description">Description</Label><Textarea id="kpi-category-description" maxLength={3000} rows={3} value={categoryEditor.description} onChange={(event) => setCategoryEditor({ ...categoryEditor, description: event.target.value })} placeholder="Describe the shared performance area." /></div><fieldset className="space-y-2"><legend className="text-sm font-medium">Departments that answer this category</legend><div className="grid gap-2 sm:grid-cols-2">{data.departments.map((value) => <label key={value} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={categoryEditor.departments.includes(value)} onChange={(event) => setCategoryEditor({ ...categoryEditor, departments: event.target.checked ? [...categoryEditor.departments, value] : categoryEditor.departments.filter((department) => department !== value) })} />{value}</label>)}</div></fieldset><div className="flex items-center gap-2"><input id="kpi-category-active" type="checkbox" checked={categoryEditor.is_active} onChange={(event) => setCategoryEditor({ ...categoryEditor, is_active: event.target.checked })} /><Label htmlFor="kpi-category-active">Active for future monthly assessments</Label></div>{categorySaveError && <p role="alert" className="text-sm text-destructive">{categorySaveError}</p>}<DialogFooter><Button type="submit" disabled={saveCategory.isPending || !categoryEditor.departments.length}>{saveCategory.isPending ? "Saving…" : "Save category"}</Button><Button type="button" variant="outline" disabled={saveCategory.isPending} onClick={() => setCategoryEditor(null)}>Cancel</Button></DialogFooter></form>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
