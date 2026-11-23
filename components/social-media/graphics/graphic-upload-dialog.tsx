"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  type SocialMediaGraphic,
} from "@/types/social-media-graphics";
import {
  ArrowDown,
  ArrowUp,
  ImagePlus,
  Layers,
  LayoutGrid,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatFileSize } from "./formatters";

const MAX_FILE_BYTES = 15 * 1024 * 1024;
const MAX_BATCH_FILES = 10;
const ACCEPTED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

interface QueuedGraphicFile {
  id: string;
  file: File;
  previewUrl: string;
}

interface GraphicUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialFiles?: File[];
  onUploaded: (createdCount: number, latestGraphic?: SocialMediaGraphic) => void;
}

export function GraphicUploadDialog({
  open,
  onOpenChange,
  initialFiles,
  onUploaded,
}: GraphicUploadDialogProps) {
  const [queued, setQueued] = React.useState<QueuedGraphicFile[]>([]);
  const [mode, setMode] = React.useState<"separate" | "carousel">("separate");
  const [title, setTitle] = React.useState("");
  const [category, setCategory] = React.useState<string>("none");
  const [caption, setCaption] = React.useState("");
  const [isDragging, setIsDragging] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [progress, setProgress] = React.useState<{
    current: number;
    total: number;
  } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const queuedRef = React.useRef<QueuedGraphicFile[]>([]);
  queuedRef.current = queued;

  const revokeQueue = React.useCallback((items: QueuedGraphicFile[]) => {
    for (const item of items) {
      URL.revokeObjectURL(item.previewUrl);
    }
  }, []);

  React.useEffect(() => {
    return () => {
      revokeQueue(queuedRef.current);
    };
  }, [revokeQueue]);

  const appendFiles = React.useCallback((incoming: FileList | File[]) => {
    const list = Array.from(incoming);
    if (list.length === 0) return;

    const accepted: QueuedGraphicFile[] = [];
    const rejectedMessages: string[] = [];

    for (const file of list) {
      if (!ACCEPTED_TYPES.has(file.type)) {
        rejectedMessages.push(`${file.name}: unsupported image format`);
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        rejectedMessages.push(`${file.name}: exceeds 15 MB limit`);
        continue;
      }
      accepted.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    if (rejectedMessages.length > 0) {
      toast.error(rejectedMessages.slice(0, 2).join(". "));
    }

    if (accepted.length === 0) return;

    setQueued((prev) => {
      const available = MAX_BATCH_FILES - prev.length;
      if (available <= 0) {
        revokeQueue(accepted);
        toast.error(`You can queue up to ${MAX_BATCH_FILES} images at a time.`);
        return prev;
      }

      const slice = accepted.slice(0, available);
      if (accepted.length > available) {
        revokeQueue(accepted.slice(available));
        toast.info(`Added ${available} of ${accepted.length} files (max ${MAX_BATCH_FILES} per upload).`);
      }

      return [...prev, ...slice];
    });
  }, [revokeQueue]);

  React.useEffect(() => {
    if (open && initialFiles && initialFiles.length > 0) {
      appendFiles(initialFiles);
    }
  }, [open, initialFiles, appendFiles]);

  const resetForm = React.useCallback(() => {
    setQueued((prev) => {
      revokeQueue(prev);
      return [];
    });
    setMode("separate");
    setTitle("");
    setCategory("none");
    setCaption("");
    setProgress(null);
  }, [revokeQueue]);

  const handleClose = (nextOpen: boolean) => {
    if (isUploading) return;
    if (!nextOpen) {
      resetForm();
    }
    onOpenChange(nextOpen);
  };

  const removeFile = (id: string) => {
    setQueued((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  };

  const moveFile = (index: number, direction: -1 | 1) => {
    setQueued((prev) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(index, 1);
      copy.splice(targetIndex, 0, moved);
      return copy;
    });
  };

  const uploadSingleRequest = async (formData: FormData): Promise<SocialMediaGraphic> => {
    const response = await fetch("/api/social-media/graphics/upload", {
      method: "POST",
      body: formData,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message =
        payload?.message ||
        payload?.error ||
        `Upload failed (status ${response.status})`;
      throw new Error(message);
    }
    return payload.data as SocialMediaGraphic;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (queued.length === 0 || isUploading) return;

    setIsUploading(true);
    const normalizedCategory = category !== "none" ? category : "";
    const trimmedCaption = caption.trim();
    const trimmedTitle = title.trim();

    try {
      if (queued.length === 1 || mode === "carousel") {
        setProgress({ current: 1, total: queued.length });

        const firstForm = new FormData();
        firstForm.append("file", queued[0].file, queued[0].file.name);
        if (trimmedTitle) firstForm.append("title", trimmedTitle);
        if (normalizedCategory) firstForm.append("category", normalizedCategory);
        if (trimmedCaption) firstForm.append("caption", trimmedCaption);
        firstForm.append("status", "fresh");

        let created = await uploadSingleRequest(firstForm);

        for (let i = 1; i < queued.length; i += 1) {
          setProgress({ current: i + 1, total: queued.length });
          const slideForm = new FormData();
          slideForm.append("graphic_id", created.id);
          slideForm.append("file", queued[i].file, queued[i].file.name);
          created = await uploadSingleRequest(slideForm);
        }

        toast.success(
          queued.length > 1
            ? `Uploaded carousel with ${queued.length} slides to Fresh.`
            : `"${created.title}" added to Fresh.`
        );
        resetForm();
        onOpenChange(false);
        onUploaded(1, created);
      } else {
        let uploadedCount = 0;
        let latest: SocialMediaGraphic | undefined;
        const remaining = [...queued];

        for (let i = 0; i < queued.length; i += 1) {
          const entry = queued[i];
          setProgress({ current: i + 1, total: queued.length });
          const itemForm = new FormData();
          itemForm.append("file", entry.file, entry.file.name);
          if (normalizedCategory) itemForm.append("category", normalizedCategory);
          if (trimmedCaption) itemForm.append("caption", trimmedCaption);
          itemForm.append("status", "fresh");

          latest = await uploadSingleRequest(itemForm);
          uploadedCount += 1;
          URL.revokeObjectURL(entry.previewUrl);
          const idx = remaining.findIndex((r) => r.id === entry.id);
          if (idx !== -1) remaining.splice(idx, 1);
        }

        toast.success(`Uploaded ${uploadedCount} graphics to Fresh.`);
        setQueued(remaining);
        resetForm();
        onOpenChange(false);
        onUploaded(uploadedCount, latest);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to upload graphic.";
      toast.error(message);
    } finally {
      setIsUploading(false);
      setProgress(null);
    }
  };

  const showSingleTitleField = queued.length <= 1 || mode === "carousel";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle className="text-base font-semibold">
            Upload Graphics
          </DialogTitle>
          <DialogDescription>
            New uploads land in Fresh so any social media officer can add captions and publish.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragging(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files?.length) {
                  appendFiles(e.dataTransfer.files);
                }
              }}
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-6 text-center transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border bg-muted/25 hover:bg-muted/45"
              )}
            >
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ImagePlus className="size-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-foreground">
                  Drop PNG, JPG, WebP, or GIF files here
                </p>
                <p className="text-xs text-muted-foreground">
                  Up to {MAX_BATCH_FILES} images, 15 MB max each. Originals stay untouched.
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="sr-only"
                onChange={(e) => {
                  if (e.target.files?.length) {
                    appendFiles(e.target.files);
                    e.target.value = "";
                  }
                }}
              />
            </div>

            {queued.length > 0 && (
              <div className="space-y-3">
                {queued.length > 1 && (
                  <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/60 p-1">
                    <button
                      type="button"
                      onClick={() => setMode("separate")}
                      className={cn(
                        "flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                        mode === "separate"
                          ? "bg-background text-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <LayoutGrid className="size-3.5" />
                      Separate posts ({queued.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode("carousel")}
                      className={cn(
                        "flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                        mode === "carousel"
                          ? "bg-background text-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Layers className="size-3.5" />
                      One carousel ({queued.length} slides)
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {queued.map((item, idx) => (
                    <div
                      key={item.id}
                      className="group relative flex flex-col overflow-hidden rounded-md border bg-muted/20"
                    >
                      <div className="relative aspect-square bg-muted/40 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.previewUrl}
                          alt={item.file.name}
                          className="h-full w-full object-contain"
                        />
                        {mode === "carousel" && queued.length > 1 && (
                          <span className="absolute top-1.5 left-1.5 rounded bg-background/90 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums shadow-xs">
                            Slide {idx + 1}
                          </span>
                        )}
                        <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                          {mode === "carousel" && queued.length > 1 && (
                            <>
                              <button
                                type="button"
                                disabled={idx === 0 || isUploading}
                                onClick={() => moveFile(idx, -1)}
                                aria-label={`Move ${item.file.name} earlier`}
                                className="flex size-6 items-center justify-center rounded bg-background/90 text-foreground shadow-xs hover:bg-background disabled:opacity-40 cursor-pointer"
                              >
                                <ArrowUp className="size-3" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === queued.length - 1 || isUploading}
                                onClick={() => moveFile(idx, 1)}
                                aria-label={`Move ${item.file.name} later`}
                                className="flex size-6 items-center justify-center rounded bg-background/90 text-foreground shadow-xs hover:bg-background disabled:opacity-40 cursor-pointer"
                              >
                                <ArrowDown className="size-3" />
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            disabled={isUploading}
                            onClick={() => removeFile(item.id)}
                            aria-label={`Remove ${item.file.name}`}
                            className="flex size-6 items-center justify-center rounded bg-background/90 text-destructive shadow-xs hover:bg-destructive hover:text-white cursor-pointer"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </div>
                      </div>
                      <div className="px-2 py-1 text-[11px] flex items-center justify-between gap-1 border-t bg-card">
                        <span className="truncate font-medium">{item.file.name}</span>
                        <span className="shrink-0 text-muted-foreground tabular-nums">
                          {formatFileSize(item.file.size)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              {showSingleTitleField && (
                <div className="space-y-1.5">
                  <Label htmlFor="graphic-upload-title">
                    Title <span className="text-muted-foreground font-normal">(optional)</span>
                  </Label>
                  <Input
                    id="graphic-upload-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Defaults to file name"
                    className="h-9"
                    disabled={isUploading}
                  />
                </div>
              )}

              <div className={cn("space-y-1.5", !showSingleTitleField && "sm:col-span-2")}>
                <Label htmlFor="graphic-upload-category">
                  Category <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Select
                  value={category}
                  onValueChange={setCategory}
                  disabled={isUploading}
                >
                  <SelectTrigger id="graphic-upload-category" className="h-9 w-full">
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

            {!showSingleTitleField && (
              <p className="text-xs text-muted-foreground">
                Each uploaded graphic gets its title from its file name automatically.
              </p>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="graphic-upload-caption">
                Caption / Notes <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Textarea
                id="graphic-upload-caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Leave blank if another officer will write the caption later..."
                className="min-h-20 resize-y"
                disabled={isUploading}
              />
            </div>
          </div>

          <DialogFooter className="border-t px-5 py-3 bg-muted/20 flex items-center justify-between sm:justify-between">
            <span className="text-xs text-muted-foreground tabular-nums">
              {progress
                ? `Uploading ${progress.current} of ${progress.total}…`
                : queued.length > 0
                  ? `${queued.length} file${queued.length > 1 ? "s" : ""} ready`
                  : "Select at least 1 image"}
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => handleClose(false)}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="lg"
                disabled={queued.length === 0 || isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <Upload className="size-4" />
                    Upload to Fresh
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
