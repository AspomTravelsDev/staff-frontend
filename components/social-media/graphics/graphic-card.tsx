"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  GRAPHIC_PLATFORMS,
  getGraphicMediaUrl,
  getGraphicZipUrl,
  type GraphicStatus,
  type SocialMediaGraphic,
} from "@/types/social-media-graphics";
import {
  Archive,
  Check,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Layers,
  MoreHorizontal,
  PencilLine,
  RotateCcw,
  Send,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  copyTextToClipboard,
  formatShortDate,
  getFirstName,
  getPlatformLabel,
  triggerFileDownload,
} from "./formatters";

interface GraphicCardProps {
  graphic: SocialMediaGraphic;
  selected: boolean;
  hasAnySelection: boolean;
  canDelete: boolean;
  isUpdating: boolean;
  onToggleSelect: (id: string) => void;
  onOpenDetail: (graphic: SocialMediaGraphic, options?: { focusCaption?: boolean }) => void;
  onChangeStatus: (
    id: string,
    status: GraphicStatus,
    extra?: { posted_platforms?: string[]; post_url?: string | null }
  ) => Promise<SocialMediaGraphic | void> | void;
  onDelete: (id: string) => Promise<void> | void;
}

export function GraphicCard({
  graphic,
  selected,
  hasAnySelection,
  canDelete,
  isUpdating,
  onToggleSelect,
  onOpenDetail,
  onChangeStatus,
  onDelete,
}: GraphicCardProps) {
  const [copied, setCopied] = React.useState(false);
  const [postPopoverOpen, setPostPopoverOpen] = React.useState(false);
  const [platforms, setPlatforms] = React.useState<string[]>(
    graphic.posted_platforms ?? []
  );
  const [postUrl, setPostUrl] = React.useState(graphic.post_url ?? "");
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  React.useEffect(() => {
    setPlatforms(graphic.posted_platforms ?? []);
    setPostUrl(graphic.post_url ?? "");
  }, [graphic.posted_platforms, graphic.post_url]);

  const cover = graphic.items[0];
  const slideCount = graphic.items.length;
  const hasCaption = Boolean(graphic.caption && graphic.caption.trim().length > 0);

  const handleCopyCaption = async () => {
    if (!graphic.caption) return;
    const ok = await copyTextToClipboard(graphic.caption);
    if (ok) {
      setCopied(true);
      toast.success("Caption copied to clipboard");
      window.setTimeout(() => setCopied(false), 1800);
    } else {
      toast.error("Unable to copy caption automatically");
    }
  };

  const handleDownload = () => {
    if (!cover) return;
    if (slideCount > 1) {
      triggerFileDownload(getGraphicZipUrl(graphic.id));
    } else {
      triggerFileDownload(
        getGraphicMediaUrl(cover.id, "original", cover.etag),
        cover.original_name
      );
    }
  };

  const togglePlatform = (value: string) => {
    setPlatforms((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  const handleConfirmPosted = async () => {
    setPostPopoverOpen(false);
    await onChangeStatus(graphic.id, "posted", {
      posted_platforms: platforms,
      post_url: postUrl.trim() ? postUrl.trim() : null,
    });
  };

  return (
    <>
      <article
        className={cn(
          "group flex flex-col overflow-hidden rounded-lg border bg-card transition-all",
          selected
            ? "ring-2 ring-primary border-primary/60"
            : "hover:border-foreground/20 hover:shadow-sm"
        )}
      >
        <div className="relative aspect-4/5 w-full overflow-hidden bg-muted/45">
          <button
            type="button"
            onClick={() => onOpenDetail(graphic)}
            className="block h-full w-full cursor-pointer text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
            aria-label={`Inspect ${graphic.title}`}
          >
            {cover ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={getGraphicMediaUrl(cover.id, "thumb", cover.etag)}
                alt={graphic.title}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-contain p-1.5 transition-transform duration-200 group-hover:scale-[1.015]"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                No preview available
              </div>
            )}
          </button>

          <div
            className={cn(
              "absolute top-2.5 left-2.5 z-10 flex items-center rounded-md bg-background/90 p-1 shadow-xs ring-1 ring-border/70 backdrop-blur-xs transition-opacity",
              selected || hasAnySelection
                ? "opacity-100"
                : "opacity-90 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
            )}
          >
            <Checkbox
              checked={selected}
              onCheckedChange={() => onToggleSelect(graphic.id)}
              aria-label={`Select ${graphic.title}`}
            />
          </div>

          {slideCount > 1 && (
            <span className="pointer-events-none absolute top-2.5 right-2.5 inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-[11px] font-medium text-foreground shadow-xs ring-1 ring-border/70 backdrop-blur-xs tabular-nums">
              <Layers className="size-3" />1 / {slideCount}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2 px-3.5 py-3">
          <div className="flex items-start justify-between gap-2">
            <button
              type="button"
              onClick={() => onOpenDetail(graphic)}
              className="min-w-0 flex-1 cursor-pointer text-left outline-none focus-visible:underline"
            >
              <h3 className="truncate text-sm font-semibold text-foreground leading-snug">
                {graphic.title}
              </h3>
            </button>
            {graphic.category && (
              <Badge variant="outline" className="shrink-0 font-normal">
                {graphic.category}
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {hasCaption ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="size-3" />
                Caption ready
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                Needs caption
              </span>
            )}

            {graphic.status === "posted" &&
              graphic.posted_platforms.slice(0, 3).map((platform) => (
                <Badge
                  key={platform}
                  variant="secondary"
                  className="text-[10px] font-normal"
                >
                  {getPlatformLabel(platform)}
                </Badge>
              ))}
            {graphic.status === "posted" && graphic.posted_platforms.length > 3 && (
              <Badge variant="secondary" className="text-[10px] font-normal tabular-nums">
                +{graphic.posted_platforms.length - 3}
              </Badge>
            )}
          </div>

          {hasCaption ? (
            <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
              {graphic.caption}
            </p>
          ) : (
            <button
              type="button"
              onClick={() => onOpenDetail(graphic, { focusCaption: true })}
              className="w-fit cursor-pointer text-left text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              No caption yet — click to write one
            </button>
          )}

          <div className="mt-auto flex items-center justify-between gap-2 pt-1 text-[11px] text-muted-foreground">
            <span className="truncate">
              By {getFirstName(graphic.uploaded_by?.name)} ·{" "}
              {formatShortDate(graphic.created_at)}
            </span>
            {graphic.post_url && (
              <a
                href={graphic.post_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-1 text-primary hover:underline"
                title="Open live post"
              >
                Live <ExternalLink className="size-3" />
              </a>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-1.5 border-t bg-muted/20 px-3 py-2">
          <div className="flex items-center gap-1">
            {hasCaption ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyCaption}
                title="Copy caption"
              >
                {copied ? (
                  <>
                    <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" />
                    Copy
                  </>
                )}
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenDetail(graphic, { focusCaption: true })}
              >
                <PencilLine className="size-3.5" />
                Add caption
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleDownload}
              disabled={!cover}
              title={
                slideCount > 1
                  ? `Download all ${slideCount} slides (.zip)`
                  : "Download original image"
              }
              aria-label={
                slideCount > 1
                  ? `Download all ${slideCount} slides as ZIP`
                  : `Download ${graphic.title}`
              }
            >
              <Download className="size-3.5" />
            </Button>
          </div>

          <div className="flex items-center gap-1">
            {graphic.status === "fresh" && (
              <Popover open={postPopoverOpen} onOpenChange={setPostPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button type="button" size="sm" disabled={isUpdating}>
                    <Send className="size-3" />
                    Mark Posted
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-72 space-y-3 p-3.5">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-foreground">
                      Mark as Posted
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Optionally note where this graphic went live.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-muted-foreground">
                      Platforms (optional)
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
                      htmlFor={`post-url-${graphic.id}`}
                      className="text-[11px] text-muted-foreground"
                    >
                      Post link (optional)
                    </Label>
                    <Input
                      id={`post-url-${graphic.id}`}
                      type="url"
                      value={postUrl}
                      onChange={(e) => setPostUrl(e.target.value)}
                      placeholder="https://instagram.com/p/..."
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="flex justify-end gap-1.5 pt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setPostPopoverOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={isUpdating}
                      onClick={handleConfirmPosted}
                    >
                      Confirm Posted
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {graphic.status === "posted" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isUpdating}
                onClick={() => onChangeStatus(graphic.id, "archived")}
              >
                <Archive className="size-3" />
                Archive
              </Button>
            )}

            {graphic.status === "archived" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isUpdating}
                onClick={() => onChangeStatus(graphic.id, "fresh")}
              >
                <RotateCcw className="size-3" />
                Move to Fresh
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`More actions for ${graphic.title}`}
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onOpenDetail(graphic)}>
                  <PencilLine className="size-3.5" />
                  Open details & caption
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownload} disabled={!cover}>
                  <Download className="size-3.5" />
                  {slideCount > 1 ? "Download all (.zip)" : "Download original"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {graphic.status !== "fresh" && (
                  <DropdownMenuItem
                    disabled={isUpdating}
                    onClick={() => onChangeStatus(graphic.id, "fresh")}
                  >
                    <RotateCcw className="size-3.5" />
                    Move to Fresh
                  </DropdownMenuItem>
                )}
                {graphic.status !== "posted" && (
                  <DropdownMenuItem
                    disabled={isUpdating}
                    onClick={() => onChangeStatus(graphic.id, "posted")}
                  >
                    <Send className="size-3.5" />
                    Mark Posted
                  </DropdownMenuItem>
                )}
                {graphic.status !== "archived" && (
                  <DropdownMenuItem
                    disabled={isUpdating}
                    onClick={() => onChangeStatus(graphic.id, "archived")}
                  >
                    <Archive className="size-3.5" />
                    Archive
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      <Trash2 className="size-3.5" />
                      Delete graphic
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </article>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this graphic?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{graphic.title}&rdquo; and its original image files will be permanently removed for the entire team.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => onDelete(graphic.id)}
            >
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
