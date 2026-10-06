"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, RefreshCw, Search, Loader2, ClipboardList, Lightbulb, CheckCircle2 } from "lucide-react";
import { getContentCollections } from "@/lib/api/content-collections";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { StatsCard } from "@/components/stats-card";
import { AssignmentProgress, deadlineLabel } from "./content-helpers";
import { ContentIdeasTable } from "./content-ideas-table";
import { ContentCopyButton } from "./content-copy-button";
import { spreadsheetCells } from "./content-copy";
import { ContentCollectionControls } from "./content-collection-controls";

export function ContentCollectionWorkspace({ collectionId }: { collectionId: string }) {
  const query = useQuery({ queryKey: ["content-collections"], queryFn: getContentCollections, refetchInterval: 60000 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  const collection = query.data?.find(item => item.id === collectionId);
  const assignments = collection?.assignments ?? [];
  const filtered = assignments.filter(a => `${a.user?.name ?? ""} ${a.theme}`.toLowerCase().includes(search.toLowerCase()));
  const selected = assignments.find(a => a.id === selectedId) ?? assignments[0];
  const submitted = assignments.reduce((sum, a) => sum + a.ideas.length, 0);

  return <div className="flex min-w-0 flex-1 flex-col gap-6">
    <Button asChild variant="ghost" size="sm" className="self-start"><Link href="/social-media/content-collections"><ArrowLeft className="size-4" />All collections</Link></Button>
    {query.isPending ? <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Loading collection…</p> : query.isError ? <div role="alert" className="space-y-3"><p className="text-sm text-destructive">{query.error.message}</p><Button variant="outline" onClick={() => query.refetch()}>Retry</Button></div> : !collection ? <Card><CardContent className="py-8">This collection could not be found.</CardContent></Card> : <>
      <div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0"><div className="flex flex-wrap items-center gap-3"><h1 className="text-2xl font-bold tracking-tight [overflow-wrap:anywhere]">{collection.title}</h1><Badge variant="outline">{!collection.published_at ? "Draft" : new Date(collection.deadline).getTime() <= now ? "Closed" : "Open"}</Badge></div><p className="mt-2 text-sm text-muted-foreground">{collection.month} · Deadline: {deadlineLabel(collection.deadline)}</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" disabled={query.isFetching} onClick={() => query.refetch()}><RefreshCw className={`size-3.5 ${query.isFetching ? "animate-spin" : ""}`} />Refresh</Button><ContentCopyButton rows={spreadsheetCells(assignments)} label="Copy all ideas" disabled={!submitted} /><ContentCollectionControls collection={collection} closed={new Date(collection.deadline).getTime() <= now} /></div></div>
      {collection.published_at && new Date(collection.deadline).getTime() <= now && <p className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">This collection is closed. Change the shared deadline to a future date before adding or editing assignments.</p>}<div className="grid gap-4 sm:grid-cols-3"><StatsCard title="Assignments" value={assignments.length} icon={ClipboardList} description={`${new Set(assignments.map(a => a.user_id)).size} staff members`} /><StatsCard title="Ideas submitted" value={submitted} icon={Lightbulb} description={`${assignments.reduce((sum, a) => sum + a.required_count, 0)} ideas requested`} /><StatsCard title="Completed" value={assignments.filter(a => a.ideas.length >= a.required_count).length} icon={CheckCircle2} description="Assignments completed" /></div>
      <Card className="min-w-0"><CardHeader className="border-b"><CardTitle>Staff assignments</CardTitle><CardDescription>Select an assignment to view its full ideas below.</CardDescription></CardHeader><CardContent className="min-w-0 space-y-4"><div className="relative max-w-md"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="h-9 pl-9" aria-label="Search assignments" placeholder="Search staff or theme…" value={search} onChange={e => setSearch(e.target.value)} /></div><div className="overflow-hidden rounded-lg border"><Table><TableHeader className="bg-muted/40"><TableRow><TableHead>Staff member</TableHead><TableHead>Theme</TableHead><TableHead>Progress</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{filtered.map(a => <TableRow key={a.id} data-state={selected?.id === a.id ? "selected" : undefined}><TableCell className="font-medium">{a.user?.name}</TableCell><TableCell className="max-w-64 [overflow-wrap:anywhere]">{a.theme}</TableCell><TableCell><AssignmentProgress assignment={a} /></TableCell><TableCell><div className="flex justify-end gap-2"><ContentCollectionControls collection={collection} assignment={a} closed={new Date(collection.deadline).getTime() <= now} /><ContentCopyButton rows={spreadsheetCells([a])} label={`Copy ideas for ${a.user?.name ?? "staff"}: ${a.theme}`} iconOnly disabled={!a.ideas.length} /><Button size="sm" variant={selected?.id === a.id ? "secondary" : "outline"} onClick={() => setSelectedId(a.id)}>View ideas</Button></div></TableCell></TableRow>)}{!filtered.length && <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">{search ? "No matching assignments." : "No staff assignments yet."}</TableCell></TableRow>}</TableBody></Table></div></CardContent></Card>
      {selected && <Card className="min-w-0"><CardHeader className="min-w-0 border-b"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><CardTitle className="[overflow-wrap:anywhere]">{selected.theme}</CardTitle><CardDescription className="mt-1">{selected.user?.name} · {selected.ideas.length} / {selected.required_count} ideas</CardDescription></div><ContentCopyButton rows={spreadsheetCells([selected])} label="Copy assignment ideas" disabled={!selected.ideas.length} /></div></CardHeader><CardContent className="min-w-0 space-y-5"><div className="rounded-lg bg-muted/40 p-4"><p className="mb-1 text-xs font-semibold">Content brief</p><p className="whitespace-pre-wrap text-sm text-muted-foreground [overflow-wrap:anywhere]">{selected.brief}</p></div><p className="text-xs text-muted-foreground">Copy a title or description individually, or copy rows into your spreadsheet with staff member, theme, title, and description columns.</p><ContentIdeasTable key={selected.id} ideas={selected.ideas} copyable showFullDescriptions copyContext={{ staff: selected.user?.name ?? "", theme: selected.theme }} /></CardContent></Card>}
    </>}
  </div>;
}
