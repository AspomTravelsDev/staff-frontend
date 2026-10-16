"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import type { ManagementShortlist as Shortlist } from "@/lib/types/recruitment-pipeline";
import {
  ManagementReviewSheet,
  managementDecisionLabels,
} from "./management-review-sheet";

export function ManagementShortlist({
  initial,
  managementOnly = false,
  initialApplicantId,
}: {
  initial: Shortlist;
  managementOnly?: boolean;
  initialApplicantId?: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(
      initial.candidates.some((c) => c.id === initialApplicantId)
        ? initialApplicantId!
        : null,
    ),
    [search, setSearch] = useState(""),
    [status, setStatus] = useState("all");
  const candidates = initial.candidates.filter(
    (c) =>
      `${c.name} ${c.email ?? ""}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (status === "all" || (c.decision?.decision ?? "pending") === status),
  );
  const score = (v: number | null | undefined) =>
    v == null ? "—" : v.toFixed(1);
  return (
    <div className="space-y-4">
      <Button asChild variant="link" className="h-auto p-0">
        <Link
          href={
            managementOnly
              ? "/hr/recruitment"
              : `/hr/recruitment/${initial.role.id}`
          }
        >
          {managementOnly ? "Back to recruitment" : "Back to applicants"}
        </Link>
      </Button>
      <header className="border-b pb-3">
        <h1 className="text-xl font-semibold">
          {initial.role.title} · Management review
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          {initial.role.department} · {initial.candidates.length} submitted
          candidates · Monthly budget NGN{" "}
          {Number(initial.role.salary_budget_min).toLocaleString("en-NG")}–
          {Number(initial.role.salary_budget_max).toLocaleString("en-NG")}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Review HR’s recommendation, compare assessment results and open the
          supporting evidence.
        </p>
      </header>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">
          Shortlist ({candidates.length})
        </h2>
        <div className="flex flex-wrap gap-2">
          <Input
            aria-label="Search shortlisted candidates"
            placeholder="Search name or email"
            className="w-52"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger
              aria-label="Filter management decisions"
              className="w-44"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All decisions</SelectItem>
              <SelectItem value="pending">Awaiting review</SelectItem>
              {Object.entries(managementDecisionLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="rounded-md border">
        <Table className="text-xs">
          <TableHeader>
            <TableRow>
              {[
                "Candidate",
                "Oral",
                "Written",
                "Practical",
                "Overall",
                "Salary & availability",
                "HR recommendation",
                "Decision",
                "",
              ].map((label, i) => (
                <TableHead key={i}>{label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {candidates.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="min-w-36">
                  <p className="font-medium">{c.name}</p>
                  <p className="mt-0.5 text-muted-foreground">{c.email}</p>
                </TableCell>
                {(["oral_interview", "written_exam", "practical"] as const).map(
                  (s) => (
                    <TableCell key={s} className="tabular-nums">
                      {score(c.scores[s])}
                    </TableCell>
                  ),
                )}
                <TableCell className="font-semibold tabular-nums">
                  {score(c.overall)}
                </TableCell>
                <TableCell className="min-w-40">
                  {c.salary_expectation == null
                    ? "Salary not recorded"
                    : `NGN ${Number(c.salary_expectation).toLocaleString("en-NG")}`}
                  <p className="mt-0.5 text-muted-foreground">
                    {c.notice_period || "Notice not recorded"}
                  </p>
                </TableCell>
                <TableCell className="min-w-40 max-w-64">
                  <p className="line-clamp-2">{c.recommendation}</p>
                </TableCell>
                <TableCell>
                  {c.decision
                    ? managementDecisionLabels[c.decision.decision]
                    : "Awaiting review"}
                  {c.outcome !== "active" && (
                    <p className="mt-0.5 text-muted-foreground">
                      Applicant {c.outcome}
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    aria-label={`Review ${c.name}`}
                    onClick={() => setSelected(c.id)}
                  >
                    Review candidate
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!candidates.length && (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="py-6 text-center text-muted-foreground"
                >
                  {initial.candidates.length
                    ? "No candidates match these filters."
                    : "HR has not submitted any candidates for management review yet."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {selected && (
        <ManagementReviewSheet
          candidateId={selected}
          roleId={initial.role.id}
          onClose={() => {
            setSelected(null);
            if (initialApplicantId)
              router.replace(`/hr/recruitment/${initial.role.id}?review=1`);
          }}
          onSaved={() => router.refresh()}
        />
      )}
    </div>
  );
}
