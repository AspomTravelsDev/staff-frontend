"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { getTaskTrackerColleagues, reassignTask } from "@/lib/api/task-tracker";
import type { Colleague, TaskTrackerItem } from "@/lib/types/task-tracker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function ReassignTaskDialog({ task, open, onOpenChange, onUpdated }: {
  task: TaskTrackerItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (task: TaskTrackerItem) => void;
}) {
  const [colleagues, setColleagues] = useState<Colleague[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [search, setSearch] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const self = task.can_review ? task.assigned_by : undefined;
  const selected = assigneeId === self?.id ? self : colleagues.find(person => person.id === assigneeId);

  useEffect(() => {
    if (!open) return;
    let active = true;
    getTaskTrackerColleagues().then(result => {
      if (!active) return;
      if (result.success) setColleagues(result.data.data.filter(person => person.id !== task.user_id));
      else setLoadError(true);
    }).catch(() => { if (active) setLoadError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [open, task.user_id, retry]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!assigneeId || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      const result = await reassignTask(task.id, { assigned_to_user_id: assigneeId, previous_user_id: task.user_id, note: note.trim() || undefined });
      if (result.success) {
        onOpenChange(false);
        onUpdated(result.data.data);
        toast.success(result.data.message || "Task reassigned");
      } else toast.error(result.error.error || "Could not reassign this task. Please try again.");
    } catch { toast.error("Could not reassign this task. Please try again."); }
    finally { savingRef.current = false; setSaving(false); }
  };

  const filtered = colleagues.filter(person => `${person.name} ${person.department || ""} ${person.email}`.toLowerCase().includes(search.trim().toLowerCase()));
  return <Dialog open={open} onOpenChange={next => { if (!savingRef.current) onOpenChange(next); }}>
    <DialogContent className="sm:max-w-lg max-h-[85dvh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Reassign task</DialogTitle>
        <DialogDescription>Choose who will take over. All previous comments and task history stay with the task.</DialogDescription>
      </DialogHeader>
      <form onSubmit={save} className="space-y-4">
        <div className="space-y-1 rounded-lg border bg-muted/30 p-3">
          <p className="font-medium break-words">{task.title}</p>
          <p className="text-sm text-muted-foreground">Current assignee: {task.user?.name || "Staff member unavailable"}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`reassign-search-${task.id}`}>Find a colleague</Label>
          <Input id={`reassign-search-${task.id}`} placeholder="Search name, department or email" value={search} onChange={event => setSearch(event.target.value)} disabled={saving || loading} />
          <Label htmlFor={`reassign-owner-${task.id}`}>New assignee</Label>
          <Select value={assigneeId} onValueChange={setAssigneeId} disabled={saving}>
            <SelectTrigger id={`reassign-owner-${task.id}`} className="w-full"><SelectValue placeholder={loading ? "Loading colleagues…" : "Choose an assignee"}><span>{selected ? `${selected.id === self?.id ? "Myself" : selected.name}${selected.department ? ` · ${selected.department}` : ""}` : ""}</span></SelectValue></SelectTrigger>
            <SelectContent className="max-h-64">
              {self && <SelectItem value={self.id}>Myself</SelectItem>}
              {filtered.map(person => <SelectItem key={person.id} value={person.id}>{person.name}{person.department ? ` · ${person.department}` : ""}</SelectItem>)}
              {!loading && !loadError && !filtered.length && <p className="p-3 text-sm text-muted-foreground">No matching colleagues.</p>}
            </SelectContent>
          </Select>
          {loadError && <div role="alert" className="text-sm"><p className="text-destructive">Could not load colleagues.</p><Button type="button" variant="link" disabled={saving} onClick={() => { setLoading(true); setLoadError(false); setRetry(value => value + 1); }}>Try again</Button></div>}
        </div>
        <div className="space-y-2">
          <Label htmlFor={`reassign-note-${task.id}`}>Handover note (optional)</Label>
          <Textarea id={`reassign-note-${task.id}`} value={note} onChange={event => setNote(event.target.value)} maxLength={1000} rows={3} disabled={saving} placeholder="Share progress, next steps or why the task is moving." />
        </div>
        <p className="text-sm text-muted-foreground">The new assignment starts as Pending with the same deadline. Any current submission or extension request stays in history. {task.assigned_by && assigneeId !== task.assigned_by_user_id ? `${task.assigned_by.name} remains the assigner and approves completion.` : assigneeId === task.assigned_by_user_id ? `This becomes ${self ? "your" : `${task.assigned_by?.name || "the assigner"}’s`} personal task.` : "You remain the assigner and approve completion."}{task.recurrence ? " Repeating is turned off when reassigned." : ""}</p>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" disabled={saving || !assigneeId}>{saving ? "Reassigning…" : "Reassign task"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
