"use client";

import { useState } from "react";
import type { InventoryAssignment } from "@/lib/api/inventory";
import { buildInventoryTasks } from "@/lib/inventory-tasks";
import { AssignmentQueueTable } from "./assignment-queue-table";
import { ClearanceQueueTable } from "./clearance-queue-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNowStrict } from "date-fns";

type Task = ReturnType<typeof buildInventoryTasks>[number];

export function InventoryTasks({ records, isOfficer, isCompliance }: {
  records: InventoryAssignment[];
  isOfficer: boolean;
  isCompliance: boolean;
}) {
  const [view, setView] = useState<"mine" | "waiting">("mine");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Task | null>(null);
  const tasks = buildInventoryTasks(records, { officer: isOfficer, compliance: isCompliance });
  const visible = tasks.filter((task) => (view === "mine" ? task.actionable : !task.actionable) &&
    [task.record.inventoryItem?.name, task.record.inventoryItem?.serialNumber, task.record.assignee?.name, task.action, task.ownerLabel]
      .some((value) => value?.toLowerCase().includes(search.trim().toLowerCase())));

  return <div className="space-y-4">
    <div><h2 className="text-lg font-semibold">Tasks</h2><p className="text-sm text-muted-foreground">Assignment reviews and equipment returns, organised by who needs to act next.</p></div>
    <div className="flex flex-col justify-between gap-3 sm:flex-row">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Task view">
        <Button variant={view === "mine" ? "default" : "outline"} aria-pressed={view === "mine"} onClick={() => setView("mine")}>Needs my action ({tasks.filter((task) => task.actionable).length})</Button>
        <Button variant={view === "waiting" ? "default" : "outline"} aria-pressed={view === "waiting"} onClick={() => setView("waiting")}>Waiting on others ({tasks.filter((task) => !task.actionable).length})</Button>
      </div>
      <Input className="sm:max-w-xs" aria-label="Search tasks" placeholder="Search employee, device, or task…" value={search} onChange={(event) => setSearch(event.target.value)} />
    </div>
    <div className="divide-y rounded-lg border bg-card">
      {!visible.length && <p className="px-4 py-12 text-center text-sm text-muted-foreground">{search ? "No tasks match your search." : view === "mine" ? "You're up to date. No tasks need your action." : "No active tasks are waiting on others."}</p>}
      {visible.map((task) => {
        const record = task.record;
        const date = new Date(record.updatedAt);
        return <div key={record.id} className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center">
          <div className="min-w-0 space-y-1">
            <p className="font-medium">{record.assignee?.name || "Staff member"} <span className="font-normal text-muted-foreground">· {record.inventoryItem?.name || "Device"}</span></p>
            <p className="break-all text-xs text-muted-foreground">{record.inventoryItem?.serialNumber}</p>
            <div className="flex flex-wrap items-center gap-2 text-sm"><span>{task.action}</span><Badge variant="outline">{task.ownerLabel}</Badge><span className="text-xs text-muted-foreground">{Number.isNaN(date.getTime()) ? "" : `Updated ${formatDistanceToNowStrict(date, { addSuffix: true })}`}</span></div>
            {record.complianceDecision === "rejected" && record.complianceNotes && <p className="text-sm">Changes requested: {record.complianceNotes}</p>}
            {record.officerDecision === "rejected" && record.officerNotes && <p className="text-sm">IT feedback: {record.officerNotes}</p>}
          </div>
          {task.actionable ? <Button className="shrink-0 self-start sm:self-auto" size="sm" onClick={() => setSelected(task)}>{task.action}</Button> : <span className="shrink-0 text-sm text-muted-foreground">Waiting on {task.ownerLabel}</span>}
        </div>;
      })}
    </div>
    {selected && selected.owner !== "staff" && (selected.kind === "assignment"
      ? <AssignmentQueueTable key={`${selected.record.id}:${selected.record.status}`} assignments={[]} mode={selected.owner} initialAssignment={selected.record} reviewOnly onReviewClose={() => setSelected(null)} />
      : <ClearanceQueueTable key={`${selected.record.id}:${selected.record.status}`} assignments={[]} mode={selected.owner} initialAssignment={selected.record} reviewOnly onReviewClose={() => setSelected(null)} />)}
  </div>;
}
