"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  IconExternalLink,
  IconEye,
  IconCopy,
  IconCheck,
  IconFilter,
} from "@tabler/icons-react";
import { useState } from "react";
import { formatLagosDate } from "@/lib/utils/attendance";

import type { ApplicationListItem } from "../queries";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreateApplicationButton } from "./create-application-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface ApplicationsTableProps {
  applications: ApplicationListItem[];
  totalPages: number;
  currentPage: number;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  processing: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  approved: "bg-green-500/10 text-green-600 dark:text-green-400",
  rejected: "bg-red-500/10 text-red-600 dark:text-red-400",
};

const COUNTRY_LABELS: Record<string, string> = {
  canada: "Canada",
  uk: "United Kingdom",
  schengen: "Schengen",
};

export function ApplicationsTable({
  applications,
  totalPages,
  currentPage,
}: ApplicationsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page"); // Reset to first page on filter change
    router.push(`/visa/applications?${params.toString()}`);
  };

  const handleCopyId = async (id: string) => {
    await navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getPublicUrl = (app: ApplicationListItem) => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    return `${baseUrl}/visa/apply/${app.country}/${app.id}`;
  };

  const formatDate = (dateString: string) => {
    return formatLagosDate(dateString);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <IconFilter className="text-muted-foreground size-4" />
          <Select
            value={searchParams.get("status") || "all"}
            onValueChange={(v) => handleFilterChange("status", v)}
          >
            <SelectTrigger className="w-35">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Select
          value={searchParams.get("country") || "all"}
          onValueChange={(v) => handleFilterChange("country", v)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Countries</SelectItem>
            <SelectItem value="canada">Canada</SelectItem>
            <SelectItem value="uk">United Kingdom</SelectItem>
            <SelectItem value="schengen">Schengen</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Application ID</TableHead>
              <TableHead>Applicant</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-25">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center">
                  <p className="text-muted-foreground">No applications found</p>
                  <CreateApplicationButton
                    variant="outline"
                    className="mt-4"
                    label="Start new application"
                    showIcon={false}
                  />
                </TableCell>
              </TableRow>
            ) : (
              applications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted rounded px-1.5 py-0.5 text-xs">
                        {app.id.slice(0, 8)}...
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6"
                        onClick={() => handleCopyId(app.id)}
                      >
                        {copiedId === app.id ? (
                          <IconCheck className="size-3" />
                        ) : (
                          <IconCopy className="size-3" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {app.applicant_name || "Not provided"}
                      </div>
                      {app.applicant_email && (
                        <div className="text-muted-foreground text-xs">
                          {app.applicant_email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{COUNTRY_LABELS[app.country]}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn("capitalize", STATUS_COLORS[app.status])}
                    >
                      {app.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(app.created_at)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(app.updated_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        asChild
                      >
                        <Link href={`/visa/applications/${app.id}`}>
                          <IconEye className="size-4" />
                        </Link>
                      </Button>
                      {app.status === "draft" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          asChild
                        >
                          <a
                            href={getPublicUrl(app)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <IconExternalLink className="size-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={`/visa/applications?${new URLSearchParams({
                  ...Object.fromEntries(searchParams),
                  page: String(Math.max(1, currentPage - 1)),
                })}`}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  href={`/visa/applications?${new URLSearchParams({
                    ...Object.fromEntries(searchParams),
                    page: String(page),
                  })}`}
                  isActive={page === currentPage}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href={`/visa/applications?${new URLSearchParams({
                  ...Object.fromEntries(searchParams),
                  page: String(Math.min(totalPages, currentPage + 1)),
                })}`}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
