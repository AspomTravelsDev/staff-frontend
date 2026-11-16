"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Copy, Trash2, Send, CalendarDays, ClipboardList, Lightbulb, CheckCircle2, MoreHorizontal, Search, Loader2 } from "lucide-react";
import { getContentCollections, getContentStaff, saveContentCollection, publishContentCollection, changeContentDeadline } from "@/lib/api/content-collections";
import type { ContentCollection, ContentDraft } from "@/types/content-collections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { deadlineInput, deadlineISO, deadlineLabel } from "./content-helpers";
import { StatsCard } from "@/components/stats-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRoleNotifications } from "@/lib/api/hooks/use-notifications";
import { SocialMediaIdeaBank } from "./open-content-ideas";

const blankAssignment = () => ({ user_id: "", theme: "", brief: "", required_count: 1 });
const currentMonth = () => deadlineInput(new Date().toISOString()).slice(0, 7);

export function ContentCollections() {
  const cache = useQueryClient();
  const query = useQuery({ queryKey: ["content-collections"], queryFn: getContentCollections });
  const staff = useQuery({ queryKey: ["content-staff"], queryFn: getContentStaff });
  const { data: notifications } = useRoleNotifications();
  const openIdeasBadgeRaw = notifications?.openContentIdeas;
  const openIdeasBadge = typeof openIdeasBadgeRaw === "object" && openIdeasBadgeRaw !== null ? openIdeasBadgeRaw.count : (openIdeasBadgeRaw ?? 0);
  const [editor, setEditor] = useState<{ id?: string; draft: ContentDraft } | null>(null);
  const [extension, setExtension] = useState<{ id: string; deadline: string } | null>(null);
  const [publishing, setPublishing] = useState<ContentCollection | null>(null);
  const [busy, setBusy] = useState(false);
  const [monthFilter, setMonthFilter] = useState("");
  const [search, setSearch] = useState("");
  const collections = (query.data ?? []).filter(item => (!monthFilter || item.month === monthFilter) && `${item.title} ${item.month}`.toLowerCase().includes(search.toLowerCase()));
  const assignments = collections.flatMap(item => item.assignments);

  async function run(action: () => Promise<unknown>, message: string, close: () => void) {
    setBusy(true);
    try {
      await action();
      close();
      toast.success(message);
      await cache.invalidateQueries({ queryKey: ["content-collections"] });
      await cache.invalidateQueries({ queryKey: ["notifications"] });
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to save. Please try again."); }
    finally { setBusy(false); }
  }

  function openEditor(collection?: ContentCollection, copy = false) {
    let month = collection?.month ?? currentMonth();
    if (copy && collection) {
      const next = new Date(collection.month + "-01T12:00:00Z");
      next.setUTCMonth(next.getUTCMonth() + 1);
      month = next.toISOString().slice(0, 7);
    }
    setEditor({ id: copy ? undefined : collection?.id, draft: {
      title: copy ? `${new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(month + "-01"))} Content Collection` : collection?.title ?? "",
      month,
      deadline: collection && !copy ? deadlineInput(collection.deadline) : "",
      assignments: collection?.assignments.map(({ user_id, theme, brief, required_count }) => ({ user_id, theme, brief, required_count })) ?? [blankAssignment()],
    } });
  }

  return <div className="flex min-w-0 flex-1 flex-col gap-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h1 className="text-2xl font-bold tracking-tight">Content Collections</h1><p className="mt-1 text-sm text-muted-foreground">Plan monthly themes, assign staff, and review their ideas.</p></div>
      <Button onClick={() => openEditor()}><Plus className="size-4" />New collection</Button>
    </div>
    <Tabs defaultValue="collections" className="w-full space-y-6">
      <TabsList aria-label="Content workspace sections" className="h-9">
        <TabsTrigger value="collections" className="px-3">Monthly Collections</TabsTrigger>
        <TabsTrigger value="idea-bank" className="gap-1.5 px-3">
          <span>Idea Bank</span>
          {openIdeasBadge > 0 && (
            <span
              aria-label={`${openIdeasBadge} new open content ideas`}
              className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-medium tabular-nums text-white"
            >
              {openIdeasBadge}
            </span>
          )}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="collections" className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatsCard title="Collections" icon={CalendarDays} value={query.isPending ? "—" : collections.length} description={`${collections.filter(c => !c.published_at).length} drafts to prepare`} />
          <StatsCard title="Staff assignments" icon={ClipboardList} value={query.isPending ? "—" : assignments.length} description={`${new Set(assignments.map(a => a.user_id)).size} staff members assigned`} />
          <StatsCard title="Ideas submitted" icon={Lightbulb} value={query.isPending ? "—" : assignments.reduce((sum, a) => sum + a.ideas.length, 0)} description={`${assignments.reduce((sum, a) => sum + a.required_count, 0)} ideas requested`} iconClassName="text-primary" />
          <StatsCard title="Completed assignments" icon={CheckCircle2} value={query.isPending ? "—" : assignments.filter(a => a.ideas.length >= a.required_count).length} description="All requested ideas submitted" iconClassName="text-emerald-600" />
        </div>
        <Card className="min-w-0"><CardHeader className="border-b"><CardTitle className="text-base font-semibold">Monthly collections</CardTitle><CardDescription>Prepare drafts, monitor submissions, and review ideas.</CardDescription></CardHeader><CardContent className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-center gap-3"><div className="relative min-w-0 flex-1 basis-56"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Search collections" className="h-9 pl-9" placeholder="Search collections…" value={search} onChange={e => setSearch(e.target.value)} /></div><Label htmlFor="collection-filter" className="text-xs text-muted-foreground">Month</Label><Input id="collection-filter" className="h-9 w-44" type="month" value={monthFilter} onChange={e => setMonthFilter(e.target.value)} />{(monthFilter || search) && <Button variant="ghost" size="sm" onClick={() => { setMonthFilter(""); setSearch(""); }}>Clear filters</Button>}</div>
        {query.isPending && <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Loading collections…</div>}
        {query.isError && <div role="alert"><p>{query.error.message}</p><Button variant="outline" onClick={() => query.refetch()}>Retry</Button></div>}
        {!query.isPending && !query.isError && collections.length === 0 && <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-12 text-center"><ClipboardList className="size-8 text-muted-foreground/50" /><p className="font-semibold">No collections found</p><p className="text-sm text-muted-foreground">{monthFilter || search ? "Try a different search or month." : "Create your first monthly collection to get started."}</p></div>}
        {collections.length > 0 && <div className="overflow-hidden rounded-lg border"><Table><TableHeader className="bg-muted/40"><TableRow><TableHead className="pl-4">Collection</TableHead><TableHead>Status</TableHead><TableHead>Deadline</TableHead><TableHead>Assignments</TableHead><TableHead>Submissions</TableHead><TableHead className="pr-4 text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
          {collections.map(collection => {
            const total = collection.assignments.reduce((sum, assignment) => sum + assignment.required_count, 0);
            const submitted = collection.assignments.reduce((sum, assignment) => sum + assignment.ideas.length, 0);
            const state = !collection.published_at ? "Draft" : new Date(collection.deadline).getTime() <= Date.now() ? "Closed" : "Open";
            return <TableRow key={collection.id}><TableCell className="pl-4"><Link className="inline-block max-w-64 text-left font-semibold hover:text-primary [overflow-wrap:anywhere]" href={`/social-media/content-collections/${collection.id}`}>{collection.title}</Link><p className="mt-1 text-xs text-muted-foreground">{collection.month}</p></TableCell>
              <TableCell><Badge variant="outline" className={state === "Open" ? "border-primary/20 bg-primary/5 text-primary" : "text-muted-foreground"}>{state}</Badge></TableCell><TableCell className="whitespace-nowrap text-xs text-muted-foreground">{deadlineLabel(collection.deadline)}</TableCell><TableCell><p className="text-sm font-medium">{collection.assignments.length} themes</p><p className="text-xs text-muted-foreground">{collection.assignments.filter(a => a.ideas.length >= a.required_count).length} complete</p></TableCell>
              <TableCell className="min-w-32"><p className="mb-1.5 text-xs font-medium">{submitted} / {total} ideas</p><div className="h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${total ? Math.min(100, submitted / total * 100) : 0}%` }} /></div></TableCell>
              <TableCell className="pr-4"><div className="flex items-center justify-end gap-1"><Button asChild variant="outline" size="sm"><Link href={`/social-media/content-collections/${collection.id}`}>Open collection</Link></Button><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm" aria-label={`Actions for ${collection.title}`}><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end">{!collection.published_at && <><DropdownMenuItem onClick={() => openEditor(collection)}>Edit draft</DropdownMenuItem><DropdownMenuItem onClick={() => setPublishing(collection)}><Send className="size-4" />Publish collection</DropdownMenuItem></>}{collection.published_at && <DropdownMenuItem onClick={() => setExtension({ id: collection.id, deadline: "" })}>Change deadline</DropdownMenuItem>}<DropdownMenuItem onClick={() => openEditor(collection, true)}><Copy className="size-4" />Copy for next month</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div></TableCell>
            </TableRow>;
          })}
        </TableBody></Table></div>}
        </CardContent></Card>
      </TabsContent>
      <TabsContent value="idea-bank" className="space-y-6">
        <SocialMediaIdeaBank />
      </TabsContent>
    </Tabs>

    <Dialog open={!!editor} onOpenChange={open => { if (!open && !busy) setEditor(null); }}>
      <DialogContent className="min-w-0 max-h-[90dvh] overflow-y-auto overflow-x-hidden p-5 sm:max-w-3xl"><DialogHeader className="min-w-0 border-b pb-4 pr-8"><DialogTitle className="text-lg font-semibold">{editor?.id ? "Edit draft" : "New monthly collection"}</DialogTitle><DialogDescription>Save a draft first. Staff are notified when you publish.</DialogDescription></DialogHeader>
        {editor && <form className="min-w-0 space-y-5 [&_input]:h-9 [&_textarea]:field-sizing-fixed [&_textarea]:min-w-0 [&_textarea]:min-h-24" onSubmit={e => { e.preventDefault(); run(() => saveContentCollection({ ...editor.draft, deadline: deadlineISO(editor.draft.deadline) }, editor.id), "Draft saved", () => setEditor(null)); }}>
          <div className="space-y-2"><Label htmlFor="collection-title">Title</Label><Input id="collection-title" required maxLength={255} value={editor.draft.title} onChange={e => setEditor({ ...editor, draft: { ...editor.draft, title: e.target.value } })} /></div>
          <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="collection-month">Collection month</Label><Input id="collection-month" type="month" required value={editor.draft.month} onChange={e => setEditor({ ...editor, draft: { ...editor.draft, month: e.target.value } })} /></div><div className="space-y-2"><Label htmlFor="collection-deadline">Shared deadline (WAT)</Label><Input id="collection-deadline" type="datetime-local" required value={editor.draft.deadline} onChange={e => setEditor({ ...editor, draft: { ...editor.draft, deadline: e.target.value } })} /></div></div>
          {staff.isError && <p role="alert" className="text-destructive">Unable to load staff. <Button type="button" variant="link" onClick={() => staff.refetch()}>Retry</Button></p>}
          {editor.draft.assignments.map((assignment, index) => {
            const change = (patch: Partial<typeof assignment>) => setEditor({ ...editor, draft: { ...editor.draft, assignments: editor.draft.assignments.map((item, i) => i === index ? { ...item, ...patch } : item) } });
            return <fieldset key={index} className="min-w-0 space-y-3 rounded-lg border bg-muted/20 p-4"><legend className="px-2 text-sm font-semibold">Assignment {index + 1}</legend>
              <div className="grid min-w-0 gap-3 sm:grid-cols-2"><div className="min-w-0 space-y-2"><Label htmlFor={`staff-${index}`}>Staff member</Label><Select required value={assignment.user_id} onValueChange={value => change({ user_id: value })}><SelectTrigger id={`staff-${index}`} className="h-9 w-full min-w-0"><SelectValue placeholder={staff.isPending ? "Loading staff…" : "Select staff"} /></SelectTrigger><SelectContent>{staff.data?.map(person => <SelectItem key={person.id} value={person.id}>{person.name}{person.department ? ` · ${person.department}` : ""}</SelectItem>)}</SelectContent></Select></div><div className="min-w-0 space-y-2"><Label htmlFor={`count-${index}`}>Required ideas</Label><Input id={`count-${index}`} type="number" min={1} max={100} required value={assignment.required_count || ""} onChange={e => change({ required_count: Number(e.target.value) })} /></div></div>
              <div className="space-y-2"><Label htmlFor={`theme-${index}`}>Theme</Label><Input id={`theme-${index}`} required maxLength={255} placeholder="e.g. Flights" value={assignment.theme} onChange={e => change({ theme: e.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor={`brief-${index}`}>Brief</Label><Textarea id={`brief-${index}`} required maxLength={5000} placeholder="Explain what the ideas should cover." value={assignment.brief} onChange={e => change({ brief: e.target.value })} /></div>
              {editor.draft.assignments.length > 1 && <Button type="button" size="sm" variant="ghost" onClick={() => setEditor({ ...editor, draft: { ...editor.draft, assignments: editor.draft.assignments.filter((_, i) => i !== index) } })}><Trash2 className="size-4" />Remove assignment</Button>}
            </fieldset>;
          })}
          <div className="flex flex-wrap justify-between gap-2 border-t pt-4"><Button type="button" variant="outline" disabled={busy || editor.draft.assignments.length >= 200} onClick={() => setEditor({ ...editor, draft: { ...editor.draft, assignments: [...editor.draft.assignments, blankAssignment()] } })}><Plus className="size-4" />Add assignment</Button><div className="flex gap-2"><Button type="button" variant="outline" disabled={busy} onClick={() => setEditor(null)}>Cancel</Button><Button disabled={busy || !staff.data}>{busy ? "Saving…" : "Save draft"}</Button></div></div>
        </form>}
      </DialogContent>
    </Dialog>

    <Dialog open={!!publishing} onOpenChange={open => { if (!open && !busy) setPublishing(null); }}><DialogContent className="min-w-0 overflow-x-hidden"><DialogHeader className="min-w-0"><DialogTitle className="[overflow-wrap:anywhere]">Publish {publishing?.title}?</DialogTitle><DialogDescription>This will make all assignments visible and notify {new Set(publishing?.assignments.map(a => a.user_id)).size} staff members. You can add assignments, adjust idea counts and briefs, and change the deadline from the collection page after publishing.</DialogDescription></DialogHeader><Button disabled={busy} onClick={() => publishing && run(() => publishContentCollection(publishing.id), "Collection published and staff notified", () => setPublishing(null))}>{busy ? "Publishing…" : "Publish collection"}</Button></DialogContent></Dialog>

    <Dialog open={!!extension} onOpenChange={open => { if (!open && !busy) setExtension(null); }}><DialogContent className="min-w-0 overflow-x-hidden"><DialogHeader className="min-w-0"><DialogTitle>Change deadline</DialogTitle><DialogDescription>A future deadline reopens submissions for this collection. This applies to every assignment, and staff will be notified.</DialogDescription></DialogHeader>{extension && <form className="space-y-4" onSubmit={e => { e.preventDefault(); run(() => changeContentDeadline(extension.id, deadlineISO(extension.deadline)), "Deadline changed and staff notified", () => setExtension(null)); }}><Label htmlFor="extend-deadline">New deadline (WAT)</Label><Input id="extend-deadline" type="datetime-local" required value={extension.deadline} onChange={e => setExtension({ ...extension, deadline: e.target.value })} /><Button disabled={busy}>{busy ? "Saving…" : "Change deadline"}</Button></form>}</DialogContent></Dialog>
  </div>;
}
