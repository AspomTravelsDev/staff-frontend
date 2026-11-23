"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  Clock,
  Columns2,
  Eye,
  FileText,
  Info,
  ListChecks,
  ListOrdered,
  Loader2,
  PenLine,
  Save,
  Send,
  Sparkles,
  Tag,
  Wand2,
} from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/rich-text-editor";
import {
  ITGuideContent,
  estimateReadingTimeMinutes,
  extractITGuideHeadings,
} from "@/app/(admin)/my/it/components/it-guide-content";
import {
  itGuideSchema,
  type ITGuideFormValues,
} from "@/lib/validations/it-guides";
import { updateITGuide, type ITGuideItem } from "@/lib/api/it-guides";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ITGuideFormProps {
  initialData?: ITGuideItem | null;
  onSubmit?: (values: ITGuideFormValues) => Promise<void>;
}

type EditorViewMode = "write" | "preview" | "split";

function plainTextFromHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function ITGuideForm({ initialData, onSubmit }: ITGuideFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<EditorViewMode>("write");
  const router = useRouter();

  const form = useForm<ITGuideFormValues>({
    resolver: zodResolver(itGuideSchema),
    defaultValues: {
      title: initialData?.title ?? "",
      excerpt: initialData?.excerpt ?? "",
      content: initialData?.content ?? "",
      category: initialData?.category ?? "Portal Guide",
      status: initialData?.status ?? "draft",
    },
  });

  const watchedTitle = form.watch("title");
  const watchedExcerpt = form.watch("excerpt");
  const watchedContent = form.watch("content");
  const watchedCategory = form.watch("category");

  const stats = useMemo(() => {
    const plain = plainTextFromHtml(watchedContent || "");
    const words = plain ? plain.split(/\s+/).filter(Boolean).length : 0;
    const readingMinutes = estimateReadingTimeMinutes(watchedContent || "");
    const { headings } = extractITGuideHeadings(watchedContent || "");
    return { words, readingMinutes, headings };
  }, [watchedContent]);

  const appendBlock = (htmlSnippet: string) => {
    const current = form.getValues("content") || "";
    const trimmed = current.replace(/(?:<p>\s*(?:<br\s*\/?>)?\s*<\/p>\s*)+$/i, "");
    form.setValue("content", `${trimmed}${htmlSnippet}`, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleCleanSpacing = () => {
    const current = form.getValues("content") || "";
    if (!current.trim()) return;
    const cleaned = current
      .replace(/&nbsp;/gi, " ")
      // Remove empty paragraphs completely or collapse multiple blank lines
      .replace(/(?:<p>\s*(?:<br\s*\/?>)?\s*<\/p>\s*)+/gi, "")
      .trim();
    form.setValue("content", cleaned, {
      shouldDirty: true,
      shouldValidate: true,
    });
    toast.success("Extra blank lines and spacing cleaned up.");
  };

  const handleAutoExcerpt = () => {
    const plain = plainTextFromHtml(form.getValues("content") || "");
    if (!plain) {
      toast.error("Write some guide content first to generate an excerpt.");
      return;
    }
    const generated = plain.length > 160 ? `${plain.slice(0, 157).trim()}...` : plain;
    form.setValue("excerpt", generated, {
      shouldDirty: true,
      shouldValidate: true,
    });
    toast.success("Excerpt generated from guide content.");
  };

  const handleSubmit = async (values: ITGuideFormValues) => {
    setIsLoading(true);
    try {
      if (initialData) {
        await updateITGuide(initialData.id, values);
      } else if (onSubmit) {
        await onSubmit(values);
      } else {
        throw new Error("Unable to save this guide. Please reopen the form.");
      }
      toast.success(
        values.status === "published"
          ? "Guide published successfully!"
          : "Guide saved as draft.",
      );
      router.push("/admin/it-desk");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save guide";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">
                    Guide Title
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., How to Complete Your Bi-Yearly Performance Appraisal"
                      className="text-lg font-medium h-12"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="excerpt"
              render={({ field }) => (
                <FormItem>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <FormLabel className="text-base font-semibold">
                      Excerpt (Short Summary)
                    </FormLabel>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {(watchedExcerpt ?? "").length} / 500
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2.5 text-xs text-primary hover:text-primary"
                        onClick={handleAutoExcerpt}
                      >
                        <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                        Auto-fill from content
                      </Button>
                    </div>
                  </div>
                  <FormControl>
                    <Textarea
                      placeholder="A brief 1–2 sentence summary shown on the IT Information Desk cards..."
                      className="resize-none h-20"
                      maxLength={500}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Shown on the IT Information Desk card grid so staff know what this guide covers.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <FormLabel className="text-base font-semibold">
                        Guide Content
                      </FormLabel>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Use headings (H2/H3), font sizes, lists, and callouts. Switch to Preview or Split View anytime.
                      </p>
                    </div>

                    {/* View Mode Switcher */}
                    <div
                      role="group"
                      aria-label="Editor view mode"
                      className="inline-flex items-center rounded-lg border bg-muted/50 p-1"
                    >
                      <Button
                        type="button"
                        size="sm"
                        variant={viewMode === "write" ? "default" : "ghost"}
                        className="h-7 px-2.5 text-xs"
                        onClick={() => setViewMode("write")}
                      >
                        <PenLine className="mr-1.5 h-3.5 w-3.5" />
                        Write
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={viewMode === "split" ? "default" : "ghost"}
                        className="h-7 px-2.5 text-xs hidden md:inline-flex"
                        onClick={() => setViewMode("split")}
                      >
                        <Columns2 className="mr-1.5 h-3.5 w-3.5" />
                        Split
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={viewMode === "preview" ? "default" : "ghost"}
                        className="h-7 px-2.5 text-xs"
                        onClick={() => setViewMode("preview")}
                      >
                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                        Preview
                      </Button>
                    </div>
                  </div>

                  {/* Quick-Insert & Cleanup Bar */}
                  {viewMode !== "preview" && (
                    <div className="flex flex-wrap items-center gap-1.5 rounded-lg border bg-muted/30 px-3 py-2">
                      <span className="text-xs font-medium text-muted-foreground mr-1">
                        Quick insert:
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 px-2.5 text-xs"
                        onClick={() =>
                          appendBlock(
                            `<h2>Step Title</h2><p>Briefly explain what to do in this step:</p><ol><li data-list="ordered"><span class="ql-ui" contenteditable="false"></span>First action to take</li><li data-list="ordered"><span class="ql-ui" contenteditable="false"></span>Second action to take</li></ol>`,
                          )
                        }
                      >
                        <ListOrdered className="mr-1.5 h-3.5 w-3.5 text-primary" />
                        Step Section
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 px-2.5 text-xs"
                        onClick={() =>
                          appendBlock(
                            `<ol><li data-list="bullet"><span class="ql-ui" contenteditable="false"></span><strong>Key item:</strong> Description here</li><li data-list="bullet"><span class="ql-ui" contenteditable="false"></span><strong>Second item:</strong> Description here</li></ol>`,
                          )
                        }
                      >
                        <ListChecks className="mr-1.5 h-3.5 w-3.5 text-primary" />
                        Bullet List
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 px-2.5 text-xs"
                        onClick={() =>
                          appendBlock(
                            `<blockquote><strong>Note:</strong> Add a helpful tip or background context for staff here.</blockquote>`,
                          )
                        }
                      >
                        <Info className="mr-1.5 h-3.5 w-3.5 text-primary" />
                        Info Note
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 px-2.5 text-xs"
                        onClick={() =>
                          appendBlock(
                            `<blockquote><strong>Important:</strong> Highlight a deadline, prerequisite, or critical requirement here.</blockquote>`,
                          )
                        }
                      >
                        <AlertTriangle className="mr-1.5 h-3.5 w-3.5 text-amber-600" />
                        Important Callout
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2.5 text-xs ml-auto text-muted-foreground hover:text-foreground"
                        onClick={handleCleanSpacing}
                        title="Remove extra blank lines caused by pasting"
                      >
                        <Wand2 className="mr-1.5 h-3.5 w-3.5" />
                        Clean extra spacing
                      </Button>
                    </div>
                  )}

                  <FormControl>
                    <div
                      className={
                        viewMode === "split"
                          ? "grid grid-cols-1 md:grid-cols-2 gap-4 items-start"
                          : "block"
                      }
                    >
                      {viewMode !== "preview" && (
                        <RichTextEditor
                          stickyToolbar
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Start writing your guide here..."
                          className="min-h-[420px]"
                        />
                      )}

                      {viewMode !== "write" && (
                        <div className="rounded-lg border bg-card p-6 shadow-xs min-h-[420px]">
                          <div className="mb-6 border-b pb-4">
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              <Badge
                                variant="outline"
                                className="text-primary border-primary/20 bg-primary/5"
                              >
                                <Tag className="mr-1.5 h-3 w-3" />
                                {watchedCategory || "General"}
                              </Badge>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {stats.readingMinutes} min read
                              </span>
                              <Badge variant="secondary" className="ml-auto text-[10px] uppercase">
                                Live Preview
                              </Badge>
                            </div>
                            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight">
                              {watchedTitle?.trim() || "Untitled IT Guide"}
                            </h2>
                            {watchedExcerpt?.trim() && (
                              <p className="mt-2 text-sm text-muted-foreground">
                                {watchedExcerpt}
                              </p>
                            )}
                          </div>

                          {field.value?.trim() ? (
                            <ITGuideContent content={field.value} />
                          ) : (
                            <div className="py-16 text-center text-sm text-muted-foreground">
                              Start typing in the editor to preview how your guide will look to staff.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </FormControl>

                  {/* Footer metrics bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground pt-1">
                    <div className="flex items-center gap-4">
                      <span>{stats.words} words</span>
                      <span>•</span>
                      <span>~{stats.readingMinutes} min read</span>
                      <span>•</span>
                      <span>{stats.headings.length} section headings</span>
                    </div>
                    <span>
                      Tip: Use <strong>Heading 2</strong> for main steps so they appear in the guide&apos;s Table of Contents.
                    </span>
                  </div>

                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Sidebar / Settings Area */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
            <div className="rounded-xl border bg-card p-6 shadow-sm space-y-6">
              <h3 className="font-semibold text-lg border-b pb-2">
                Publishing Settings
              </h3>

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? "Portal Guide"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Portal Guide">
                          Portal Guide
                        </SelectItem>
                        <SelectItem value="General">General</SelectItem>
                        <SelectItem value="Software">Software</SelectItem>
                        <SelectItem value="Hardware">Hardware</SelectItem>
                        <SelectItem value="Network">Network</SelectItem>
                        <SelectItem value="Policies">HR/IT Policies</SelectItem>
                        <SelectItem value="Security">Security</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      &quot;Published&quot; guides are immediately visible on the IT Information Desk.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-2 flex flex-col gap-3">
                <Button
                  type="submit"
                  className="w-full h-11"
                  disabled={isLoading}
                  onClick={() => form.setValue("status", "published")}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Publish Guide
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={isLoading}
                  onClick={form.handleSubmit((v) =>
                    handleSubmit({ ...v, status: "draft" }),
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save as Draft
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-muted-foreground"
                  onClick={() => router.back()}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </div>

            {/* Live Outline Card */}
            <div className="rounded-xl border bg-card p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Detected Outline (TOC)
                </h4>
                <Badge variant="secondary" className="text-[11px]">
                  {stats.headings.length}
                </Badge>
              </div>
              {stats.headings.length === 0 ? (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Add <strong>Heading 2</strong> or <strong>Heading 3</strong> sections in your guide to auto-generate a clickable Table of Contents for staff.
                </p>
              ) : (
                <ul className="space-y-1.5 text-xs">
                  {stats.headings.map((h) => (
                    <li
                      key={h.id}
                      className={`truncate text-muted-foreground ${
                        h.level === 3 ? "pl-3 border-l border-border" : "font-medium text-foreground"
                      }`}
                    >
                      {h.text}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}

