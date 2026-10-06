"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Loader2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import type { ContentAssignment, ContentCollection, ContentDraft } from "@/types/content-collections";
import { addContentAssignment, updateContentAssignment, changeContentDeadline, getContentStaff } from "@/lib/api/content-collections";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { deadlineInput, deadlineISO, deadlineLabel } from "./content-helpers";

export function ContentCollectionControls({ collection, assignment, closed }: { collection: ContentCollection; assignment?: ContentAssignment; closed: boolean }) {
  const cache = useQueryClient();
  const [editor, setEditor] = useState<ContentDraft['assignments'][number] | null>(null);
  const [deadline, setDeadline] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const staff = useQuery({ queryKey: ["content-staff"], queryFn: getContentStaff, enabled: !!editor && !assignment });

  async function save(action: () => Promise<ContentCollection>, message: string) {
    setBusy(true);
    try {
      const updated = await action();
      cache.setQueryData<ContentCollection[]>(["content-collections"], previous => previous?.map(item => item.id === updated.id ? updated : item));
      setEditor(null);
      setDeadline(null);
      toast.success(message);
      await Promise.all([
        cache.invalidateQueries({ queryKey: ["content-collections"] }),
        cache.invalidateQueries({ queryKey: ["my-content-ideas"] }),
        cache.invalidateQueries({ queryKey: ["notifications"] }),
      ]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save changes");
    } finally {
      setBusy(false);
    }
  }

  if (!collection.published_at) return null;
  return <>
    {assignment ? <Button variant="outline" size="sm" disabled={closed} title={closed ? "Change the deadline to reopen this collection first" : undefined} onClick={() => setEditor({ user_id: assignment.user_id, theme: assignment.theme, brief: assignment.brief, required_count: assignment.required_count })}><Pencil className="size-3.5" />Edit assignment</Button> : <>
      <Button variant="outline" size="sm" onClick={() => setDeadline(deadlineInput(collection.deadline))}><CalendarDays className="size-3.5" />Change deadline</Button>
      <Button size="sm" disabled={closed || collection.assignments.length >= 200} title={closed ? "Change the deadline to reopen this collection first" : undefined} onClick={() => setEditor({ user_id: "", theme: "", brief: "", required_count: 1 })}><Plus className="size-3.5" />Add assignment</Button>
    </>}
    <Dialog open={!!editor} onOpenChange={open => { if (!open && !busy) setEditor(null); }}><DialogContent className="min-w-0 max-h-[90dvh] overflow-y-auto overflow-x-hidden sm:max-w-xl"><DialogHeader className="min-w-0 pr-6"><DialogTitle>{assignment ? "Edit assignment" : "Add staff assignment"}</DialogTitle><DialogDescription>{assignment ? "Adjust the brief or required idea count. Submitted ideas are kept." : "This assignment becomes visible immediately and the staff member will be notified."}</DialogDescription></DialogHeader>
      {editor && <form className="min-w-0 space-y-4" onSubmit={event => { event.preventDefault(); save(() => assignment ? updateContentAssignment(collection.id, assignment.id, { brief: editor.brief, required_count: editor.required_count }) : addContentAssignment(collection.id, editor), assignment ? "Assignment updated and staff notified" : "Assignment added and staff notified"); }}>
        {assignment ? <div className="rounded-lg bg-muted/40 p-3 text-sm [overflow-wrap:anywhere]">{assignment.user?.name} · {assignment.theme}</div> : <>
          <div className="min-w-0 space-y-2"><Label htmlFor="new-assignment-staff">Staff member</Label><Select required value={editor.user_id} onValueChange={user_id => setEditor({ ...editor, user_id })}><SelectTrigger id="new-assignment-staff" className="h-9 w-full min-w-0"><SelectValue placeholder={staff.isPending ? "Loading staff…" : "Select staff"} /></SelectTrigger><SelectContent>{staff.data?.map(person => <SelectItem key={person.id} value={person.id}>{person.name}{person.department ? ` · ${person.department}` : ""}</SelectItem>)}</SelectContent></Select>{staff.isError && <p role="alert" className="text-sm text-destructive">Unable to load staff. <Button type="button" variant="link" onClick={() => staff.refetch()}>Retry</Button></p>}</div>
          <div className="space-y-2"><Label htmlFor="new-assignment-theme">Theme</Label><Input id="new-assignment-theme" required maxLength={255} placeholder="e.g. Flights" value={editor.theme} onChange={e => setEditor({ ...editor, theme: e.target.value })} /></div>
        </>}
        <div className="space-y-2"><Label htmlFor={assignment ? `assignment-count-${assignment.id}` : "new-assignment-count"}>Required ideas</Label><Input id={assignment ? `assignment-count-${assignment.id}` : "new-assignment-count"} type="number" required min={Math.max(1, assignment?.ideas.length ?? 0)} max={100} value={editor.required_count || ""} onChange={e => setEditor({ ...editor, required_count: Number(e.target.value) })} />{assignment && <p className="text-xs text-muted-foreground">{assignment.ideas.length} ideas already submitted. Increasing the count requests additional ideas.</p>}</div>
        <div className="min-w-0 space-y-2"><Label htmlFor={assignment ? `assignment-brief-${assignment.id}` : "new-assignment-brief"}>Brief</Label><Textarea id={assignment ? `assignment-brief-${assignment.id}` : "new-assignment-brief"} className="field-sizing-fixed min-h-32 min-w-0 [overflow-wrap:anywhere]" required maxLength={5000} value={editor.brief} onChange={e => setEditor({ ...editor, brief: e.target.value })} /></div>
        <p className="text-xs text-muted-foreground">Shared deadline: {deadlineLabel(collection.deadline)}. {assignment ? "The staff member will be notified of changes." : "For more ideas on an existing theme, edit that assignment’s count."}</p>
        <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={() => setEditor(null)}>Cancel</Button><Button disabled={busy || (!assignment && !staff.data)}>{busy && <Loader2 className="size-3.5 animate-spin" />}{busy ? "Saving…" : assignment ? "Save changes" : "Add assignment"}</Button></DialogFooter>
      </form>}
    </DialogContent></Dialog>
    <Dialog open={deadline !== null} onOpenChange={open => { if (!open && !busy) setDeadline(null); }}><DialogContent className="min-w-0 overflow-x-hidden"><DialogHeader><DialogTitle>Change shared deadline</DialogTitle><DialogDescription>This applies to every assignment in the collection. Staff will be notified. A future deadline reopens a closed collection.</DialogDescription></DialogHeader>{deadline !== null && <form className="min-w-0 space-y-4" onSubmit={e => { e.preventDefault(); save(() => changeContentDeadline(collection.id, deadlineISO(deadline)), "Deadline changed and staff notified"); }}><div className="space-y-2"><Label htmlFor="workspace-deadline">New deadline (WAT)</Label><Input id="workspace-deadline" type="datetime-local" required value={deadline} onChange={e => setDeadline(e.target.value)} /></div><p className="text-xs text-muted-foreground">Choose a future date and time. Moving it earlier gives staff less time to submit.</p><DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={() => setDeadline(null)}>Cancel</Button><Button disabled={busy}>{busy ? "Saving…" : "Save deadline"}</Button></DialogFooter></form>}</DialogContent></Dialog>
  </>;
}
