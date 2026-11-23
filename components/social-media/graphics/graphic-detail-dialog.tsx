"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GRAPHIC_CATEGORIES,
  GRAPHIC_PLATFORMS,
  GRAPHIC_STATUSES,
  GRAPHIC_STATUS_LABELS,
  getGraphicMediaUrl,
  getGraphicZipUrl,
  type GraphicStatus,
  type SocialMediaGraphic,
} from "@/types/social-media-graphics";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  ImagePlus,
  Loader2,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  copyTextToClipboard,
  formatDateTime,
  formatFileSize,
  triggerFileDownload,
} from "./formatters";

interface GraphicDetailDialogProps {
  graphic: SocialMediaGraphic | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  focusCaptionOnOpen?: boolean;
  canDelete: boolean;
  hasPreviousGraphic: boolean;
  hasNextGraphic: boolean;
  onNavigateGraphic: (direction: -1 | 1) => void;
  onSaveDetails: (
    id: string,
    payload: {
      title: string;
      category: string | null;
      caption: string | null;
      posted_platforms: string[];
      post_url: string | null;
    }
  ) => Promise<SocialMediaGraphic | void>;
  onChangeStatus: (
    id: string,
    status: GraphicStatus,
    extra?: { posted_platforms?: string[]; post_url?: string | null }
  ) => Promise<SocialMediaGraphic | void>;
  onDeleteGraphic: (id: string) => Promise<void>;
  onDeleteSlide: (graphicId: string, itemId: string) => Promise<void>;
  onGraphicUpdated: (updated: SocialMediaGraphic) => void;
}

