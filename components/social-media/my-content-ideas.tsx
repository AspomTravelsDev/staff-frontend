"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarDays, CheckCircle2, ClipboardList, Lightbulb, Loader2, Plus } from "lucide-react";
import { getMyContentAssignments, getMyOpenContentIdeas, saveContentIdea } from "@/lib/api/content-collections";
import { StatsCard } from "@/components/stats-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRoleNotifications } from "@/lib/api/hooks/use-notifications";
import { AssignmentProgress, deadlineLabel } from "./content-helpers";
import { ContentIdeasTable } from "./content-ideas-table";
import { MyOpenIdeasBank, OpenIdeaDialog } from "./open-content-ideas";

export function MyContentIdeas() {
  const cache = useQueryClient();
  const query = useQuery({ queryKey: ["my-content-ideas"], queryFn: getMyContentAssignments, refetchInterval: 60000 });
  const openQuery = useQuery({ queryKey: ["my-open-content-ideas"], queryFn: getMyOpenContentIdeas });
  const { data: notifications } = useRoleNotifications();
  const assignedBadgeRaw = notifications?.contentIdeas;
  const assignedBadge = typeof assignedBadgeRaw === "object" && assignedBadgeRaw !== null ? assignedBadgeRaw.count : (assignedBadgeRaw ?? 0);
  const [tab, setTab] = useState("assigned");
  const [openIdeaDialog, setOpenIdeaDialog] = useState(false);
  const [editor, setEditor] = useState<{ assignmentId: string; id?: string; title: string; description: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [month, setMonth] = useState("");
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const assignments = (query.data ?? []).filter(a => !month || a.collection?.month === month);
  const submitted = assignments.reduce((sum, a) => sum + a.ideas.length, 0);
  const target = assignments.reduce((sum, a) => sum + a.required_count, 0);
  const completed = assignments.filter(a => a.ideas.length >= a.required_count).length;
  const editingAssignment = query.data?.find(a => a.id === editor?.assignmentId);
  const editorClosed = !!editingAssignment?.collection && new Date(editingAssignment.collection.deadline).getTime() <= now;

  async function saveIdea(event: React.FormEvent) {
    event.preventDefault();
    if (!editor) return;
    setBusy(true);
    try {
      await saveContentIdea(editor.assignmentId, { title: editor.title, description: editor.description }, editor.id);
      setEditor(null); toast.success("Idea saved");
      await cache.invalidateQueries({ queryKey: ["my-content-ideas"] });
      await cache.invalidateQueries({ queryKey: ["notifications"] });
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to save idea"); }
    finally { setBusy(false); }
  }

  return <div className="flex min-w-0 flex-1 flex-col gap-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h1 className="text-2xl font-bold tracking-tight">My Content Ideas</h1><p className="mt-1 text-sm text-muted-foreground">Your monthly content assignments, open Idea Bank submissions, and progress.</p></div>
      <Button onClick={() => setOpenIdeaDialog(true)}><Plus className="size-4" />Add open idea</Button>
    </div>
    <Tabs value={tab} onValueChange={setTab} className="w-full space-y-6">
      <TabsList aria-label="Content ideas sections" className="h-9">
        <TabsTrigger value="assigned" className="gap-1.5 px-3">
          <span>Assigned Themes{assignments.length ? ` (${assignments.length})` : ""}</span>
          {assignedBadge > 0 && (
            <span
              aria-label={`${assignedBadge} incomplete content assignments`}
              className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-medium tabular-nums text-white"
            >
              {assignedBadge}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="idea-bank" className="px-3">Idea Bank{openQuery.data?.length ? ` (${openQuery.data.length})` : ""}</TabsTrigger>
      </TabsList>
      <TabsContent value="assigned" className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatsCard title="Assigned themes" value={query.isPending ? "—" : assignments.length} icon={ClipboardList} description="Themes assigned to you" />
          <StatsCard title="Ideas submitted" value={query.isPending ? "—" : submitted} icon={Lightbulb} description={`${target} ideas requested`} iconClassName="text-primary" />
          <StatsCard title="Ideas remaining" value={query.isPending ? "—" : Math.max(0, target - submitted)} icon={CalendarDays} description="Across your assignments" />
          <StatsCard title="Completed themes" value={query.isPending ? "—" : completed} icon={CheckCircle2} description="All requested ideas submitted" iconClassName="text-emerald-600" />
        </div>
        <Card className="min-w-0"><CardContent className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-semibold">Your assignments</p><p className="text-xs text-muted-foreground">View all collections or choose a month.</p></div><div className="flex min-w-0 flex-wrap items-center gap-2"><Label htmlFor="ideas-month" className="text-xs text-muted-foreground">Month</Label><Input id="ideas-month" className="h-9 w-44" type="month" value={month} onChange={e => setMonth(e.target.value)} />{month && <Button variant="ghost" size="sm" onClick={() => setMonth("")}>Clear</Button>}</div></CardContent></Card>
        {query.isPending && <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Loading assignments…</div>}
        {query.isError && <Card><CardContent className="flex flex-wrap items-center justify-between gap-3" role="alert"><p className="text-sm text-destructive">{query.error.message}</p><Button variant="outline" onClick={() => query.refetch()}>Retry</Button></CardContent></Card>}
        {!query.isPending && !query.isError && assignments.length === 0 && <Card><CardContent className="flex flex-col items-center gap-2 py-12 text-center"><ClipboardList className="mb-1 size-8 text-muted-foreground/50" /><p className="font-semibold">No content assignments</p><p className="text-sm text-muted-foreground">{month ? "No assignments for this month. Try viewing all months." : "Your assignments will appear here when a collection is published. You can still submit ideas anytime in the Idea Bank."}</p>{!month && <div className="mt-2 flex flex-wrap justify-center gap-2"><Button size="sm" onClick={() => setOpenIdeaDialog(true)}><Plus className="size-4" />Add open idea</Button><Button size="sm" variant="outline" onClick={() => setTab("idea-bank")}>Open Idea Bank</Button></div>}</CardContent></Card>}
        <div className="grid min-w-0 items-start gap-5 xl:grid-cols-2">{assignments.map(assignment => {
          const collection = assignment.collection!;
          const closed = new Date(collection.deadline).getTime() <= now;
          const complete = assignment.ideas.length >= assignment.required_count;
          return <Card key={assignment.id} className="min-w-0"><CardHeader className="min-w-0 border-b"><div className="flex min-w-0 items-start justify-between gap-3"><div className="min-w-0"><CardDescription className="mb-1 [overflow-wrap:anywhere]">{collection.title}</CardDescription><CardTitle className="text-base font-semibold [overflow-wrap:anywhere]">{assignment.theme}</CardTitle></div><Badge variant="outline" className={`shrink-0 ${closed ? "text-muted-foreground" : "border-primary/20 bg-primary/5 text-primary"}`}>{closed ? "Closed" : "Open"}</Badge></div><div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarDays className="size-3.5 shrink-0" /><span>{deadlineLabel(collection.deadline)}</span></div></CardHeader>
            <CardContent className="min-w-0 space-y-4"><div className="rounded-lg bg-muted/40 p-3"><p className="mb-1 text-xs font-semibold">Content brief</p><p className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">{assignment.brief}</p></div>
              <div className="space-y-2"><AssignmentProgress assignment={assignment} /><div className="h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label={`${assignment.theme} submission progress`} aria-valuemin={0} aria-valuemax={assignment.required_count} aria-valuenow={assignment.ideas.length}><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, assignment.ideas.length / assignment.required_count * 100)}%` }} /></div></div>
              <ContentIdeasTable ideas={assignment.ideas} onEdit={closed ? undefined : idea => setEditor({ assignmentId: assignment.id, id: idea.id, title: idea.title, description: idea.description })} />
              <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3"><p className="text-xs text-muted-foreground">{closed ? "Submissions have closed." : complete ? "All requested ideas submitted." : `${assignment.required_count - assignment.ideas.length} more ideas to complete this theme.`}</p>{!closed && !complete && <Button size="sm" onClick={() => setEditor({ assignmentId: assignment.id, title: "", description: "" })}><Plus className="size-3.5" />Add idea</Button>}</div>
            </CardContent></Card>;
        })}</div>
      </TabsContent>
      <TabsContent value="idea-bank" className="space-y-6">
        <MyOpenIdeasBank onAddIdea={() => setOpenIdeaDialog(true)} />
      </TabsContent>
    </Tabs>
    <Dialog open={!!editor} onOpenChange={open => { if (!open && !busy) setEditor(null); }}><DialogContent className="min-w-0 max-h-[90dvh] overflow-y-auto overflow-x-hidden p-0 sm:max-w-xl"><DialogHeader className="min-w-0 border-b px-5 py-5 pr-12"><DialogTitle className="text-lg font-semibold">{editor?.id ? "Edit content idea" : "Add content idea"}</DialogTitle><DialogDescription className="[overflow-wrap:anywhere]">Share an idea for {editingAssignment?.theme}. You can edit it until the deadline.</DialogDescription></DialogHeader>
      {editor && <form className="min-w-0" onSubmit={saveIdea}><div className="min-w-0 space-y-5 px-5 pb-5">
        <div className="min-w-0 space-y-2"><Label htmlFor="idea-title">Idea title</Label><Input id="idea-title" className="h-10 min-w-0" placeholder="Give your idea a clear, short title" required maxLength={255} value={editor.title} onChange={e => setEditor({ ...editor, title: e.target.value })} /></div>
        <div className="min-w-0 space-y-2"><Label htmlFor="idea-description">Description</Label><Textarea id="idea-description" className="field-sizing-fixed min-h-40 min-w-0 max-w-full resize-y [overflow-wrap:anywhere]" placeholder="Explain the idea, the audience, and what the content could cover." required maxLength={5000} rows={6} value={editor.description} onChange={e => setEditor({ ...editor, description: e.target.value })} /><div className="flex justify-between gap-3 text-xs text-muted-foreground"><span>One idea per submission.</span><span className="shrink-0">{editor.description.length.toLocaleString()} / 5,000</span></div></div>
        {editorClosed && <p role="alert" className="text-sm text-destructive">The deadline has passed. Submissions are closed.</p>}
      </div><DialogFooter className="border-t bg-muted/30 px-5 py-4"><Button type="button" variant="outline" disabled={busy} onClick={() => setEditor(null)}>Cancel</Button><Button disabled={busy || editorClosed}>{busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}{busy ? "Saving…" : "Save idea"}</Button></DialogFooter></form>}
    </DialogContent></Dialog>
    <OpenIdeaDialog open={openIdeaDialog} onOpenChange={setOpenIdeaDialog} />
  </div>;
}
