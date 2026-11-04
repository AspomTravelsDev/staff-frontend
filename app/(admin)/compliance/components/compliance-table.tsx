"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { MoreHorizontal, Trash2, Eye, MessagesSquare, Scale, ShieldCheck, Clock3, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { DetailsTableRow } from "@/components/ui/details-table-row";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { deleteComplianceIssue, type ComplianceIssue } from "@/lib/api/compliance";
import { ComplianceDetailsDialog } from "./compliance-details-dialog";

type QueryView = "details" | "response" | "outcome";
export function ComplianceTable({ issues, isAdmin = false }: { issues: ComplianceIssue[]; isAdmin?: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const linkedId = params.get("id"), linkedView = params.get("view");
  const pathname = usePathname();
  const [selected, setSelected] = useState<{ id: string; view: QueryView } | null>(() =>
    linkedId ? { id: linkedId, view: linkedView === "responses" ? "response" : "details" } : null,
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  function show(id: string, view: QueryView) { setSelected({ id, view }); }
  function close() {
    setSelected(null);
    if (linkedId) {
      const next = new URLSearchParams(params.toString());
      next.delete("id"); next.delete("view");
      router.replace(next.size ? `${pathname}?${next}` : pathname, { scroll: false });
    } else router.refresh();
  }
  return <section className="space-y-3" aria-label="Compliance queries">
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><ShieldCheck className="size-4" /></div>
        <div><h2 className="text-base font-semibold">Compliance queries</h2><p className="mt-0.5 text-xs text-muted-foreground">Select a row to view details and evidence.</p></div>
      </div>
      <Badge variant="secondary" className="shrink-0 tabular-nums">{issues.length} {issues.length === 1 ? "query" : "queries"}</Badge>
    </div>
    <div className="overflow-hidden rounded-lg border bg-card">
      <Table>
        <TableHeader className="bg-muted/50"><TableRow>
          <TableHead>Staff / department</TableHead><TableHead>Query</TableHead><TableHead>Severity</TableHead><TableHead>Status / outcome</TableHead><TableHead>Correction</TableHead><TableHead>Incident date</TableHead><TableHead className="text-right">Actions</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {!issues.length && <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No queries match these filters.</TableCell></TableRow>}
          {issues.map(issue => {
            const canDelete = isAdmin && issue.status === "open" && !issue.latest_comment && !issue.comments_count;
            const hasResponses = Boolean(issue.latest_comment || issue.comments_count);
            const name = issue.user_name || issue.user?.name || "Staff member";
            const initials = name.split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
            const severityTone = {
              low: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300",
              medium: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
              high: "border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-300",
              critical: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300",
            }[issue.severity];
            const correctionTone = issue.correction_status === "completed" ? "text-emerald-700 dark:text-emerald-400" : issue.correction_status === "overdue" ? "text-rose-700 dark:text-rose-400" : issue.correction_status === "due_soon" ? "text-amber-800 dark:text-amber-400" : "text-muted-foreground";
            return <DetailsTableRow
              key={issue.id}
              detailLabel={`View query details for ${name}`}
              onOpenDetails={() => show(issue.id, "details")}
              className={issue.has_new_replies ? "bg-primary/5" : undefined}
            >
              <TableCell className="min-w-52 py-3.5">
                <div className="flex items-center gap-3">
                  <Avatar className="size-9 shrink-0 border"><AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">{initials}</AvatarFallback></Avatar>
                  <div className="min-w-0"><p className="font-medium">{name}</p><p className="mt-0.5 text-xs text-muted-foreground">{issue.user_department || issue.user?.department || "Department not recorded"}</p></div>
                </div>
              </TableCell>
              <TableCell className="min-w-60 max-w-sm py-3.5">
                <div className="flex items-center gap-2"><p className="font-medium">{issue.type}</p>{issue.has_new_replies && <span className="size-2 shrink-0 rounded-full bg-primary" aria-label="Unread update" />}</div>
                <p className="mt-1 line-clamp-1 whitespace-normal text-xs text-muted-foreground">{issue.description}</p>
              </TableCell>
              <TableCell><Badge variant="outline" className={`gap-1.5 capitalize ${severityTone}`}><span className="size-1.5 rounded-full bg-current" />{issue.severity}</Badge></TableCell>
              <TableCell>
                <Badge variant="outline" className={issue.status === "open" ? "gap-1.5 border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300" : issue.outcome === "Resolved (No Action)" ? "gap-1.5 border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300" : "gap-1.5 bg-muted/50 text-foreground"}>
                  {issue.status === "open" ? <Clock3 className="size-3" /> : <CheckCircle2 className="size-3" />}
                  {issue.status === "open" ? "Awaiting review" : issue.outcome === "Give Occurrence" ? "Verified occurrence" : issue.outcome || "Closed"}
                </Badge>
                {issue.status === "closed" && issue.outcome !== "Resolved (No Action)" && <p className="mt-1 text-xs text-muted-foreground">{issue.points ?? 0} occurrence(s)</p>}
              </TableCell>
              <TableCell className="text-xs">{issue.correction_due_date ? <div className="space-y-1"><p className={`font-medium capitalize ${correctionTone}`}>{issue.correction_status?.replaceAll("_", " ") || "Pending"}</p><p className="whitespace-nowrap text-muted-foreground">Due {format(new Date(`${issue.correction_due_date}T12:00:00`), "dd MMM yyyy")}</p></div> : <span className="text-muted-foreground">Not required</span>}</TableCell>
              <TableCell className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">{issue.occurrence_date ? format(new Date(issue.occurrence_date), "dd MMM yyyy") : "—"}</TableCell>
              <TableCell className="text-right" data-row-click-ignore>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="size-8" aria-label={`Actions for ${name}`}><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48" data-row-click-ignore>
                    <DropdownMenuLabel>Query actions</DropdownMenuLabel>
                    <DropdownMenuItem onSelect={() => show(issue.id, "details")}><Eye className="mr-2 size-4" />View details</DropdownMenuItem>
                    {(issue.status === "open" || hasResponses) && <DropdownMenuItem onSelect={() => show(issue.id, "response")}><MessagesSquare className="mr-2 size-4" />{!isAdmin && issue.status === "open" ? "Respond to query" : "View responses"}</DropdownMenuItem>}
                    {isAdmin && issue.status === "open" && <DropdownMenuItem onSelect={() => show(issue.id, "outcome")}><Scale className="mr-2 size-4" />Choose outcome</DropdownMenuItem>}
                    {canDelete && <><DropdownMenuSeparator /><DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setDeletingId(issue.id)}><Trash2 className="mr-2 size-4" />Delete query</DropdownMenuItem></>}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </DetailsTableRow>;

          })}
        </TableBody>
      </Table>
    </div>
    {selected && <ComplianceDetailsDialog key={selected.id + selected.view} issueId={selected.id} open onOpenChange={value => { if (!value) close(); }} isAdmin={isAdmin} mode={selected.view} onChooseOutcome={() => show(selected.id, "outcome")} />}
    <AlertDialog open={Boolean(deletingId)} onOpenChange={value => { if (!value && !deleting) setDeletingId(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete query?</AlertDialogTitle><AlertDialogDescription>This permanently deletes the query and cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel><AlertDialogAction disabled={deleting} onClick={async event => {
      event.preventDefault(); if (!deletingId) return; setDeleting(true);
      try { const result = await deleteComplianceIssue(deletingId); if (!result.success) { toast.error(result.error || "Unable to delete query"); return; } setDeletingId(null); toast.success("Query deleted"); router.refresh(); }
      catch { toast.error("Unable to delete query"); } finally { setDeleting(false); }
    }}>{deleting ? "Deleting…" : "Delete query"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </section>;
}
