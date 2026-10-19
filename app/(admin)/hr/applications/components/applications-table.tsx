"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { OnboardingApplication } from "@/lib/types/hr";
import {
  filterApplications,
  paginateApplications,
  type ApplicationSort,
} from "@/lib/utils/application-list";
import { formatLagosDate } from "@/lib/utils/attendance";
import { ApplicationActions } from "./application-actions";
import { ApplicationExportButton } from "./application-export-button";

const statusLabels = {
  pending: "Pending",
  invited: "Invited",
  in_progress: "In progress",
  completed: "Completed",
};

export function ApplicationsTable({
  applications,
}: {
  applications: OnboardingApplication[];
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [position, setPosition] = useState("all");
  const [sort, setSort] = useState<ApplicationSort>("newest");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const positions = useMemo(
    () =>
      [
        ...new Set(
          applications.map((app) => app.position_title).filter(Boolean),
        ),
      ].sort((a, b) => a.localeCompare(b)),
    [applications],
  );
  const filtered = useMemo(
    () => filterApplications(applications, { search, status, position, sort }),
    [applications, search, status, position, sort],
  );
  const result = paginateApplications(filtered, page, pageSize);
  const hasFilters = !!search || status !== "all" || position !== "all";
  const reset = () => {
    setSearch("");
    setStatus("all");
    setPosition("all");
    setPage(1);
  };
  const statusBadge = (app: OnboardingApplication) => (
    <Badge
      variant={
        app.status === "completed"
          ? "default"
          : app.status === "in_progress"
            ? "secondary"
            : "outline"
      }
    >
      {statusLabels[app.status] || app.status}
    </Badge>
  );

  return (
    <section className="space-y-3" aria-label="Onboarding applications">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:min-w-60 sm:flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground"
          />
          <Input
            aria-label="Search applications"
            placeholder="Search name, email, reference or position…"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className="h-9 pl-9 pr-9"
          />
          {search && (
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-0 top-0 size-9"
              aria-label="Clear search"
              onClick={() => {
                setSearch("");
                setPage(1);
              }}
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
        >
          <SelectTrigger
            aria-label="Filter by status"
            className="h-9 w-full sm:w-36"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {Object.entries(statusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={position}
          onValueChange={(value) => {
            setPosition(value);
            setPage(1);
          }}
        >
          <SelectTrigger
            aria-label="Filter by position"
            className="h-9 w-full sm:w-48"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All positions</SelectItem>
            {positions.map((value) => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={sort}
          onValueChange={(value) => {
            setSort(value as ApplicationSort);
            setPage(1);
          }}
        >
          <SelectTrigger
            aria-label="Sort applications"
            className="h-9 w-full sm:w-40"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="name_asc">Name: A–Z</SelectItem>
            <SelectItem value="name_desc">Name: Z–A</SelectItem>
            <SelectItem value="position">Position: A–Z</SelectItem>
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button size="sm" variant="ghost" onClick={reset}>
            Clear filters
          </Button>
        )}
        {filtered.length > 0 && (
          <div title="Export all matching applications, across every page">
            <ApplicationExportButton applications={filtered} />
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {filtered.length}{" "}
        {filtered.length === 1 ? "application" : "applications"}
        {hasFilters ? ` matching, out of ${applications.length}` : ""}
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-lg border py-10 text-center">
          <p className="text-sm font-medium">
            {applications.length === 0
              ? "No applications yet"
              : "No matching applications"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {applications.length === 0
              ? "Create an onboarding application to get started."
              : "Try a different search or clear the filters."}
          </p>
          {hasFilters ? (
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={reset}
            >
              Clear filters
            </Button>
          ) : (
            <Button asChild size="sm" className="mt-3">
              <Link href="/hr/applications/new">Create Application</Link>
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-2 md:hidden">
            {result.rows.map((app) => (
              <div key={app.id} className="space-y-2 rounded-lg border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      href={`/hr/applications/${app.id}`}
                      className="break-words text-sm font-medium hover:underline"
                    >
                      {app.applicant_name || app.applicant_email.split("@")[0]}
                    </Link>
                    <p className="break-all text-xs text-muted-foreground">
                      {app.applicant_email}
                    </p>
                  </div>
                  {statusBadge(app)}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 text-xs text-muted-foreground">
                    <p className="break-words">{app.position_title}</p>
                    <p>{formatLagosDate(app.invited_at)}</p>
                  </div>
                  <ApplicationActions
                    id={app.id}
                    step={app.form_data?.currentStep ?? 1}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="hidden overflow-x-auto rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Invited</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.rows.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell>
                      <Link
                        href={`/hr/applications/${app.id}`}
                        className="font-medium hover:underline"
                      >
                        {app.applicant_name ||
                          app.applicant_email.split("@")[0]}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {app.applicant_email}
                      </p>
                    </TableCell>
                    <TableCell>{app.position_title}</TableCell>
                    <TableCell>{statusBadge(app)}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatLagosDate(app.invited_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <ApplicationActions
                        id={app.id}
                        step={app.form_data?.currentStep ?? 1}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
        <p className="text-xs text-muted-foreground" aria-live="polite">
          Showing {result.from}–{result.to} of {filtered.length}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Rows per page</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => {
              setPageSize(Number(value));
              setPage(1);
            }}
          >
            <SelectTrigger aria-label="Rows per page" className="h-8 w-18">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 25, 50].map((value) => (
                <SelectItem key={value} value={String(value)}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="px-1 text-xs tabular-nums">
            Page {result.page} of {result.totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            aria-label="Previous page"
            disabled={result.page <= 1}
            onClick={() => setPage(result.page - 1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            aria-label="Next page"
            disabled={result.page >= result.totalPages}
            onClick={() => setPage(result.page + 1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
