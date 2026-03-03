"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, CalendarClock, Clock10 } from "lucide-react";
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
  FormDescription,
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
import { DatePicker } from "@/components/ui/date-picker";
import {
  announcementSchema,
  type AnnouncementFormValues,
} from "@/lib/validations/announcements";
import { updateAnnouncementContentAction } from "../actions";
import { toast } from "sonner";
import { RichTextEditor } from "./rich-text-editor";
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
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [timeInput, setTimeInput] = useState("09:00");

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      type: "announcement",
      priority: "medium",
      title: "",
      content: "",
      publish_at: null,
      visibility_days: null,
    },
  });

  useEffect(() => {
    if (open && announcement) {
      form.reset({
        type: announcement.type,
        priority: announcement.priority ?? "medium",
        title: announcement.title,
        content: announcement.content,
        publish_at: announcement.publish_at
          ? new Date(announcement.publish_at)
          : null,
        visibility_days: announcement.visibility_days ?? null,
      });

      if (announcement.publish_at) {
        setScheduleEnabled(true);
        const d = new Date(announcement.publish_at);
        setTimeInput(
          `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`,
        );
      } else {
        setScheduleEnabled(false);
        setTimeInput("09:00");
      }
    }
  }, [open, announcement, form]);

  /** Merge the calendar date + the time <input> into one Date */
  const handleDateChange = (date: Date | undefined) => {
    if (!date) {
      form.setValue("publish_at", null);
      return;
    }
    const [hours, minutes] = timeInput.split(":").map(Number);
    const merged = new Date(date);
    merged.setHours(hours, minutes, 0, 0);
    form.setValue("publish_at", merged, { shouldValidate: true });
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTimeInput(e.target.value);
    const current = form.getValues("publish_at");
    if (current) {
      const [hours, minutes] = e.target.value.split(":").map(Number);
      const merged = new Date(current);
      merged.setHours(hours, minutes, 0, 0);
      form.setValue("publish_at", merged, { shouldValidate: true });
    }
  };

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

            {/* Scheduling & Visibility */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Scheduled Publish — optional */}
              <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      Schedule Publishing
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setScheduleEnabled((v) => !v);
                      if (scheduleEnabled) form.setValue("publish_at", null);
                    }}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                      scheduleEnabled ? "bg-primary" : "bg-muted-foreground/30"
                    }`}
                    aria-label="Toggle scheduling"
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                        scheduleEnabled ? "translate-x-4" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                {scheduleEnabled && (
                  <FormField
                    control={form.control as any}
                    name="publish_at"
                    render={({ field }) => (
                      <FormItem>
                        <FormDescription className="text-xs">
                          Auto-publish at the scheduled time.
                        </FormDescription>
                        <div className="grid grid-cols-2 gap-3 mt-3">
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground font-medium">
                              Date
                            </p>
                            <FormControl>
                              <DatePicker
                                value={field.value ?? undefined}
                                onChange={handleDateChange}
                                placeholder="Pick a date"
                                minDate={new Date()}
                              />
                            </FormControl>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground font-medium">
                              Time
                            </p>
                            <Input
                              type="time"
                              value={timeInput}
                              onChange={handleTimeChange}
                              className="h-7 text-xs w-full"
                            />
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* Visibility Duration */}
              <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Clock10 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    Visibility Duration
                  </span>
                </div>
                <FormField
                  control={form.control as any}
                  name="visibility_days"
                  render={({ field }) => (
                    <FormItem>
                      <FormDescription className="text-xs">
                        How many days should this stay visible? Leave empty for
                        forever.
                      </FormDescription>
                      <FormControl>
                        <div className="flex items-center gap-2 mt-2">
                          <Input
                            type="number"
                            placeholder="e.g., 7"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === ""
                                  ? null
                                  : parseInt(e.target.value),
                              )
                            }
                            className="w-24"
                          />
                          <span className="text-xs text-muted-foreground">
                            Days
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter>
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
      </DialogContent>
    </Dialog>
  );
}
