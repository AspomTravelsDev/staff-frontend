"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, Loader2 } from "lucide-react";
import { AnnouncementPreview } from "./announcement-preview";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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
import {
  announcementSchema,
  type AnnouncementFormValues,
} from "@/lib/validations/announcements";
import { updateAnnouncementContentAction } from "../actions";
import { toast } from "sonner";
import { RichTextEditor } from "@/components/rich-text-editor";
import type { AnnouncementItem } from "@/lib/api/announcements";

interface EditAnnouncementDialogProps {
  announcement: AnnouncementItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditAnnouncementDialog({
  announcement,
  open,
  onOpenChange,
  onSuccess,
}: EditAnnouncementDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<AnnouncementFormValues | null>(null);

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      type: "announcement",
      priority: "medium",
      title: "",
      content: "",
    },
  });

  useEffect(() => {
    if (open && announcement) {
      form.reset({
        type: announcement.type,
        priority: announcement.priority ?? "medium",
        title: announcement.title,
        content: announcement.content,
      });
    }
  }, [open, announcement, form]);

  const onSubmit = async (values: AnnouncementFormValues) => {
    if (!announcement) return;

    setIsLoading(true);
    try {
      const result = await updateAnnouncementContentAction(
        announcement.id,
        values,
      );
      if (!result.success) {
        toast.error(result.error || "Failed to submit");
        return;
      }
      toast.success("Announcement successfully resubmitted for review!");
      onOpenChange(false);
      onSuccess?.();
    } finally {
      setIsLoading(false);
    }
  };

  if (!announcement) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[940px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit & ResSubmit</DialogTitle>
          <DialogDescription>
            Update your announcement and submit it back for review.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Type & Priority Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField
                control={form.control as any}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="announcement">
                          📢 Announcement
                        </SelectItem>
                        <SelectItem value="newsletter">
                          📰 Newsletter Suggestion
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as any}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Title */}
            <FormField
              control={form.control as any}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Company Picnic – Save the Date!"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Content – Rich Text */}
            <FormField
              control={form.control as any}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <RichTextEditor
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Write your announcement here..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPreview(form.getValues())} disabled={isLoading}><Eye className="mr-1.5 size-4" />Preview</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Edit & Resubmit
              </Button>
            </DialogFooter>
          </form>
        </Form>
        {preview && <AnnouncementPreview open onOpenChange={open => { if (!open) setPreview(null); }} title={preview.title} content={preview.content} type={preview.type} />}
      </DialogContent>
    </Dialog>
  );
}
