import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PerformanceResultFilters, PerformanceResults } from "@/lib/types/performance-result";
import { PerformanceTable } from "./performance-table";
import { PerformanceMetric } from "@/components/performance/performance-page-header";
import { formatPerformanceMonth } from "@/lib/performance-review";

const selectClass = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function PerformanceWorkspace({ initialData: data, filters }: { initialData: PerformanceResults; filters: PerformanceResultFilters }) {
  const filtered = Boolean(filters.search || filters.department || filters.month || filters.type);
  const pageHref = (page: number) => {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.department) params.set("department", filters.department);
    if (filters.month) params.set("month", filters.month);
    if (filters.type) params.set("type", filters.type);
    params.set("page", String(page));
    return `/hr/performance?${params}`;
  };

  return <div className="space-y-6">
    <form action="/hr/performance" method="get" key={JSON.stringify(filters)} className="space-y-4 rounded-xl border bg-card p-4 shadow-sm sm:p-5">
      <div className="mb-1"><h2 className="font-semibold">Find a completed appraisal</h2><p className="mt-1 text-sm text-muted-foreground">Filter the completed archive by person, department, or appraisal period.</p></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2"><Label htmlFor="result-search">Staff name or ID</Label><Input id="result-search" name="search" defaultValue={filters.search} maxLength={180} placeholder="Search completed results" /></div>
        <div className="space-y-2"><Label htmlFor="result-department">Department</Label><select id="result-department" name="department" className={selectClass} defaultValue={filters.department || ""}><option value="">All departments</option>{data.departments.map(name => <option key={name}>{name}</option>)}</select></div>
        <div className="space-y-2"><Label htmlFor="result-type">Appraisal type</Label><Select name="type" defaultValue={filters.type || "all"}><SelectTrigger id="result-type" className={selectClass}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All types</SelectItem><SelectItem value="monthly_kpi">Monthly KPI</SelectItem><SelectItem value="appraisal">Appraisal</SelectItem></SelectContent></Select></div>
        <div className="space-y-2"><Label htmlFor="result-month">Appraisal period</Label><select id="result-month" name="month" className={selectClass} defaultValue={filters.month || ""}><option value="">All periods</option>{data.months.map(month => <option key={month} value={month}>{formatPerformanceMonth(month)}</option>)}</select></div>
      </div>
      <div className="flex flex-wrap gap-3"><Button type="submit">Apply filters</Button><Button variant="outline" asChild><Link href="/hr/performance">Clear filters</Link></Button></div>
    </form>
    <section aria-label="Results summary" className="grid grid-cols-2 gap-3 lg:grid-cols-3"><PerformanceMetric label="Completed" value={data.stats.completed} detail="Submitted appraisals" tone="primary" /><PerformanceMetric label="Average score" value={data.stats.average_score === null ? "—" : `${data.stats.average_score.toFixed(2)} / 5`} detail="Across completed results" /><PerformanceMetric label="Departments" value={data.stats.departments} detail="Represented in archive" /></section>
    <section className="space-y-4" aria-labelledby="results-heading">
      <h2 id="results-heading" className="text-lg font-semibold">Completed results</h2>
      {!data.items.length ? <div className="rounded-xl border border-dashed px-6 py-12 text-center"><h3 className="font-medium">{filtered ? "No completed results match these filters" : "No completed appraisals yet"}</h3><p className="mt-2 text-sm text-muted-foreground">{filtered ? "Try another staff search, department or period." : "Results appear after MP completes each appraisal. HR cannot read unfinished assessments."}</p></div> : <PerformanceTable results={data.items} />}
    </section>
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className="text-muted-foreground">{data.pagination.total} completed results · Page {data.pagination.page} of {Math.max(1, data.pagination.total_pages)}</p>
      <nav className="flex gap-2" aria-label="Completed results pagination">
        {data.pagination.page > 1 ? <Button variant="outline" asChild><Link href={pageHref(data.pagination.page - 1)}>Previous</Link></Button> : <Button variant="outline" disabled>Previous</Button>}
        {data.pagination.page < data.pagination.total_pages ? <Button variant="outline" asChild><Link href={pageHref(data.pagination.page + 1)}>Next</Link></Button> : <Button variant="outline" disabled>Next</Button>}
      </nav>
    </div>
  </div>;
}
