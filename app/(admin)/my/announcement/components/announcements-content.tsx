"use client";

import { useState, useMemo } from "react";
import { Plus, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnnouncementItem } from "@/lib/api/announcements";
import { AnnouncementCard } from "./announcement-card";
import { AnnouncementForm } from "./announcement-form";

interface AnnouncementsContentProps {
  initialAnnouncements: AnnouncementItem[];
}

export function AnnouncementsContent({
  initialAnnouncements,
}: AnnouncementsContentProps) {
  const [announcements, setAnnouncements] =
    useState<AnnouncementItem[]>(initialAnnouncements);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const stats = useMemo(
    () => ({
      total: announcements.length,
      pending: announcements.filter((a) => a.status === "pending").length,
      approved: announcements.filter((a) => a.status === "approved").length,
      rejected: announcements.filter((a) => a.status === "rejected").length,
    }),
    [announcements],
  );

  const handleDeleted = (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Megaphone className="h-6 w-6" />
            Announcements & Newsletters
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Make an announcement or suggest a newsletter. Submissions go to
            admin for review.
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Submission
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total" value={stats.total} color="text-foreground" />
        <StatCard
          label="Pending"
          value={stats.pending}
          color="text-yellow-600 dark:text-yellow-400"
        />
        <StatCard
          label="Approved"
          value={stats.approved}
          color="text-green-600 dark:text-green-400"
        />
        <StatCard
          label="Rejected"
          value={stats.rejected}
          color="text-red-600 dark:text-red-400"
        />
      </div>

      {/* Submissions Grid */}
      {announcements.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-4">
            <Megaphone className="h-12 w-12 text-muted-foreground/40" />
            <div>
              <p className="font-medium text-muted-foreground">
                No submissions yet
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Click &quot;New Submission&quot; to make your first announcement
                or newsletter suggestion.
              </p>
            </div>
            <Button variant="outline" onClick={() => setIsFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Get Started
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {announcements.map((item) => (
            <AnnouncementCard
              key={item.id}
              announcement={item}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <AnnouncementForm open={isFormOpen} onOpenChange={setIsFormOpen} />
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`text-3xl font-bold ${color}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
