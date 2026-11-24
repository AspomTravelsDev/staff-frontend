"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  ExternalLink,
  FolderOpen,
  Loader2,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Users,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatsCard } from "@/components/stats-card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { callAction } from "@/lib/api/action-result";
import {
  deleteTrainingVideo,
  getStaffTrainingProgress,
  listAdminTrainingVideos,
  lookupYoutubeVideoMetadata,
  saveTrainingVideo,
} from "@/lib/api/training-video.actions";
import { formatLagosDate } from "@/lib/utils/attendance";
import type {
  AdminTrainingVideo,
  AdminTrainingVideosResponse,
  StaffTrainingProgressResponse,
  TrainingVideoInput,
} from "@/lib/types/training-video";

const ADMIN_QUERY_KEY = ["training-videos", "admin"] as const;
const PROGRESS_QUERY_KEY = ["training-videos", "staff-progress"] as const;

function emptyForm(): TrainingVideoInput {
  return {
    title: "",
    description: "",
    module: "General Onboarding",
    youtube_url: "",
    departments: ["General"],
    is_required: true,
    is_published: true,
    sort_order: 0,
    related_guide_url: "",
  };
}

export function TrainingVideosAdmin({
  initialData,
}: {
  initialData: AdminTrainingVideosResponse;
}) {
  const queryClient = useQueryClient();

  const { data } = useQuery<AdminTrainingVideosResponse>({
    queryKey: ADMIN_QUERY_KEY,
    queryFn: () => callAction(listAdminTrainingVideos),
    initialData,
  });

  const staffProgress = useQuery<StaffTrainingProgressResponse>({
    queryKey: PROGRESS_QUERY_KEY,
    queryFn: () => callAction(getStaffTrainingProgress),
  });

  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [staffSearch, setStaffSearch] = useState("");
  const [staffDeptFilter, setStaffDeptFilter] = useState("all");
  const [staffStatusFilter, setStaffStatusFilter] = useState("all");

  const [editor, setEditor] = useState<{
    id: string | null;
    values: TrainingVideoInput;
    previewThumbnail: string | null;
  } | null>(null);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<AdminTrainingVideo | null>(
    null,
  );

  const lookupMutation = useMutation({
    mutationFn: (url: string) => callAction(() => lookupYoutubeVideoMetadata(url)),
    onSuccess: (meta) => {
      setEditor((old) =>
        old
          ? {
              ...old,
              previewThumbnail: meta.thumbnail_url,
              values: {
                ...old.values,
                title: old.values.title.trim()
                  ? old.values.title
                  : meta.title ?? "",
              },
            }
          : old,
      );
      setFormError("");
      toast.success("YouTube video details loaded");
    },
    onError: (failure) => {
      setFormError(
        failure instanceof Error
          ? failure.message
          : "Could not look up that YouTube link.",
      );
    },
  });

  const saveMutation = useMutation({
    mutationFn: ({ id, values }: { id: string | null; values: TrainingVideoInput }) =>
      callAction(() => saveTrainingVideo(id, values)),
    onSuccess: () => {
      setEditor(null);
      setFormError("");
      void queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: PROGRESS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ["training-videos", "mine"] });
      toast.success("Training video saved");
    },
    onError: (failure) => {
      setFormError(
        failure instanceof Error
          ? failure.message
          : "Unable to save this training video.",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => callAction(() => deleteTrainingVideo(id)),
    onSuccess: () => {
      setDeleteTarget(null);
      void queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: PROGRESS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ["training-videos", "mine"] });
      toast.success("Training video deleted");
    },
    onError: (failure) => {
      toast.error(
        failure instanceof Error
          ? failure.message
          : "Unable to delete training video.",
      );
      setDeleteTarget(null);
    },
  });

  function openNewEditor() {
    setFormError("");
    setEditor({
      id: null,
      values: emptyForm(),
      previewThumbnail: null,
    });
  }

  function openEditEditor(video: AdminTrainingVideo) {
    setFormError("");
    setEditor({
      id: video.id,
      previewThumbnail: video.thumbnail_url,
      values: {
        title: video.title,
        description: video.description ?? "",
        module: video.module,
        youtube_url: video.youtube_url,
        duration_seconds: video.duration_seconds,
        departments: video.departments,
        is_required: video.is_required,
        is_published: video.is_published,
        sort_order: video.sort_order,
        related_guide_url: video.related_guide_url ?? "",
      },
    });
  }

  function toggleDepartment(dept: string, checked: boolean) {
    setEditor((old) => {
      if (!old) return old;
      const next = checked
        ? Array.from(new Set([...old.values.departments, dept]))
        : old.values.departments.filter((item) => item !== dept);
      return { ...old, values: { ...old.values, departments: next } };
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor || saveMutation.isPending) return;
    if (!editor.values.youtube_url.trim()) {
      setFormError("Paste a YouTube or YouTube Unlisted video URL.");
      return;
    }
    if (!editor.values.title.trim()) {
      setFormError("Enter a title for this training video.");
      return;
    }
    if (!editor.values.departments.length) {
      setFormError("Select at least one target department (or General for all staff).");
      return;
    }
    setFormError("");
    saveMutation.mutate({
      id: editor.id,
      values: {
        ...editor.values,
        title: editor.values.title.trim(),
        module: editor.values.module.trim() || "General Onboarding",
        youtube_url: editor.values.youtube_url.trim(),
        description: editor.values.description?.trim() || null,
        related_guide_url: editor.values.related_guide_url?.trim() || null,
      },
    });
  }

  const videos = data.items;
  const filteredVideos = videos.filter((video) => {
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      `${video.title} ${video.module} ${video.departments.join(" ")}`
        .toLowerCase()
        .includes(query);
    const matchesModule =
      moduleFilter === "all" || video.module === moduleFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "published" ? video.is_published : !video.is_published);
    return matchesSearch && matchesModule && matchesStatus;
  });

  const staffRows = staffProgress.data?.items ?? [];
  const filteredStaff = staffRows.filter((row) => {
    const query = staffSearch.trim().toLowerCase();
    const matchesSearch =
      !query ||
      `${row.name} ${row.staff_id ?? ""} ${row.departments.join(" ")}`
        .toLowerCase()
        .includes(query);
    const matchesDept =
      staffDeptFilter === "all" || row.departments.includes(staffDeptFilter);
    const matchesStatus =
      staffStatusFilter === "all" ||
      (staffStatusFilter === "incomplete"
        ? row.required_total > 0 && row.required_completed < row.required_total
        : row.required_total > 0 && row.required_completed >= row.required_total);
    return matchesSearch && matchesDept && matchesStatus;
  });

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Staff Learning &amp; Onboarding
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Training &amp; Onboarding Videos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Publish unlisted YouTube training videos, target departments across primary &amp; secondary roles, and track onboarding completion.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/my/training">
              <ExternalLink className="mr-1.5 size-4" aria-hidden="true" />
              Staff View
            </Link>
          </Button>
          <Button onClick={openNewEditor}>
            <Plus className="mr-1.5 size-4" aria-hidden="true" />
            Add Training Video
          </Button>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Total Videos"
          icon={Video}
          value={videos.length}
          description={`Across ${new Set(videos.map((v) => v.module)).size} modules`}
          compact
        />
        <StatsCard
          title="Published"
          icon={CheckCircle2}
          value={videos.filter((v) => v.is_published).length}
          description="Visible to targeted staff"
          iconClassName="text-green-600"
          compact
        />
        <StatsCard
          title="Required Onboarding"
          icon={Sparkles}
          value={videos.filter((v) => v.is_required && v.is_published).length}
          description="Mandatory training items"
          iconClassName="text-amber-600"
          compact
        />
        <StatsCard
          title="Modules"
          icon={FolderOpen}
          value={data.modules.length}
          description="Playlist categories"
          iconClassName="text-blue-600"
          compact
        />
      </section>

      <Tabs defaultValue="library" className="w-full space-y-4">
        <TabsList>
          <TabsTrigger value="library">Video Library</TabsTrigger>
          <TabsTrigger value="progress">Staff Completion Tracker</TabsTrigger>
        </TabsList>

        {/* VIDEO LIBRARY TAB */}
        <TabsContent value="library" className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3 sm:p-4">
            <div className="relative min-w-0 flex-1 sm:max-w-sm">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                className="h-9 pl-9"
                placeholder="Search title, module, or department…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="video-module-filter" className="text-sm">
                Module
              </Label>
              <Select value={moduleFilter} onValueChange={setModuleFilter}>
                <SelectTrigger id="video-module-filter" className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All modules</SelectItem>
                  {data.modules.map((mod) => (
                    <SelectItem key={mod} value={mod}>
                      {mod}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="video-status-filter" className="text-sm">
                Status
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="video-status-filter" className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border bg-card">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="min-w-64">Video</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead className="min-w-48">Target Departments</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Watched</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!filteredVideos.length && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-28 text-center text-muted-foreground">
                      {videos.length
                        ? "No training videos match your filters."
                        : "No training videos added yet. Click “Add Training Video” to publish your first YouTube Unlisted guide."}
                    </TableCell>
                  </TableRow>
                )}
                {filteredVideos.map((video) => (
                  <TableRow key={video.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={video.thumbnail_url}
                          alt=""
                          className="h-12 w-20 shrink-0 rounded border object-cover bg-slate-900"
                        />
                        <div className="min-w-0">
                          <p className="font-medium leading-snug">{video.title}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            YouTube ID: {video.youtube_video_id}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{video.module}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {video.departments.map((dept) => (
                          <Badge
                            key={dept}
                            variant={dept === "General" ? "default" : "secondary"}
                            className="text-xs font-normal"
                          >
                            {dept === "General" ? "All Staff (General)" : dept}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={video.is_required ? "secondary" : "outline"}>
                        {video.is_required ? "Required" : "Optional"}
                      </Badge>
                    </TableCell>
                    <TableCell className="tabular-nums text-sm">
                      {video.completed_count} / {video.target_staff_count} staff
                    </TableCell>
                    <TableCell>
                      <Badge variant={video.is_published ? "default" : "secondary"}>
                        {video.is_published ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => openEditEditor(video)}
                        >
                          <Pencil className="mr-1 size-3.5" aria-hidden="true" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(video)}
                          aria-label={`Delete ${video.title}`}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* STAFF COMPLETION TRACKER TAB */}
        <TabsContent value="progress" className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3 sm:p-4">
            <div className="relative min-w-0 flex-1 sm:max-w-sm">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                className="h-9 pl-9"
                placeholder="Search staff name, ID, or department…"
                value={staffSearch}
                onChange={(event) => setStaffSearch(event.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="staff-video-dept" className="text-sm">
                Department
              </Label>
              <Select value={staffDeptFilter} onValueChange={setStaffDeptFilter}>
                <SelectTrigger id="staff-video-dept" className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All departments</SelectItem>
                  {data.departments
                    .filter((d) => d !== "General")
                    .map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="staff-video-status" className="text-sm">
                Completion
              </Label>
              <Select
                value={staffStatusFilter}
                onValueChange={setStaffStatusFilter}
              >
                <SelectTrigger id="staff-video-status" className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All staff</SelectItem>
                  <SelectItem value="incomplete">Incomplete required</SelectItem>
                  <SelectItem value="completed">All required done</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {staffProgress.isLoading ? (
            <div className="flex items-center gap-2 rounded-xl border bg-card p-8 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Loading staff completion progress…
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border bg-card">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="min-w-44">Staff member</TableHead>
                    <TableHead>Departments (Primary + Secondary)</TableHead>
                    <TableHead>Required Onboarding</TableHead>
                    <TableHead>Total Watched</TableHead>
                    <TableHead>Last Activity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!filteredStaff.length && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No matching staff found.
                      </TableCell>
                    </TableRow>
                  )}
                  {filteredStaff.map((row) => (
                    <TableRow key={row.user_id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users
                            className="size-4 text-muted-foreground"
                            aria-hidden="true"
                          />
                          <div>
                            <p className="font-medium">{row.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {row.staff_id || "—"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {row.departments.length ? (
                            row.departments.map((dept) => (
                              <Badge
                                key={dept}
                                variant="secondary"
                                className="text-xs font-normal"
                              >
                                {dept}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Unassigned
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs font-medium tabular-nums">
                            <span>
                              {row.required_completed} / {row.required_total}
                            </span>
                            <Badge
                              variant={
                                row.required_total > 0 &&
                                row.required_completed >= row.required_total
                                  ? "default"
                                  : "outline"
                              }
                              className="text-[10px]"
                            >
                              {row.completion_percent}%
                            </Badge>
                          </div>
                          <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${row.completion_percent}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="tabular-nums text-sm">
                        {row.assigned_completed} / {row.assigned_total}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {row.last_watched_at
                          ? formatLagosDate(row.last_watched_at)
                          : "Not started"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add / Edit Video Dialog */}
      <Dialog
        open={!!editor}
        onOpenChange={(open) => {
          if (!open && !saveMutation.isPending) setEditor(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editor?.id ? "Edit training video" : "Add training video"}
            </DialogTitle>
            <DialogDescription>
              Paste any YouTube or YouTube Unlisted link and choose which departments should see this training video.
            </DialogDescription>
          </DialogHeader>
          {editor && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="training-youtube-url">YouTube Unlisted URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="training-youtube-url"
                    required
                    placeholder="https://youtu.be/... or https://www.youtube.com/watch?v=..."
                    value={editor.values.youtube_url}
                    onChange={(event) => {
                      const nextUrl = event.target.value;
                      setEditor((old) =>
                        old
                          ? { ...old, values: { ...old.values, youtube_url: nextUrl } }
                          : old,
                      );
                      setFormError("");
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={
                      lookupMutation.isPending || !editor.values.youtube_url.trim()
                    }
                    onClick={() =>
                      lookupMutation.mutate(editor.values.youtube_url.trim())
                    }
                  >
                    {lookupMutation.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      "Fetch info"
                    )}
                  </Button>
                </div>
                {editor.previewThumbnail && (
                  <div className="mt-2 flex items-center gap-3 rounded-lg border bg-muted/30 p-2">
                    <img
                      src={editor.previewThumbnail}
                      alt="YouTube thumbnail preview"
                      className="h-14 w-24 rounded object-cover"
                    />
                    <span className="text-xs text-muted-foreground">
                      YouTube video verified &amp; thumbnail ready
                    </span>
                  </div>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="training-video-title">Title</Label>
                  <Input
                    id="training-video-title"
                    required
                    maxLength={180}
                    placeholder="e.g., Welcome to ASPOM & Portal Walkthrough"
                    value={editor.values.title}
                    onChange={(event) =>
                      setEditor((old) =>
                        old
                          ? { ...old, values: { ...old.values, title: event.target.value } }
                          : old,
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="training-video-module">Module / Playlist</Label>
                  <Input
                    id="training-video-module"
                    list="training-module-presets"
                    required
                    maxLength={100}
                    value={editor.values.module}
                    onChange={(event) =>
                      setEditor((old) =>
                        old
                          ? { ...old, values: { ...old.values, module: event.target.value } }
                          : old,
                      )
                    }
                  />
                  <datalist id="training-module-presets">
                    {data.modules.map((mod) => (
                      <option key={mod} value={mod} />
                    ))}
                  </datalist>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="training-video-sort">Playlist order</Label>
                  <Input
                    id="training-video-sort"
                    type="number"
                    min={0}
                    max={10000}
                    value={editor.values.sort_order ?? 0}
                    onChange={(event) =>
                      setEditor((old) =>
                        old
                          ? {
                              ...old,
                              values: {
                                ...old.values,
                                sort_order: Number(event.target.value) || 0,
                              },
                            }
                          : old,
                      )
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="training-video-desc">Description / Key takeaways</Label>
                <Textarea
                  id="training-video-desc"
                  rows={3}
                  maxLength={3000}
                  placeholder="Summarize what staff will learn from this video..."
                  value={editor.values.description ?? ""}
                  onChange={(event) =>
                    setEditor((old) =>
                      old
                        ? {
                            ...old,
                            values: { ...old.values, description: event.target.value },
                          }
                        : old,
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="training-video-guide">
                  Related portal guide link (optional)
                </Label>
                <Input
                  id="training-video-guide"
                  placeholder="e.g., /my/it/bi-yearly-appraisal-guide"
                  maxLength={500}
                  value={editor.values.related_guide_url ?? ""}
                  onChange={(event) =>
                    setEditor((old) =>
                      old
                        ? {
                            ...old,
                            values: {
                              ...old.values,
                              related_guide_url: event.target.value,
                            },
                          }
                        : old,
                    )
                  }
                />
              </div>

              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">
                  Target departments (matches primary &amp; secondary roles)
                </legend>
                <div className="grid gap-2 rounded-lg border p-3 sm:grid-cols-2">
                  {data.departments.map((dept) => (
                    <label key={dept} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={editor.values.departments.includes(dept)}
                        onCheckedChange={(value) =>
                          toggleDepartment(dept, Boolean(value))
                        }
                      />
                      <span className={dept === "General" ? "font-semibold" : ""}>
                        {dept === "General" ? "General (All Staff)" : dept}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="flex flex-wrap gap-6 pt-1">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={editor.values.is_required}
                    onCheckedChange={(value) =>
                      setEditor((old) =>
                        old
                          ? {
                              ...old,
                              values: { ...old.values, is_required: Boolean(value) },
                            }
                          : old,
                      )
                    }
                  />
                  Required for onboarding
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={editor.values.is_published}
                    onCheckedChange={(value) =>
                      setEditor((old) =>
                        old
                          ? {
                              ...old,
                              values: { ...old.values, is_published: Boolean(value) },
                            }
                          : old,
                      )
                    }
                  />
                  Publish immediately
                </label>
              </div>

              {formError && (
                <p role="alert" className="text-sm text-destructive">
                  {formError}
                </p>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  disabled={saveMutation.isPending}
                  onClick={() => setEditor(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Saving…" : "Save video"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{deleteTarget?.title}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the training video and all recorded staff watch progress from the portal. The YouTube video itself is not deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete video"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
