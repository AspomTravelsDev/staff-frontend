import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PerformanceResultFilters, PerformanceResults } from "@/lib/types/performance-result";
import { PerformanceStatsCards } from "./performance-stats";
import { PerformanceTable } from "./performance-table";

const selectClass = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function PerformanceWorkspace({ initialData: data, filters }: { initialData: PerformanceResults; filters: PerformanceResultFilters }) {
  const filtered = Boolean(filters.search || filters.department || filters.month);
  const pageHref = (page: number) => {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.department) params.set("department", filters.department);
    if (filters.month) params.set("month", filters.month);
    params.set("page", String(page));
    return `/hr/performance?${params}`;
  };

  return <div className="space-y-6">
    <form action="/hr/performance" method="get" key={JSON.stringify(filters)} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2"><Label htmlFor="result-search">Staff name or ID</Label><Input id="result-search" name="search" defaultValue={filters.search} maxLength={180} placeholder="Search completed results" /></div>
        <div className="space-y-2"><Label htmlFor="result-department">Department</Label><select id="result-department" name="department" className={selectClass} defaultValue={filters.department || ""}><option value="">All departments</option>{data.departments.map(name => <option key={name}>{name}</option>)}</select></div>
        <div className="space-y-2"><Label htmlFor="result-month">Appraisal month</Label><select id="result-month" name="month" className={selectClass} defaultValue={filters.month || ""}><option value="">All periods</option>{data.months.map(month => <option key={month}>{month}</option>)}</select></div>
      </div>
      <div className="flex flex-wrap gap-3"><Button type="submit">Apply filters</Button><Button variant="outline" asChild><Link href="/hr/performance">Clear filters</Link></Button></div>
    </form>
    <PerformanceStatsCards stats={data.stats} />
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
