"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  ExternalLink,
  Play,
  Search,
  Settings2,
  Sparkles,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { callAction } from "@/lib/api/action-result";
import {
  getMyTrainingVideos,
  recordTrainingVideoProgress,
} from "@/lib/api/training-video.actions";
import type {
  MyTrainingVideosResponse,
  StaffTrainingVideo,
} from "@/lib/types/training-video";
import { YouTubeTrainingPlayer } from "./youtube-player";

const QUERY_KEY = ["training-videos", "mine"] as const;

function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return "Video";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs}h ${remMins}m`;
  }
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export function TrainingHub({
  initialData,
  canManage,
}: {
  initialData: MyTrainingVideosResponse;
  canManage: boolean;
}) {
  const queryClient = useQueryClient();
  const { data } = useQuery<MyTrainingVideosResponse>({
    queryKey: QUERY_KEY,
    queryFn: () => callAction(getMyTrainingVideos),
    initialData,
  });

  const [selectedModule, setSelectedModule] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    const firstIncomplete =
      initialData.items.find(
        (item) => item.is_required && !item.progress.completed_at,
      ) ?? initialData.items.find((item) => !item.progress.completed_at);
    return firstIncomplete?.id ?? initialData.items[0]?.id ?? null;
  });
  const [playerActive, setPlayerActive] = useState(false);

  const videos = data.items;
  const filteredVideos = useMemo(() => {
    const query = search.trim().toLowerCase();
    return videos.filter((video) => {
      const matchesModule =
        selectedModule === "all" || video.module === selectedModule;
      const matchesSearch =
        !query ||
        `${video.title} ${video.description ?? ""} ${video.module}`
          .toLowerCase()
          .includes(query);
      return matchesModule && matchesSearch;
    });
  }, [videos, selectedModule, search]);

  const activeVideo: StaffTrainingVideo | null = useMemo(() => {
    return (
      videos.find((item) => item.id === selectedId) ??
      filteredVideos[0] ??
      videos[0] ??
      null
    );
  }, [videos, filteredVideos, selectedId]);

  const groupedModules = useMemo(() => {
    const map = new Map<string, StaffTrainingVideo[]>();
    for (const item of filteredVideos) {
      const list = map.get(item.module) ?? [];
      list.push(item);
      map.set(item.module, list);
    }
    return Array.from(map.entries());
  }, [filteredVideos]);

  const saveProgress = useMutation({
    mutationFn: ({
      videoId,
      watchedSeconds,
      durationSeconds,
      completed,
    }: {
      videoId: string;
      watchedSeconds: number;
      durationSeconds?: number | null;
      completed?: boolean;
    }) =>
      callAction(() =>
        recordTrainingVideoProgress(videoId, {
          watched_seconds: watchedSeconds,
          duration_seconds: durationSeconds,
          completed,
        }),
      ),
    onSuccess: (updated, variables) => {
      const wasCompleted =
        videos.find((item) => item.id === updated.video_id)?.progress
          .completed_at !== null;
      queryClient.setQueryData<MyTrainingVideosResponse>(QUERY_KEY, (old) => {
        if (!old) return old;
        const nextItems = old.items.map((item) =>
          item.id === updated.video_id
            ? {
                ...item,
                duration_seconds:
                  item.duration_seconds ?? updated.duration_seconds,
                progress: {
                  watched_seconds: updated.watched_seconds,
                  duration_seconds: updated.duration_seconds,
                  completion_percent: updated.completion_percent,
                  completed_at: updated.completed_at,
                  last_watched_at: updated.last_watched_at,
                },
              }
            : item,
        );
        const required = nextItems.filter((item) => item.is_required);
        const remainingSeconds = nextItems
          .filter(
            (item) => !item.progress.completed_at && item.duration_seconds,
          )
          .reduce(
            (sum, item) =>
              sum +
              Math.max(
                0,
                (item.duration_seconds ?? 0) - item.progress.watched_seconds,
              ),
            0,
          );
        return {
          ...old,
          items: nextItems,
          summary: {
            total: nextItems.length,
            completed: nextItems.filter((item) => item.progress.completed_at)
              .length,
            required_total: required.length,
            required_completed: required.filter(
              (item) => item.progress.completed_at,
            ).length,
            remaining_seconds: remainingSeconds,
          },
        };
      });
      if (!wasCompleted && updated.completed_at && variables.completed !== false) {
        toast.success("Video marked as completed!");
      }
    },
  });

  const requiredTarget =
    data.summary.required_total > 0
      ? data.summary.required_total
      : data.summary.total;
  const requiredDone =
    data.summary.required_total > 0
      ? data.summary.required_completed
      : data.summary.completed;
  const overallPercent =
    requiredTarget > 0 ? Math.round((requiredDone / requiredTarget) * 100) : 0;

  const nextToWatch =
    videos.find((item) => item.is_required && !item.progress.completed_at) ??
    videos.find((item) => !item.progress.completed_at) ??
    videos[0] ??
    null;

  function selectVideo(video: StaffTrainingVideo, startPlaying = false) {
    setSelectedId(video.id);
    setPlayerActive(startPlaying);
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      {/* Hero / Progress Banner */}
      <Card className="overflow-hidden border bg-gradient-to-br from-primary/10 via-background to-background">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  <Sparkles className="size-3 text-primary" aria-hidden="true" />
                  Training &amp; Onboarding Hub
                </Badge>
                {data.user_departments.map((dept) => (
                  <Badge key={dept} variant="outline" className="text-xs">
                    {dept}
                  </Badge>
                ))}
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight sm:text-3xl">
                Onboarding &amp; How-To Videos
              </CardTitle>
              <CardDescription className="max-w-2xl">
                Watch your company onboarding sessions and department walkthroughs. Progress saves automatically as you watch.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {canManage && (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/admin/training-videos">
                    <Settings2 className="mr-1.5 size-4" aria-hidden="true" />
                    Manage Videos
                  </Link>
                </Button>
              )}
              {nextToWatch && (
                <Button
                  size="sm"
                  onClick={() => selectVideo(nextToWatch, true)}
                >
                  <Play className="mr-1.5 size-4" aria-hidden="true" />
                  {nextToWatch.progress.completed_at
                    ? "Rewatch Training"
                    : nextToWatch.progress.watched_seconds > 0
                      ? "Continue Watching"
                      : "Start Onboarding"}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        {videos.length > 0 && (
          <CardContent className="pt-0">
            <div className="rounded-xl border bg-card/80 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-medium">
                  {data.summary.required_total > 0
                    ? `${data.summary.required_completed} of ${data.summary.required_total} required videos completed`
                    : `${data.summary.completed} of ${data.summary.total} videos completed`}
                  {data.summary.required_total > 0 &&
                    data.summary.total > data.summary.required_total && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({data.summary.completed}/{data.summary.total} total)
                      </span>
                    )}
                </span>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {data.summary.remaining_seconds > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="size-3.5" aria-hidden="true" />~
                      {Math.max(
                        1,
                        Math.ceil(data.summary.remaining_seconds / 60),
                      )}{" "}
                      min left
                    </span>
                  )}
                  <span className="font-semibold tabular-nums text-foreground">
                    {overallPercent}%
                  </span>
                </div>
              </div>
              <div
                className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-valuenow={overallPercent}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${overallPercent}%` }}
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Filter Bar */}
      {videos.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              type="button"
              size="sm"
              variant={selectedModule === "all" ? "default" : "outline"}
              className="h-8 rounded-full px-3.5 text-xs"
              onClick={() => setSelectedModule("all")}
            >
              All Modules ({videos.length})
            </Button>
            {data.modules.map((mod) => (
              <Button
                key={mod}
                type="button"
                size="sm"
                variant={selectedModule === mod ? "default" : "outline"}
                className="h-8 rounded-full px-3.5 text-xs"
                onClick={() => setSelectedModule(mod)}
              >
                {mod}
              </Button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              className="h-9 pl-9"
              placeholder="Search videos…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>
      )}

      {!videos.length ? (
        <Card className="border-dashed py-16 text-center">
          <CardContent className="flex flex-col items-center justify-center gap-3">
            <div className="rounded-full bg-muted p-4">
              <Video className="size-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold">No training videos published yet</h2>
            <p className="max-w-md text-sm text-muted-foreground">
              Once HR, IT, or Compliance adds onboarding and department training videos for your role, they will appear here.
            </p>
            {canManage && (
              <Button asChild className="mt-2">
                <Link href="/admin/training-videos">Add first training video</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
          {/* Main Stage */}
          <div className="space-y-4 lg:col-span-8">
            {activeVideo ? (
              <Card className="overflow-hidden">
                <div className="p-3 sm:p-4 pb-0">
                  {playerActive ? (
                    <YouTubeTrainingPlayer
                      key={activeVideo.id}
                      videoId={activeVideo.youtube_video_id}
                      title={activeVideo.title}
                      initialSeconds={
                        activeVideo.progress.completed_at
                          ? 0
                          : activeVideo.progress.watched_seconds
                      }
                      autoplay
                      onProgress={({
                        watchedSeconds,
                        durationSeconds,
                        completed,
                      }) => {
                        saveProgress.mutate({
                          videoId: activeVideo.id,
                          watchedSeconds,
                          durationSeconds,
                          completed,
                        });
                      }}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPlayerActive(true)}
                      className="group relative aspect-video w-full overflow-hidden rounded-xl bg-slate-950 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <img
                        src={activeVideo.thumbnail_url}
                        alt={activeVideo.title}
                        className="h-full w-full object-cover opacity-85 transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/35 transition-colors group-hover:bg-black/45">
                        <span className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl transition-transform group-hover:scale-110">
                          <Play className="ml-1 size-7 fill-current" />
                        </span>
                        <span className="mt-3 rounded-full bg-black/70 px-3.5 py-1 text-xs font-medium text-white backdrop-blur">
                          {activeVideo.progress.completed_at
                            ? "Rewatch video"
                            : activeVideo.progress.watched_seconds > 5
                              ? `Resume from ${formatDuration(activeVideo.progress.watched_seconds)}`
                              : "Click to play video"}
                        </span>
                      </div>
                    </button>
                  )}
                </div>

                <CardContent className="space-y-4 pt-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="border-primary/25 bg-primary/5 text-primary">
                          {activeVideo.module}
                        </Badge>
                        {activeVideo.is_required ? (
                          <Badge variant="secondary">Required</Badge>
                        ) : (
                          <Badge variant="outline">Optional</Badge>
                        )}
                        {activeVideo.progress.completed_at ? (
                          <Badge className="gap-1 bg-green-600 text-white hover:bg-green-600">
                            <CheckCircle2 className="size-3.5" aria-hidden="true" />
                            Completed
                          </Badge>
                        ) : activeVideo.progress.completion_percent > 0 ? (
                          <Badge variant="outline" className="tabular-nums">
                            {activeVideo.progress.completion_percent}% watched
                          </Badge>
                        ) : null}
                      </div>
                      <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                        {activeVideo.title}
                      </h2>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {!activeVideo.progress.completed_at && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={saveProgress.isPending}
                          onClick={() =>
                            saveProgress.mutate({
                              videoId: activeVideo.id,
                              watchedSeconds:
                                activeVideo.duration_seconds ??
                                activeVideo.progress.watched_seconds,
                              durationSeconds: activeVideo.duration_seconds,
                              completed: true,
                            })
                          }
                        >
                          <CheckCircle2 className="mr-1.5 size-4 text-green-600" />
                          Mark as completed
                        </Button>
                      )}
                      {activeVideo.related_guide_url && (
                        <Button size="sm" variant="outline" asChild>
                          <Link href={activeVideo.related_guide_url}>
                            <BookOpen className="mr-1.5 size-4" />
                            Related guide
                            <ExternalLink className="ml-1.5 size-3" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>

                  {activeVideo.description && (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                      {activeVideo.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-1.5 border-t pt-3 text-xs text-muted-foreground">
                    <span>Audience:</span>
                    {activeVideo.departments.map((dept) => (
                      <Badge key={dept} variant="secondary" className="text-[11px] font-normal">
                        {dept === "General" ? "All Staff (General)" : dept}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="p-10 text-center text-sm text-muted-foreground">
                No videos match your search filter.
              </Card>
            )}
          </div>

          {/* Course Playlist Sidebar */}
          <aside className="space-y-4 lg:col-span-4 lg:sticky lg:top-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Training Playlist</CardTitle>
                <CardDescription>
                  {filteredVideos.length} video
                  {filteredVideos.length === 1 ? "" : "s"} assigned to you
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-[65vh] space-y-5 overflow-y-auto pt-0">
                {!groupedModules.length ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">
                    No matching videos.
                  </p>
                ) : (
                  groupedModules.map(([moduleName, moduleVideos]) => (
                    <div key={moduleName} className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {moduleName}
                      </p>
                      <div className="space-y-1.5">
                        {moduleVideos.map((video) => {
                          const isSelected = activeVideo?.id === video.id;
                          const isCompleted = Boolean(
                            video.progress.completed_at,
                          );
                          return (
                            <button
                              key={video.id}
                              type="button"
                              onClick={() => selectVideo(video, true)}
                              className={`flex w-full items-start gap-3 rounded-lg border p-2.5 text-left transition-colors ${
                                isSelected
                                  ? "border-primary bg-primary/5"
                                  : "border-transparent bg-muted/30 hover:bg-muted/60"
                              }`}
                            >
                              <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded bg-slate-900">
                                <img
                                  src={video.thumbnail_url}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                                {isCompleted ? (
                                  <span className="absolute right-1 bottom-1 rounded-full bg-green-600 p-0.5 text-white">
                                    <CheckCircle2 className="size-3" />
                                  </span>
                                ) : (
                                  <span className="absolute right-1 bottom-1 rounded bg-black/75 px-1 text-[10px] font-medium text-white tabular-nums">
                                    {formatDuration(video.duration_seconds)}
                                  </span>
                                )}
                              </div>
                              <div className="min-w-0 flex-1 space-y-1">
                                <p className="line-clamp-2 text-sm font-medium leading-snug">
                                  {video.title}
                                </p>
                                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                                  {video.is_required && (
                                    <span className="font-medium text-primary">
                                      Required
                                    </span>
                                  )}
                                  {isCompleted ? (
                                    <span className="text-green-600 dark:text-green-400">
                                      Done
                                    </span>
                                  ) : video.progress.completion_percent > 0 ? (
                                    <span>
                                      {video.progress.completion_percent}% watched
                                    </span>
                                  ) : (
                                    <span>Not started</span>
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      )}
    </div>
  );
}
