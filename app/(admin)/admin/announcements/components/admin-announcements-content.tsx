"use client";

import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Megaphone } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  AnnouncementItem,
  AnnouncementStatus,
} from "@/lib/api/announcements";
import { AnnouncementsTable } from "./announcements-table";
import { AnnouncementPreviewSheet } from "./announcement-preview-sheet";

interface AdminAnnouncementsContentProps {
  initialAnnouncements: AnnouncementItem[];
}

export function AdminAnnouncementsContent({
  initialAnnouncements,
}: AdminAnnouncementsContentProps) {
  const queryClient = useQueryClient();
  const [announcements, setAnnouncements] =
    useState<AnnouncementItem[]>(initialAnnouncements);
  const [statusFilter, setStatusFilter] = useState<AnnouncementStatus | "all">(
    "pending",
  );
  const [typeFilter, setTypeFilter] = useState<
    "all" | "announcement" | "newsletter"
  >("all");
  const [previewItem, setPreviewItem] = useState<AnnouncementItem | null>(null);

  const stats = useMemo(
    () => ({
      total: announcements.length,
      pending: announcements.filter((a) => a.status === "pending").length,
      approved: announcements.filter((a) => a.status === "approved").length,
      rejected: announcements.filter((a) => a.status === "rejected").length,
    }),
    [announcements],
  );

  const filtered = useMemo(() => {
    return announcements.filter((a) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (typeFilter !== "all" && a.type !== typeFilter) return false;
      return true;
    });
  }, [announcements, statusFilter, typeFilter]);

  const handleUpdate = (id: string, updated: Partial<AnnouncementItem>) => {
    void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    if (updated.id === "__deleted__") {
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } else {
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...updated } : a)),
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Megaphone className="h-6 w-6" />
          Announcement Reviews
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Review, approve, or reject staff announcements and newsletter
          suggestions.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total, color: "text-foreground" },
          {
            label: "Pending",
            value: stats.pending,
            color: "text-yellow-600 dark:text-yellow-400",
          },
          {
            label: "Approved",
            value: stats.approved,
            color: "text-green-600 dark:text-green-400",
          },
          {
            label: "Rejected",
            value: stats.rejected,
            color: "text-red-600 dark:text-red-400",
          },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle>All Submissions</CardTitle>
              <CardDescription>
                Showing {filtered.length} of {announcements.length}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={typeFilter}
                onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}
              >
                <SelectTrigger className="h-8 w-[160px] text-xs">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="announcement">Announcements</SelectItem>
                  <SelectItem value="newsletter">Newsletters</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
              >
                <SelectTrigger className="h-8 w-[150px] text-xs">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <AnnouncementsTable
            announcements={filtered}
            onPreview={setPreviewItem}
            onUpdate={handleUpdate}
          />
        </CardContent>
      </Card>

      <AnnouncementPreviewSheet
        item={previewItem}
        open={!!previewItem}
        onOpenChange={(open) => {
          if (!open) setPreviewItem(null);
        }}
      />
    </div>
  );
}
