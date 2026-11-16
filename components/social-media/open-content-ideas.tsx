"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CalendarDays,
  ClipboardList,
  ExternalLink,
  Lightbulb,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import {
  deleteMyOpenContentIdea,
  getMyOpenContentIdeas,
  getOpenContentIdeas,
  saveMyOpenContentIdea,
} from "@/lib/api/content-collections";
import {
  OPEN_IDEA_CATEGORIES,
  OPEN_IDEA_FORMATS,
  type OpenContentIdea,
} from "@/types/content-collections";
import { StatsCard } from "@/components/stats-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { openIdeasSpreadsheetCells } from "./content-copy";
import { ContentCopyButton } from "./content-copy-button";

function safeReferenceHref(value?: string | null): string | null {
  const trimmed = value?.trim();
  if (!trimmed || !/^https?:\/\//i.test(trimmed)) return null;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function getStaffKey(idea: OpenContentIdea): string {
  return idea.user?.id || idea.user_id || idea.user?.name || "";
}

function collectCategories(ideas: OpenContentIdea[]): string[] {
  const seen = new Set<string>(OPEN_IDEA_CATEGORIES);
  const extra: string[] = [];
  for (const idea of ideas) {
    if (idea.category && !seen.has(idea.category)) {
      seen.add(idea.category);
      extra.push(idea.category);
    }
  }
  return [...OPEN_IDEA_CATEGORIES, ...extra];
}

function matchesOpenIdea(
  idea: OpenContentIdea,
  search: string,
  category: string,
  staffFilter = "all",
): boolean {
  if (category !== "all" && idea.category !== category) return false;
  if (staffFilter !== "all" && getStaffKey(idea) !== staffFilter) return false;
  const term = search.trim().toLowerCase();
  if (!term) return true;
  const haystack = [
    idea.title,
    idea.description,
    idea.category,
    idea.format ?? "",
    idea.user?.name ?? "",
    idea.user?.department ?? "",
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(term);
}

function toggleExpanded(current: string[], id: string): string[] {
  return current.includes(id) ? current.filter(item => item !== id) : [...current, id];
}

function OpenIdeaCategoryBadges({ category, format }: { category: string; format?: string | null }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
        {category}
      </Badge>
      {format && <Badge variant="secondary">{format}</Badge>}
    </div>
  );
}

function OpenIdeaTitleCell({ idea, copyable = false }: { idea: OpenContentIdea; copyable?: boolean }) {
  const referenceHref = safeReferenceHref(idea.reference_url);
  return (
    <div className="space-y-1.5">
      <div className="flex items-start gap-1">
        <span className="min-w-0 flex-1 text-sm font-medium [overflow-wrap:anywhere]">{idea.title}</span>
        {copyable && <ContentCopyButton text={idea.title} label={`Copy title: ${idea.title}`} iconOnly />}
      </div>
      {referenceHref && (
        <a
          href={referenceHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          <ExternalLink className="size-3 shrink-0" />
          Reference link
        </a>
      )}
    </div>
  );
}

function OpenIdeaDescriptionCell({
  idea,
  expanded,
  onToggle,
  copyable = false,
}: {
  idea: OpenContentIdea;
  expanded: boolean;
  onToggle: () => void;
  copyable?: boolean;
}) {
  const isLong = idea.description.length > 180 || idea.description.split("\n").length > 3;
  return (
    <div>
      <div className="flex items-start gap-1">
        <p
          className={`min-w-0 flex-1 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground [overflow-wrap:anywhere] ${
            expanded ? "" : "line-clamp-3"
          }`}
        >
          {idea.description}
        </p>
        {copyable && (
          <ContentCopyButton text={idea.description} label={`Copy description: ${idea.title}`} iconOnly />
        )}
      </div>
      {isLong && (
        <button
          type="button"
          className="mt-1 text-xs font-medium text-primary hover:underline"
          onClick={onToggle}
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}

function OpenIdeaForm({
  idea,
  onClose,
  busy,
  setBusy,
}: {
  idea?: OpenContentIdea | null;
  onClose: () => void;
  busy: boolean;
  setBusy: (busy: boolean) => void;
}) {
  const cache = useQueryClient();
  const [title, setTitle] = useState(idea?.title ?? "");
  const [category, setCategory] = useState(idea?.category ?? "");
  const [format, setFormat] = useState(idea?.format ?? "");
  const [description, setDescription] = useState(idea?.description ?? "");
  const [referenceUrl, setReferenceUrl] = useState(idea?.reference_url ?? "");

  const categoryOptions =
    idea?.category && !OPEN_IDEA_CATEGORIES.includes(idea.category as (typeof OPEN_IDEA_CATEGORIES)[number])
      ? [...OPEN_IDEA_CATEGORIES, idea.category]
      : [...OPEN_IDEA_CATEGORIES];
  const formatOptions =
    idea?.format && !OPEN_IDEA_FORMATS.includes(idea.format as (typeof OPEN_IDEA_FORMATS)[number])
      ? [...OPEN_IDEA_FORMATS, idea.format]
      : [...OPEN_IDEA_FORMATS];

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    const trimmedReference = referenceUrl.trim();

    if (!trimmedTitle) {
      toast.error("Please enter an idea title");
      return;
    }
    if (!category) {
      toast.error("Please select a category");
      return;
    }
    if (!trimmedDescription) {
      toast.error("Please describe your content idea");
      return;
    }
    if (trimmedReference && !safeReferenceHref(trimmedReference)) {
      toast.error("Reference link must start with http:// or https://");
      return;
    }

    setBusy(true);
    try {
      await saveMyOpenContentIdea(
        {
          title: trimmedTitle,
          category,
          description: trimmedDescription,
          format: format || null,
          reference_url: trimmedReference || null,
        },
        idea?.id,
      );
      onClose();
      toast.success(idea?.id ? "Idea updated" : "Idea added to Idea Bank");
      await Promise.all([
        cache.invalidateQueries({ queryKey: ["my-open-content-ideas"] }),
        cache.invalidateQueries({ queryKey: ["open-content-ideas"] }),
      ]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save idea");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="min-w-0" onSubmit={handleSubmit}>
      <div className="min-w-0 space-y-5 px-5 pb-5">
        <div className="min-w-0 space-y-2">
          <Label htmlFor="open-idea-title">Idea title</Label>
          <Input
            id="open-idea-title"
            className="h-10 min-w-0"
            placeholder="Give your idea a clear, catchy title"
            required
            maxLength={255}
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>
        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
          <div className="min-w-0 space-y-2">
            <Label htmlFor="open-idea-category">Category</Label>
            <Select required value={category} onValueChange={setCategory}>
              <SelectTrigger id="open-idea-category" className="h-10 w-full min-w-0">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map(item => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-0 space-y-2">
            <Label htmlFor="open-idea-format">Suggested format (optional)</Label>
            <Select value={format || "none"} onValueChange={value => setFormat(value === "none" ? "" : value)}>
              <SelectTrigger id="open-idea-format" className="h-10 w-full min-w-0">
                <SelectValue placeholder="Any / Not specified" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Any / Not specified</SelectItem>
                {formatOptions.map(item => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor="open-idea-description">Content / Description</Label>
          <Textarea
            id="open-idea-description"
            className="field-sizing-fixed min-h-40 min-w-0 max-w-full resize-y [overflow-wrap:anywhere]"
            placeholder="Share the hook, talking points, audience, or client question behind this idea."
            required
            maxLength={5000}
            rows={6}
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
          <div className="flex justify-between gap-3 text-xs text-muted-foreground">
            <span>Add as many unassigned ideas as you like, anytime.</span>
            <span className="shrink-0">{description.length.toLocaleString()} / 5,000</span>
          </div>
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor="open-idea-reference">Reference / Inspiration link (optional)</Label>
          <Input
            id="open-idea-reference"
            className="h-10 min-w-0"
            type="url"
            maxLength={1000}
            placeholder="https://..."
            value={referenceUrl}
            onChange={e => setReferenceUrl(e.target.value)}
          />
        </div>
      </div>
      <DialogFooter className="border-t bg-muted/30 px-5 py-4">
        <Button type="button" variant="outline" disabled={busy} onClick={onClose}>
          Cancel
        </Button>
        <Button disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          {busy ? "Saving…" : idea?.id ? "Save changes" : "Add to Idea Bank"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function OpenIdeaDialog({
  open,
  onOpenChange,
  idea,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  idea?: OpenContentIdea | null;
}) {
  const [busy, setBusy] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={nextOpen => {
        if (!nextOpen && !busy) onOpenChange(false);
      }}
    >
      <DialogContent className="min-w-0 max-h-[90dvh] overflow-y-auto overflow-x-hidden p-0 sm:max-w-xl">
        <DialogHeader className="min-w-0 border-b px-5 py-5 pr-12">
          <DialogTitle className="text-lg font-semibold">
            {idea?.id ? "Edit open content idea" : "Add idea to Idea Bank"}
          </DialogTitle>
          <DialogDescription>
            Submit spontaneous content ideas anytime—no monthly assignment needed.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <OpenIdeaForm
            key={idea?.id ?? "new"}
            idea={idea}
            onClose={() => onOpenChange(false)}
            busy={busy}
            setBusy={setBusy}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

export function MyOpenIdeasBank({ onAddIdea }: { onAddIdea?: () => void }) {
  const cache = useQueryClient();
  const query = useQuery({ queryKey: ["my-open-content-ideas"], queryFn: getMyOpenContentIdeas });
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [expanded, setExpanded] = useState<string[]>([]);
  const [editingIdea, setEditingIdea] = useState<OpenContentIdea | null>(null);
  const [addingLocal, setAddingLocal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const ideas = query.data ?? [];
  const categories = collectCategories(ideas);
  const filtered = ideas.filter(idea => matchesOpenIdea(idea, search, category));
  const hasFilters = Boolean(search.trim()) || category !== "all";

  function handleOpenNew() {
    if (onAddIdea) {
      onAddIdea();
    } else {
      setAddingLocal(true);
    }
  }

  async function handleDelete(idea: OpenContentIdea) {
    setDeletingId(idea.id);
    try {
      await deleteMyOpenContentIdea(idea.id);
      toast.success("Idea removed");
      await Promise.all([
        cache.invalidateQueries({ queryKey: ["my-open-content-ideas"] }),
        cache.invalidateQueries({ queryKey: ["open-content-ideas"] }),
      ]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to remove idea");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <Card className="min-w-0">
        <CardHeader className="border-b">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold">My Idea Bank</CardTitle>
              <CardDescription>
                Drop spontaneous content ideas anytime—even when no monthly theme is assigned.
              </CardDescription>
            </div>
            <Button size="sm" onClick={handleOpenNew}>
              <Plus className="size-4" />
              Add idea
            </Button>
          </div>
        </CardHeader>
        <CardContent className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-0 flex-1 basis-56">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Search my open ideas"
                className="h-9 pl-9"
                placeholder="Search your ideas…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger aria-label="Filter my ideas by category" className="h-9 w-48">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map(item => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setCategory("all");
                }}
              >
                Clear filters
              </Button>
            )}
          </div>

          {query.isPending && (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading your ideas…
            </div>
          )}

          {query.isError && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4" role="alert">
              <p className="text-sm text-destructive">{query.error.message}</p>
              <Button variant="outline" size="sm" onClick={() => query.refetch()}>
                Retry
              </Button>
            </div>
          )}

          {!query.isPending && !query.isError && filtered.length === 0 && (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-12 text-center">
              <Lightbulb className="mb-1 size-8 text-muted-foreground/50" />
              <p className="font-semibold">{hasFilters ? "No matching ideas" : "No open ideas yet"}</p>
              <p className="max-w-md text-sm text-muted-foreground">
                {hasFilters
                  ? "Try clearing your search or choosing another category."
                  : "Got a great client FAQ, travel tip, or video hook? Add it here anytime for the Social Media team."}
              </p>
              {!hasFilters && (
                <Button size="sm" className="mt-2" onClick={handleOpenNew}>
                  <Plus className="size-4" />
                  Add your first idea
                </Button>
              )}
            </div>
          )}

          {filtered.length > 0 && (
            <div className="min-w-0 overflow-hidden rounded-lg border">
              <Table className="table-fixed">
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="w-10 pl-3">#</TableHead>
                    <TableHead className="w-48">Category &amp; Format</TableHead>
                    <TableHead className="w-[26%]">Idea</TableHead>
                    <TableHead>Content / Description</TableHead>
                    <TableHead className="w-24 pr-3 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((idea, index) => (
                    <TableRow key={idea.id}>
                      <TableCell className="pl-3 align-top text-xs text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="align-top">
                        <OpenIdeaCategoryBadges category={idea.category} format={idea.format} />
                      </TableCell>
                      <TableCell className="align-top">
                        <OpenIdeaTitleCell idea={idea} />
                      </TableCell>
                      <TableCell className="align-top">
                        <OpenIdeaDescriptionCell
                          idea={idea}
                          expanded={expanded.includes(idea.id)}
                          onToggle={() => setExpanded(current => toggleExpanded(current, idea.id))}
                        />
                      </TableCell>
                      <TableCell className="pr-3 text-right align-top">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            disabled={deletingId === idea.id}
                            aria-label={`Edit ${idea.title}`}
                            onClick={() => setEditingIdea(idea)}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            disabled={deletingId === idea.id}
                            aria-label={`Delete ${idea.title}`}
                            onClick={() => handleDelete(idea)}
                          >
                            {deletingId === idea.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="size-3.5 text-destructive" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <OpenIdeaDialog
        open={Boolean(editingIdea) || addingLocal}
        onOpenChange={open => {
          if (!open) {
            setEditingIdea(null);
            setAddingLocal(false);
          }
        }}
        idea={editingIdea}
      />
    </>
  );
}

export function SocialMediaIdeaBank() {
  const cache = useQueryClient();
  const query = useQuery({
    queryKey: ["open-content-ideas"],
    queryFn: async () => {
      const data = await getOpenContentIdeas();
      void cache.invalidateQueries({ queryKey: ["notifications"] });
      return data;
    },
    refetchInterval: 60000,
  });
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [staffId, setStaffId] = useState("all");
  const [expanded, setExpanded] = useState<string[]>([]);

  const ideas = query.data ?? [];
  const categories = collectCategories(ideas);
  const contributorsMap = new Map<string, { id: string; name: string; department?: string | null }>();
  for (const idea of ideas) {
    const key = getStaffKey(idea);
    if (key && !contributorsMap.has(key)) {
      contributorsMap.set(key, {
        id: key,
        name: idea.user?.name ?? "Unknown staff",
        department: idea.user?.department,
      });
    }
  }
  const contributors = [...contributorsMap.values()].sort((a, b) => a.name.localeCompare(b.name));
  const filtered = ideas.filter(idea => matchesOpenIdea(idea, search, category, staffId));
  const hasFilters = Boolean(search.trim()) || category !== "all" || staffId !== "all";
  const contributorCount = new Set(filtered.map(getStaffKey).filter(Boolean)).size;
  const categoryCount = new Set(filtered.map(idea => idea.category).filter(Boolean)).size;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatsCard
          title="Open ideas"
          icon={Lightbulb}
          value={query.isPending ? "—" : filtered.length}
          description={hasFilters ? "Matching active filters" : "Unassigned ideas submitted by staff"}
          iconClassName="text-primary"
        />
        <StatsCard
          title="Contributors"
          icon={ClipboardList}
          value={query.isPending ? "—" : contributorCount}
          description="Staff members sharing ideas"
        />
        <StatsCard
          title="Categories"
          icon={CalendarDays}
          value={query.isPending ? "—" : categoryCount}
          description="Topics represented"
        />
      </div>

      <Card className="min-w-0">
        <CardHeader className="border-b">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold">Staff Idea Bank</CardTitle>
              <CardDescription>
                Browse spontaneous content ideas submitted anytime and copy rows into your spreadsheet.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={query.isFetching}
                onClick={() => query.refetch()}
              >
                <RefreshCw className={`size-3.5 ${query.isFetching ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <ContentCopyButton
                rows={openIdeasSpreadsheetCells(filtered)}
                label="Copy ideas"
                disabled={!filtered.length}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-0 flex-1 basis-56">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Search open ideas"
                className="h-9 pl-9"
                placeholder="Search ideas, content, or staff…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger aria-label="Filter by category" className="h-9 w-48">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map(item => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={staffId} onValueChange={setStaffId}>
              <SelectTrigger aria-label="Filter by staff" className="h-9 w-48">
                <SelectValue placeholder="All staff" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All staff</SelectItem>
                {contributors.map(person => (
                  <SelectItem key={person.id} value={person.id}>
                    {person.name}
                    {person.department ? ` · ${person.department}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setCategory("all");
                  setStaffId("all");
                }}
              >
                Clear filters
              </Button>
            )}
          </div>

          {query.isPending && (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading Idea Bank…
            </div>
          )}

          {query.isError && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4" role="alert">
              <p className="text-sm text-destructive">{query.error.message}</p>
              <Button variant="outline" size="sm" onClick={() => query.refetch()}>
                Retry
              </Button>
            </div>
          )}

          {!query.isPending && !query.isError && filtered.length === 0 && (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-12 text-center">
              <Lightbulb className="mb-1 size-8 text-muted-foreground/50" />
              <p className="font-semibold">{hasFilters ? "No matching ideas" : "No open ideas yet"}</p>
              <p className="text-sm text-muted-foreground">
                {hasFilters
                  ? "Try a different search, category, or staff filter."
                  : "Unassigned content ideas submitted by staff will appear here."}
              </p>
            </div>
          )}

          {filtered.length > 0 && (
            <div className="min-w-0 overflow-hidden rounded-lg border">
              <Table className="table-fixed">
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="w-10 pl-3">#</TableHead>
                    <TableHead className="w-40">Staff member</TableHead>
                    <TableHead className="w-44">Category</TableHead>
                    <TableHead className="w-[24%]">Idea</TableHead>
                    <TableHead>Content / Description</TableHead>
                    <TableHead className="w-16 pr-3 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((idea, index) => (
                    <TableRow key={idea.id}>
                      <TableCell className="pl-3 align-top text-xs text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="align-top">
                        <p className="text-sm font-medium [overflow-wrap:anywhere]">
                          {idea.user?.name ?? "Unknown staff"}
                        </p>
                        {idea.user?.department && (
                          <p className="text-xs text-muted-foreground [overflow-wrap:anywhere]">
                            {idea.user.department}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="align-top">
                        <OpenIdeaCategoryBadges category={idea.category} format={idea.format} />
                      </TableCell>
                      <TableCell className="align-top">
                        <OpenIdeaTitleCell idea={idea} copyable />
                      </TableCell>
                      <TableCell className="align-top">
                        <OpenIdeaDescriptionCell
                          idea={idea}
                          expanded={expanded.includes(idea.id)}
                          onToggle={() => setExpanded(current => toggleExpanded(current, idea.id))}
                          copyable
                        />
                      </TableCell>
                      <TableCell className="pr-3 text-right align-top">
                        <div className="flex justify-end">
                          <ContentCopyButton
                            rows={openIdeasSpreadsheetCells([idea])}
                            label={`Copy row: ${idea.title}`}
                            iconOnly
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
