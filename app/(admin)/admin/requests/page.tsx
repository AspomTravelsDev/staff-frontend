import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { userHasAnyRole } from "@/types/user-types";
import { RequestsTable } from "./components/requests-table";
import { RequestsFilters } from "./components/requests-filters";
import { StatsCards } from "./components/stats-cards";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getRequests, getRequestStats } from "@/lib/api/requests";

type RequestSearchParams = {
  page?: string | string[];
  limit?: string | string[];
  search?: string | string[];
  status?: string | string[];
  category?: string | string[];
  priority?: string | string[];
};

const DEFAULT_LIMIT = 50;

const parsePositiveInt = (
  value: string | string[] | undefined,
  fallback: number,
) => {
  if (typeof value !== "string") return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<RequestSearchParams>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!userHasAnyRole(user, ["super", "it", "admin", "compliance", "office-operations"])) {
    redirect("/dashboard");
  }

  const page = parsePositiveInt(params.page, 1);
  const limit = Math.min(parsePositiveInt(params.limit, DEFAULT_LIMIT), 100);
  const search = typeof params.search === "string" ? params.search : undefined;
  const status = typeof params.status === "string" ? params.status : undefined;
  const category = typeof params.category === "string" ? params.category : undefined;
  const priority = typeof params.priority === "string" ? params.priority : undefined;

  const buildHref = (nextPage: number, nextLimit: number = limit) => {
    const query = new URLSearchParams();
    query.set("page", String(nextPage));
    query.set("limit", String(nextLimit));
    if (search) query.set("search", search);
    if (status) query.set("status", status);
    if (category) query.set("category", category);
    if (priority) query.set("priority", priority);
    return `/admin/requests?${query.toString()}`;
  };

  const [requestsData, stats] = await Promise.all([
    getRequests({ page, limit, search, status, category, priority }),
    getRequestStats(),
  ]);

  const requests = requestsData?.items ?? [];
  const pagination = requestsData?.pagination ?? {
    page: 1,
    limit,
    total: 0,
    total_pages: 0,
  };

  const currentPage = pagination.page || 1;
  const totalPages = Math.max(1, pagination.total_pages || 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">General Requests</h1>
        <p className="text-muted-foreground">
          Manage and track all internal requests from employees.
        </p>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Requests Filters */}
      <RequestsFilters />

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Requests</CardTitle>
          <CardDescription>
            Showing {requests.length} of {pagination.total} requests
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Rows:</span>
              {[20, 50, 100].map((rowLimit) => (
                <Button
                  key={rowLimit}
                  variant={limit === rowLimit ? "default" : "outline"}
                  size="sm"
                  asChild
                >
                  <Link href={buildHref(1, rowLimit)}>{rowLimit}</Link>
                </Button>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                asChild={currentPage > 1}
              >
                {currentPage > 1 ? (
                  <Link href={buildHref(currentPage - 1)}>Previous</Link>
                ) : (
                  <span>Previous</span>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                asChild={currentPage < totalPages}
              >
                {currentPage < totalPages ? (
                  <Link href={buildHref(currentPage + 1)}>Next</Link>
                ) : (
                  <span>Next</span>
                )}
              </Button>
            </div>
          </div>

          <RequestsTable requests={requests} />
        </CardContent>
      </Card>
    </div>
  );
}
