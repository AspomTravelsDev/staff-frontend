import { getWorkFromHomeRequests, getWorkFromHomeStats } from "@/lib/api/work-from-home";
import { WorkFromHomeReviewTable } from "./work-from-home-review-table";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function dateParam(value: string | string[] | undefined): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value ? "" : value;
}

export async function WorkFromHomeContent({ searchParams, embedded = false }: { searchParams: SearchParams; embedded?: boolean }) {
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : "all";
  const search = typeof params.search === "string" ? params.search : "";
  const from = dateParam(params.from);
  const to = dateParam(params.to);
  const page = Math.max(1, Number.parseInt(typeof params.page === "string" ? params.page : "1", 10) || 1);
  const perPage = [10, 25, 50].includes(Number(params.per_page)) ? Number(params.per_page) : 10;

  const [requestsResponse, statsResponse] = await Promise.all([
    getWorkFromHomeRequests({ status, search, from, to, page, per_page: perPage }),
    getWorkFromHomeStats({ from, to }),
  ]);

  const pageData = requestsResponse.success ? requestsResponse.data.data : null;
  const stats = statsResponse.success ? statsResponse.data.data : null;

  return (
    <section className="flex min-w-0 flex-1 flex-col gap-4">
      {!embedded && <header>
        <h2 className="text-2xl font-bold tracking-tight">Work-from-home requests</h2>
        <p className="text-sm text-muted-foreground">Review staff requests and track approved work-from-home days. Approved weekdays count as attended for payroll.</p>
      </header>}
      <WorkFromHomeReviewTable
        initialRequests={pageData?.data || []}
        pagination={{ current_page: pageData?.current_page || 1, last_page: pageData?.last_page || 1, per_page: pageData?.per_page || perPage, total: pageData?.total || 0, from: pageData?.from || null, to: pageData?.to || null }}
        stats={stats || { total: 0, pending: 0, approved: 0, rejected: 0, approved_days: 0 }}
        filters={{ status, search, from, to, per_page: perPage }}
        loadError={!requestsResponse.success || !statsResponse.success}
      />
    </section>
  );
}