export function GraphicDetailDialog({
  graphic,
  open,
  onOpenChange,
  focusCaptionOnOpen = false,
  canDelete,
  hasPreviousGraphic,
  hasNextGraphic,
  onNavigateGraphic,
  onSaveDetails,
  onChangeStatus,
  onDeleteGraphic,
  onDeleteSlide,
  onGraphicUpdated,
}: GraphicDetailDialogProps) {
  const [slideIndex, setSlideIndex] = React.useState(0);
  const [title, setTitle] = React.useState("");
  const [category, setCategory] = React.useState<string>("none");
  const [caption, setCaption] = React.useState("");
  const [platforms, setPlatforms] = React.useState<string[]>([]);
  const [postUrl, setPostUrl] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const [isAddingSlides, setIsAddingSlides] = React.useState(false);
  const [isStatusUpdating, setIsStatusUpdating] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  const captionRef = React.useRef<HTMLTextAreaElement>(null);
  const addSlideInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!graphic) return;
    setSlideIndex(0);
    setTitle(graphic.title);
    setCategory(graphic.category || "none");
    setCaption(graphic.caption ?? "");
    setPlatforms(graphic.posted_platforms ?? []);
    setPostUrl(graphic.post_url ?? "");
  }, [graphic]);

  React.useEffect(() => {
    if (!graphic) return;
    setSlideIndex((current) =>
      Math.min(current, Math.max(0, graphic.items.length - 1))
    );
  }, [graphic]);

  React.useEffect(() => {
    if (open && focusCaptionOnOpen) {
      const timer = window.setTimeout(() => {
        captionRef.current?.focus();
      }, 80);
      return () => window.clearTimeout(timer);
    }
  }, [open, focusCaptionOnOpen, graphic?.id]);

  React.useEffect(() => {
    if (!open || deleteDialogOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      const isEditingText =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        Boolean(target?.isContentEditable);

      if (isEditingText) return;

      if (event.key === "ArrowLeft" && hasPreviousGraphic) {
        event.preventDefault();
        onNavigateGraphic(-1);
      } else if (event.key === "ArrowRight" && hasNextGraphic) {
        event.preventDefault();
        onNavigateGraphic(1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    open,
    deleteDialogOpen,
    hasPreviousGraphic,
    hasNextGraphic,
    onNavigateGraphic,
  ]);

  if (!graphic) {
    return null;
  }

  const activeItem = graphic.items[slideIndex] ?? graphic.items[0];
  const normalizedTitle = title.trim();
  const normalizedCategory = category === "none" ? null : category;
  const normalizedCaption = caption.trim() ? caption.trim() : null;
  const normalizedPostUrl = postUrl.trim() ? postUrl.trim() : null;
  const savedPlatforms = [...(graphic.posted_platforms ?? [])].sort().join(",");
  const draftPlatforms = [...platforms].sort().join(",");

  const isDirty =
    normalizedTitle !== graphic.title ||
    normalizedCategory !== (graphic.category ?? null) ||
    normalizedCaption !== (graphic.caption ?? null) ||
    normalizedPostUrl !== (graphic.post_url ?? null) ||
    draftPlatforms !== savedPlatforms;

  const handleSave = async () => {
    if (!normalizedTitle) {
      toast.error("Please enter a title before saving.");
      return;
    }
    setIsSaving(true);
    try {
      await onSaveDetails(graphic.id, {
        title: normalizedTitle,
        category: normalizedCategory,
        caption: normalizedCaption,
        posted_platforms: platforms,
        post_url: normalizedPostUrl,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyCaption = async () => {
    const textToCopy = caption.trim();
    if (!textToCopy) return;
    const ok = await copyTextToClipboard(textToCopy);
    if (ok) {
      setCopied(true);
      toast.success("Caption copied to clipboard");
      window.setTimeout(() => setCopied(false), 1800);
    } else {
      toast.error("Unable to copy caption automatically");
    }
  };

  const handleStatusSwitch = async (nextStatus: GraphicStatus) => {
    if (nextStatus === graphic.status || isStatusUpdating) return;
    setIsStatusUpdating(true);
    try {
      await onChangeStatus(graphic.id, nextStatus, {
        posted_platforms: platforms,
        post_url: normalizedPostUrl,
      });
    } finally {
      setIsStatusUpdating(false);
    }
  };

  const togglePlatform = (value: string) => {
    setPlatforms((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  const handleAddSlides = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    setIsAddingSlides(true);
    try {
      let latest: SocialMediaGraphic = graphic;
      for (const file of files) {
        if (file.size > 15 * 1024 * 1024) {
          toast.error(`${file.name} exceeds the 15 MB limit.`);
          continue;
        }
        const form = new FormData();
        form.append("graphic_id", graphic.id);
        form.append("file", file, file.name);
        const response = await fetch("/api/social-media/graphics/upload", {
          method: "POST",
          body: form,
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload?.message || "Failed to add slide.");
        }
        latest = payload.data as SocialMediaGraphic;
      }
      onGraphicUpdated(latest);
      setSlideIndex(Math.max(0, latest.items.length - 1));
      toast.success("Slide added to carousel");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add slide."
      );
    } finally {
      setIsAddingSlides(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] max-w-5xl sm:max-w-5xl h-[90vh] max-h-[820px] p-0 gap-0 overflow-hidden flex flex-col">
          <DialogTitle className="sr-only">{graphic.title}</DialogTitle>
          <DialogDescription className="sr-only">
            Inspect graphic preview, edit collaborative caption, and update posting status.
          </DialogDescription>

          <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-12">
            {/* Left Stage: Compressed high-res preview & slide strip */}
            <div className="lg:col-span-7 flex min-h-0 flex-col border-b lg:border-b-0 lg:border-r bg-muted/35">
              <div className="relative flex min-h-[260px] flex-1 items-center justify-center overflow-hidden p-4 sm:p-6">
                {activeItem ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    key={activeItem.id}
                    src={getGraphicMediaUrl(
                      activeItem.id,
                      "preview",
                      activeItem.etag
                    )}
                    alt={`${graphic.title} — slide ${slideIndex + 1}`}
                    className="max-h-full max-w-full rounded-md object-contain shadow-sm"
                  />
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No preview available
                  </p>
                )}

                {graphic.items.length > 1 && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setSlideIndex((prev) => Math.max(0, prev - 1))
                      }
                      disabled={slideIndex === 0}
                      aria-label="Previous slide"
                      className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-background/90 backdrop-blur-xs shadow-sm"
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setSlideIndex((prev) =>
                          Math.min(graphic.items.length - 1, prev + 1)
                        )
                      }
                      disabled={slideIndex === graphic.items.length - 1}
                      aria-label="Next slide"
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-background/90 backdrop-blur-xs shadow-sm"
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </>
                )}
              </div>

              {graphic.items.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto border-t bg-background/60 px-4 py-2">
                  {graphic.items.map((slide, idx) => (
                    <div
                      key={slide.id}
                      className={cn(
                        "group/slide relative size-14 shrink-0 overflow-hidden rounded border bg-muted cursor-pointer transition-all",
                        idx === slideIndex
                          ? "ring-2 ring-primary border-primary"
                          : "opacity-75 hover:opacity-100"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setSlideIndex(idx)}
                        className="block size-full cursor-pointer"
                        aria-label={`View slide ${idx + 1}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getGraphicMediaUrl(slide.id, "thumb", slide.etag)}
                          alt={slide.original_name}
                          className="size-full object-cover"
                        />
                      </button>
                      {canDelete && graphic.items.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void onDeleteSlide(graphic.id, slide.id);
                          }}
                          aria-label={`Remove slide ${idx + 1}`}
                          className="absolute top-0.5 right-0.5 hidden group-hover/slide:flex size-4 items-center justify-center rounded-full bg-destructive text-white cursor-pointer"
                        >
                          <X className="size-2.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-card px-4 py-2.5 text-xs">
                <div className="text-muted-foreground tabular-nums">
                  {activeItem ? (
                    <span>
                      {activeItem.width && activeItem.height
                        ? `${activeItem.width} × ${activeItem.height}px · `
                        : ""}
                      {formatFileSize(activeItem.file_size)} original
                    </span>
                  ) : (
                    <span>No file attached</span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <input
                    ref={addSlideInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    className="sr-only"
                    onChange={(e) => {
                      void handleAddSlides(e.target.files);
                      e.target.value = "";
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isAddingSlides || graphic.items.length >= 15}
                    onClick={() => addSlideInputRef.current?.click()}
                  >
                    {isAddingSlides ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <ImagePlus className="size-3.5" />
                    )}
                    Add Slide
                  </Button>

                  {activeItem && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        triggerFileDownload(
                          getGraphicMediaUrl(
                            activeItem.id,
                            "original",
                            activeItem.etag
                          ),
                          activeItem.original_name
                        )
                      }
                    >
                      <Download className="size-3.5" />
                      Download Original
                    </Button>
                  )}

                  {graphic.items.length > 1 && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() =>
                        triggerFileDownload(getGraphicZipUrl(graphic.id))
                      }
                    >
                      <Download className="size-3.5" />
                      All ({graphic.items.length}) .zip
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Right Inspector: Title, Category, Collaborative Caption, Status & Audit */}
            <div className="lg:col-span-5 flex min-h-0 flex-col bg-card">
              <div className="flex items-center justify-between gap-2 border-b px-5 py-3 pr-12">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      graphic.status === "fresh"
                        ? "default"
                        : graphic.status === "posted"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {GRAPHIC_STATUS_LABELS[graphic.status]}
                  </Badge>
                  {graphic.items.length > 1 && (
                    <span className="text-xs text-muted-foreground tabular-nums">
                      Slide {slideIndex + 1} of {graphic.items.length}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={!hasPreviousGraphic}
                    onClick={() => onNavigateGraphic(-1)}
                    title="Previous graphic (Left Arrow)"
                    aria-label="Previous graphic"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={!hasNextGraphic}
                    onClick={() => onNavigateGraphic(1)}
                    title="Next graphic (Right Arrow)"
                    aria-label="Next graphic"
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="detail-graphic-title">Title</Label>
                    <Input
                      id="detail-graphic-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="h-9"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="detail-graphic-category">Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger
                        id="detail-graphic-category"
                        className="h-9 w-full"
                      >
                        <SelectValue placeholder="Choose category..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No category</SelectItem>
                        {GRAPHIC_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="detail-graphic-caption">
                      Caption & Notes
                    </Label>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground tabular-nums">
                        {caption.length} chars
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!caption.trim()}
                        onClick={handleCopyCaption}
                      >
                        {copied ? (
                          <>
                            <Check className="size-3 text-emerald-600 dark:text-emerald-400" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="size-3" />
                            Copy Caption
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <Textarea
                    ref={captionRef}
                    id="detail-graphic-caption"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                        e.preventDefault();
                        if (isDirty) void handleSave();
                      }
                    }}
                    placeholder="Write the social media caption, hashtags, or posting instructions for whoever publishes this..."
                    className="min-h-36 resize-y text-sm leading-relaxed"
                  />

                  <p className="text-[11px] text-muted-foreground">
                    {graphic.caption_updated_by
                      ? `Last edited by ${graphic.caption_updated_by.name}${graphic.caption_updated_at ? ` · ${formatDateTime(graphic.caption_updated_at)}` : ""}`
                      : "No caption yet — any social media officer can write or update this."}
                  </p>
                </div>

                <div className="space-y-3 border-t pt-4">
                  <div className="space-y-1.5">
                    <Label>Workflow Status</Label>
                    <div className="grid grid-cols-3 gap-1.5 rounded-lg bg-muted/60 p-1">
                      {GRAPHIC_STATUSES.map((statusOption) => {
                        const active = graphic.status === statusOption;
                        return (
                          <button
                            key={statusOption}
                            type="button"
                            disabled={isStatusUpdating}
                            onClick={() => handleStatusSwitch(statusOption)}
                            className={cn(
                              "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                              active
                                ? "bg-background text-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {GRAPHIC_STATUS_LABELS[statusOption]}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      Posted Platforms
                    </Label>
                    <div className="flex flex-wrap gap-1.5">
                      {GRAPHIC_PLATFORMS.map((platform) => {
                        const active = platforms.includes(platform.value);
                        return (
                          <button
                            key={platform.value}
                            type="button"
                            onClick={() => togglePlatform(platform.value)}
                            className={cn(
                              "rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors cursor-pointer",
                              active
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-background text-foreground hover:bg-muted"
                            )}
                          >
                            {platform.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="detail-graphic-post-url"
                      className="text-xs text-muted-foreground"
                    >
                      Published Post Link
                    </Label>
                    <div className="flex items-center gap-1.5">
                      <Input
                        id="detail-graphic-post-url"
                        type="url"
                        value={postUrl}
                        onChange={(e) => setPostUrl(e.target.value)}
                        placeholder="https://instagram.com/p/..."
                        className="h-9"
                      />
                      {normalizedPostUrl && /^https?:\/\//i.test(normalizedPostUrl) && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="size-9 shrink-0"
                          asChild
                        >
                          <a
                            href={normalizedPostUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Open published post link"
                          >
                            <ExternalLink className="size-3.5" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 border-t pt-4 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">Activity</p>
                  <p>
                    Uploaded by{" "}
                    <span className="text-foreground">
                      {graphic.uploaded_by?.name ?? "Unknown"}
                    </span>
                    {graphic.created_at
                      ? ` · ${formatDateTime(graphic.created_at)}`
                      : ""}
                  </p>
                  {graphic.posted_by && (
                    <p>
                      Marked posted by{" "}
                      <span className="text-foreground">
                        {graphic.posted_by.name}
                      </span>
                      {graphic.posted_at
                        ? ` · ${formatDateTime(graphic.posted_at)}`
                        : ""}
                    </p>
                  )}
                  {graphic.archived_by && (
                    <p>
                      Archived by{" "}
                      <span className="text-foreground">
                        {graphic.archived_by.name}
                      </span>
                      {graphic.archived_at
                        ? ` · ${formatDateTime(graphic.archived_at)}`
                        : ""}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 border-t bg-muted/20 px-5 py-3">
                {canDelete ? (
                  <Button
                    type="button"
                    variant="destructive"
                    size="lg"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="size-3.5" />
                    Delete
                  </Button>
                ) : (
                  <span className="text-[11px] text-muted-foreground">
                    {isDirty ? "Unsaved changes" : "All changes saved"}
                  </span>
                )}

                <Button
                  type="button"
                  size="lg"
                  disabled={!isDirty || isSaving}
                  onClick={handleSave}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Save className="size-3.5" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this graphic?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{graphic.title}&rdquo; and all attached image files will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                setDeleteDialogOpen(false);
                void onDeleteGraphic(graphic.id);
              }}
            >
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
