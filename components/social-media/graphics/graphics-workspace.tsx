"use client";

import * as React from "react";
import {
  useInfiniteQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  bulkUpdateSocialMediaGraphicStatus,
  deleteSocialMediaGraphic,
  deleteSocialMediaGraphicItem,
  getSocialMediaGraphics,
  updateSocialMediaGraphic,
  updateSocialMediaGraphicStatus,
} from "@/lib/api/social-media-graphics";
import { canDeleteSocialMediaGraphic } from "@/lib/social-media-graphics-access";
import { useUser } from "@/providers/user-provider";
import {
  GRAPHIC_CATEGORIES,
  GRAPHIC_STATUSES,
  GRAPHIC_STATUS_LABELS,
  type CaptionStateFilter,
  type GraphicStatus,
  type SocialMediaGraphic,
  type SocialMediaGraphicsCounts,
  type SocialMediaGraphicsPageResponse,
} from "@/types/social-media-graphics";
import {
  Archive,
  ImagePlus,
  Images,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { GraphicCard } from "./graphic-card";
import { GraphicDetailDialog } from "./graphic-detail-dialog";
import { GraphicUploadDialog } from "./graphic-upload-dialog";

const EMPTY_COUNTS: SocialMediaGraphicsCounts = {
  fresh: 0,
  posted: 0,
  archived: 0,
  fresh_missing_caption: 0,
  fresh_with_caption: 0,
};

export function SocialMediaGraphicsWorkspace() {
  const { user } = useUser();
  const queryClient = useQueryClient();

  const [status, setStatus] = React.useState<GraphicStatus>("fresh");
  const [searchInput, setSearchInput] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [category, setCategory] = React.useState<string>("all");
  const [captionState, setCaptionState] =
    React.useState<CaptionStateFilter>("all");
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(
    () => new Set()
  );
  const [updatingIds, setUpdatingIds] = React.useState<Set<string>>(
    () => new Set()
  );
  const [isBulkUpdating, setIsBulkUpdating] = React.useState(false);

  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [droppedFiles, setDroppedFiles] = React.useState<File[] | undefined>();
  const [isWorkspaceDragging, setIsWorkspaceDragging] = React.useState(false);

  const [activeGraphicId, setActiveGraphicId] = React.useState<string | null>(
    null
  );
  const [focusCaptionOnOpen, setFocusCaptionOnOpen] = React.useState(false);
  const [lastKnownCounts, setLastKnownCounts] =
    React.useState<SocialMediaGraphicsCounts>(EMPTY_COUNTS);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 280);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  React.useEffect(() => {
    setSelectedIds(new Set());
  }, [status, debouncedSearch, category, captionState]);

  const queryKey = React.useMemo(
    () => [
      "social-media-graphics",
      status,
      debouncedSearch,
      category,
      captionState,
    ],
    [status, debouncedSearch, category, captionState]
  );

  const graphicsQuery = useInfiniteQuery({
    queryKey,
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      getSocialMediaGraphics({
        status,
        search: debouncedSearch || undefined,
        category: category !== "all" ? category : undefined,
        caption_state: captionState !== "all" ? captionState : undefined,
        page: pageParam,
        per_page: 24,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.meta.has_more ? lastPage.meta.current_page + 1 : undefined,
    staleTime: 30_000,
  });

  const latestCounts = graphicsQuery.data?.pages[0]?.counts;
  React.useEffect(() => {
    if (latestCounts) {
      setLastKnownCounts(latestCounts);
    }
  }, [latestCounts]);

  const counts = latestCounts ?? lastKnownCounts;
  const graphics = React.useMemo(
    () => graphicsQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [graphicsQuery.data]
  );
  const totalInCurrentView = graphicsQuery.data?.pages[0]?.meta.total ?? 0;

  const activeIndex = React.useMemo(
    () =>
      activeGraphicId
        ? graphics.findIndex((item) => item.id === activeGraphicId)
        : -1,
    [graphics, activeGraphicId]
  );
  const activeGraphic = activeIndex >= 0 ? graphics[activeIndex] : null;

  const invalidateBoard = React.useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: ["social-media-graphics"],
    });
  }, [queryClient]);

  const patchGraphicInCache = React.useCallback(
    (updated: SocialMediaGraphic) => {
      queryClient.setQueriesData<InfiniteData<SocialMediaGraphicsPageResponse>>(
        { queryKey: ["social-media-graphics"] },
        (existing) => {
          if (!existing) return existing;
          return {
            ...existing,
            pages: existing.pages.map((page) => ({
              ...page,
              data: page.data.map((item) =>
                item.id === updated.id ? updated : item
              ),
            })),
          };
        }
      );
    },
    [queryClient]
  );

  const markIdUpdating = (id: string, busy: boolean) => {
    setUpdatingIds((prev) => {
      const next = new Set(prev);
      if (busy) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleStatusChange = async (
    id: string,
    nextStatus: GraphicStatus,
    extra?: { posted_platforms?: string[]; post_url?: string | null }
  ) => {
    const previousGraphic = graphics.find((g) => g.id === id);
    const previousStatus = previousGraphic?.status;

    markIdUpdating(id, true);
    try {
      const updated = await updateSocialMediaGraphicStatus(id, {
        status: nextStatus,
        ...extra,
      });

      setSelectedIds((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

      await invalidateBoard();

      if (previousGraphic && previousStatus && previousStatus !== nextStatus) {
        toast.success(
          `Moved "${updated.title}" to ${GRAPHIC_STATUS_LABELS[nextStatus]}.`,
          {
            action: {
              label: "Undo",
              onClick: () => {
                void updateSocialMediaGraphicStatus(id, {
                  status: previousStatus,
                }).then(() => invalidateBoard());
              },
            },
          }
        );
      } else {
        toast.success(`Updated status to ${GRAPHIC_STATUS_LABELS[nextStatus]}.`);
      }

      return updated;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update status."
      );
    } finally {
      markIdUpdating(id, false);
    }
  };

  const handleSaveDetails = async (
    id: string,
    payload: {
      title: string;
      category: string | null;
      caption: string | null;
      posted_platforms: string[];
      post_url: string | null;
    }
  ) => {
    try {
      const updated = await updateSocialMediaGraphic(id, payload);
      patchGraphicInCache(updated);
      await invalidateBoard();
      toast.success("Graphic details saved.");
      return updated;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save changes."
      );
    }
  };

  const handleDeleteGraphic = async (id: string) => {
    markIdUpdating(id, true);
    try {
      await deleteSocialMediaGraphic(id);
      if (activeGraphicId === id) {
        setActiveGraphicId(null);
      }
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      await invalidateBoard();
      toast.success("Graphic deleted.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete graphic."
      );
    } finally {
      markIdUpdating(id, false);
    }
  };

  const handleDeleteSlide = async (graphicId: string, itemId: string) => {
    try {
      const updated = await deleteSocialMediaGraphicItem(graphicId, itemId);
      patchGraphicInCache(updated);
      await invalidateBoard();
      toast.success("Slide removed from carousel.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to remove slide."
      );
    }
  };

  const handleBulkMove = async (targetStatus: GraphicStatus) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0 || isBulkUpdating) return;

    setIsBulkUpdating(true);
    try {
      const res = await bulkUpdateSocialMediaGraphicStatus({
        ids,
        status: targetStatus,
      });
      setSelectedIds(new Set());
      await invalidateBoard();
      toast.success(
        `Moved ${res.updated_count} graphic${res.updated_count === 1 ? "" : "s"} to ${GRAPHIC_STATUS_LABELS[targetStatus]}.`
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Bulk status update failed."
      );
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setCategory("all");
    setCaptionState("all");
  };

  const hasActiveFilters =
    debouncedSearch !== "" || category !== "all" || captionState !== "all";

  return (
    <div
      className="relative flex min-w-0 flex-1 flex-col gap-5"
      onDragOver={(e) => {
        if (e.dataTransfer?.types?.includes("Files")) {
          e.preventDefault();
          setIsWorkspaceDragging(true);
        }
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) {
          setIsWorkspaceDragging(false);
        }
      }}
      onDrop={(e) => {
        if (e.dataTransfer?.files?.length) {
          e.preventDefault();
          setIsWorkspaceDragging(false);
          setDroppedFiles(Array.from(e.dataTransfer.files));
          setUploadOpen(true);
        }
      }}
    >
      {isWorkspaceDragging && (
        <div
          onDragLeave={() => setIsWorkspaceDragging(false)}
          className="fixed inset-0 z-40 flex items-center justify-center bg-background/80 backdrop-blur-xs p-6"
        >
          <div className="flex max-w-md flex-col items-center gap-2 rounded-xl border-2 border-dashed border-primary bg-card p-10 text-center shadow-lg">
            <ImagePlus className="size-10 text-primary" />
            <p className="text-base font-semibold">Drop graphics to upload</p>
            <p className="text-xs text-muted-foreground">
              Release to review files and add them to the Fresh queue.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Graphics Library</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Upload ready-to-post flyers, collaborate on captions, and track what has been posted or archived.
          </p>
        </div>

        <Button
          type="button"
          size="lg"
          onClick={() => {
            setDroppedFiles(undefined);
            setUploadOpen(true);
          }}
        >
          <Upload className="size-4" />
          Upload Graphics
        </Button>
      </div>

      {/* Status Tabs + Filters */}
      <div className="flex flex-col gap-3 rounded-lg border bg-card p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            role="tablist"
            aria-label="Graphic workflow stages"
            className="inline-flex flex-wrap items-center gap-1 rounded-lg bg-muted p-1"
          >
            {GRAPHIC_STATUSES.map((tab) => {
              const active = status === tab;
              const count = counts[tab];
              return (
                <button
                  key={tab}
                  role="tab"
                  type="button"
                  aria-selected={active}
                  onClick={() => setStatus(tab)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                    active
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span>{GRAPHIC_STATUS_LABELS[tab]}</span>
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                      active
                        ? "bg-primary/15 text-primary"
                        : "bg-background/60 text-muted-foreground"
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="inline-flex flex-wrap items-center gap-1.5">
            {(
              [
                { value: "all", label: "All captions" },
                {
                  value: "missing_caption",
                  label: "Needs caption",
                  badge:
                    status === "fresh" && counts.fresh_missing_caption > 0
                      ? counts.fresh_missing_caption
                      : undefined,
                },
                { value: "with_caption", label: "Caption ready" },
              ] as const
            ).map((option) => {
              const active = captionState === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setCaptionState(option.value)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span>{option.label}</span>
                  {"badge" in option && option.badge !== undefined && (
                    <span className="rounded-full bg-amber-500/20 px-1.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300 tabular-nums">
                      {option.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search title, caption, or uploader…"
              aria-label="Search graphics"
              className="h-9 pl-9 pr-8"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger
              aria-label="Filter by category"
              className="h-9 w-full sm:w-48"
            >
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {GRAPHIC_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="lg"
              onClick={clearFilters}
            >
              Clear filters
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            disabled={graphicsQuery.isFetching}
            onClick={() => void graphicsQuery.refetch()}
            title="Refresh graphics"
            aria-label="Refresh graphics"
          >
            <RefreshCw
              className={cn(
                "size-4",
                graphicsQuery.isFetching && "animate-spin"
              )}
            />
          </Button>
        </div>
      </div>

      {/* Bulk Selection Bar */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5">
          <div className="flex items-center gap-3 text-xs font-medium">
            <span className="tabular-nums">
              {selectedIds.size} graphic{selectedIds.size === 1 ? "" : "s"} selected
            </span>
            {selectedIds.size < graphics.length && (
              <button
                type="button"
                onClick={() =>
                  setSelectedIds(new Set(graphics.map((item) => item.id)))
                }
                className="text-primary hover:underline cursor-pointer"
              >
                Select all loaded ({graphics.length})
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {status !== "posted" && (
              <Button
                type="button"
                size="sm"
                disabled={isBulkUpdating}
                onClick={() => void handleBulkMove("posted")}
              >
                <Send className="size-3.5" />
                Mark Posted
              </Button>
            )}
            {status !== "archived" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isBulkUpdating}
                onClick={() => void handleBulkMove("archived")}
              >
                <Archive className="size-3.5" />
                Archive
              </Button>
            )}
            {status !== "fresh" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isBulkUpdating}
                onClick={() => void handleBulkMove("fresh")}
              >
                <RotateCcw className="size-3.5" />
                Move to Fresh
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isBulkUpdating}
              onClick={() => setSelectedIds(new Set())}
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Grid / Loading / Error / Empty states */}
      {graphicsQuery.isPending ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              className="flex flex-col overflow-hidden rounded-lg border bg-card"
            >
              <Skeleton className="aspect-4/5 w-full rounded-none" />
              <div className="space-y-2 p-3.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : graphicsQuery.isError ? (
        <div
          role="alert"
          className="flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-10 text-center"
        >
          <p className="text-sm font-medium text-destructive">
            {graphicsQuery.error.message}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => void graphicsQuery.refetch()}
          >
            Retry
          </Button>
        </div>
      ) : graphics.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-muted/15 px-6 py-14 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Images className="size-6" />
          </div>
          <div className="space-y-1 max-w-md">
            <h2 className="text-base font-semibold">
              {hasActiveFilters
                ? "No graphics match these filters"
                : status === "fresh"
                  ? "No fresh graphics waiting to be posted"
                  : status === "posted"
                    ? "No posted graphics yet"
                    : "Archive is empty"}
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {hasActiveFilters
                ? "Try clearing your search or switching the caption and category filters."
                : status === "fresh"
                  ? "Drag and drop flyer designs onto this page or upload them to start preparing captions."
                  : status === "posted"
                    ? "Graphics marked as Posted from Fresh will show up here with their platforms and links."
                    : "Retired or seasonal graphics archived by the team are kept here and can be restored anytime."}
            </p>
          </div>
          {hasActiveFilters ? (
            <Button type="button" variant="outline" onClick={clearFilters}>
              Clear filters
            </Button>
          ) : status === "fresh" ? (
            <Button
              type="button"
              onClick={() => {
                setDroppedFiles(undefined);
                setUploadOpen(true);
              }}
            >
              <Upload className="size-4" />
              Upload first graphic
            </Button>
          ) : null}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {graphics.map((graphic) => (
              <GraphicCard
                key={graphic.id}
                graphic={graphic}
                selected={selectedIds.has(graphic.id)}
                hasAnySelection={selectedIds.size > 0}
                canDelete={canDeleteSocialMediaGraphic(user, graphic)}
                isUpdating={updatingIds.has(graphic.id)}
                onToggleSelect={toggleSelect}
                onOpenDetail={(item, options) => {
                  setFocusCaptionOnOpen(Boolean(options?.focusCaption));
                  setActiveGraphicId(item.id);
                }}
                onChangeStatus={handleStatusChange}
                onDelete={handleDeleteGraphic}
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs text-muted-foreground">
            <span className="tabular-nums">
              Showing {graphics.length} of {totalInCurrentView}
            </span>
            {graphicsQuery.hasNextPage && (
              <Button
                type="button"
                variant="outline"
                size="lg"
                disabled={graphicsQuery.isFetchingNextPage}
                onClick={() => void graphicsQuery.fetchNextPage()}
              >
                {graphicsQuery.isFetchingNextPage ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Loading more…
                  </>
                ) : (
                  "Load more graphics"
                )}
              </Button>
            )}
          </div>
        </>
      )}

      <GraphicUploadDialog
        open={uploadOpen}
        onOpenChange={(next) => {
          setUploadOpen(next);
          if (!next) setDroppedFiles(undefined);
        }}
        initialFiles={droppedFiles}
        onUploaded={() => {
          setStatus("fresh");
          void invalidateBoard();
        }}
      />

      <GraphicDetailDialog
        graphic={activeGraphic}
        open={Boolean(activeGraphic)}
        onOpenChange={(next) => {
          if (!next) {
            setActiveGraphicId(null);
            setFocusCaptionOnOpen(false);
          }
        }}
        focusCaptionOnOpen={focusCaptionOnOpen}
        canDelete={
          activeGraphic
            ? canDeleteSocialMediaGraphic(user, activeGraphic)
            : false
        }
        hasPreviousGraphic={activeIndex > 0}
        hasNextGraphic={
          activeIndex >= 0 && activeIndex < graphics.length - 1
        }
        onNavigateGraphic={(dir) => {
          const next = graphics[activeIndex + dir];
          if (next) {
            setFocusCaptionOnOpen(false);
            setActiveGraphicId(next.id);
          }
        }}
        onSaveDetails={handleSaveDetails}
        onChangeStatus={handleStatusChange}
        onDeleteGraphic={handleDeleteGraphic}
        onDeleteSlide={handleDeleteSlide}
        onGraphicUpdated={(updated) => {
          patchGraphicInCache(updated);
          void invalidateBoard();
        }}
      />
    </div>
  );
}
