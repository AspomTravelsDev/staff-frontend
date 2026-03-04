"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, Send } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/rich-text-editor";
import {
  itGuideSchema,
  type ITGuideFormValues,
} from "@/lib/validations/it-guides";
import { ITGuideItem } from "@/lib/api/it-guides";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ITGuideFormProps {
  initialData?: ITGuideItem | null;
  onSubmit: (values: ITGuideFormValues) => Promise<void>;
}

export function ITGuideForm({ initialData, onSubmit }: ITGuideFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<ITGuideFormValues>({
    resolver: zodResolver(itGuideSchema),
    defaultValues: {
      title: initialData?.title ?? "",
      excerpt: initialData?.excerpt ?? "",
      content: initialData?.content ?? "",
      category: initialData?.category ?? "General",
      status: initialData?.status ?? "draft",
    },
  });

  const handleSubmit = async (values: ITGuideFormValues) => {
    setIsLoading(true);
    try {
      await onSubmit(values);
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="md:col-span-2 space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-semibold">Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., How to Connect to the Office WiFi"
                      className="text-xl py-6"
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
                  <FormLabel>Excerpt (Short Description)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="A brief summary of what this guide is about..."
                      className="resize-none h-20"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormDescription>
                    This will be shown on the listing page.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-semibold">
                    Guide Content
                  </FormLabel>
                  <FormControl>
                    <RichTextEditor
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Start writing your guide here..."
                      className="min-h-[400px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Sidebar / Settings Area */}
          <div className="space-y-6">
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
                      value={field.value ?? "General"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="General">General</SelectItem>
                        <SelectItem value="Software">Software</SelectItem>
                        <SelectItem value="Hardware">Hardware</SelectItem>
                        <SelectItem value="Network">Network</SelectItem>
                        <SelectItem value="Policies">HR/IT Policies</SelectItem>
                        <SelectItem value="Security">Security</SelectItem>
                        <SelectItem value="Portal Guide">
                          Portal Guide
                        </SelectItem>
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
                      "Published" guides are visible to all staff.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-4 flex flex-col gap-3">
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

            <div className="rounded-xl border bg-muted/30 p-4 text-xs text-muted-foreground">
              <p className="font-semibold mb-1">Quick Tips:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Use clear headings (H2, H3) for structure.</li>
                <li>Add links to relevant software or portals.</li>
                <li>Keep the excerpt concise for listing pages.</li>
              </ul>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}
