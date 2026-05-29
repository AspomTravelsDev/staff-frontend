"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import {
  Mail,
  CheckCircle2,
  AlertCircle,
  Bell,
  Clock,
  User,
  History,
} from "lucide-react";
import {
  OnboardingApplication,
  OnboardingHistoryEntry,
  OnboardingCorrectionReason,
} from "@/lib/types/hr";

interface ApplicationTimelineProps {
  application: OnboardingApplication;
}

interface TimelineEvent {
  id: string;
  type: "invitation" | "submission" | "correction" | "reminder";
  date: string;
  title: string;
  note?: string;
  details?: string;
  actor?: string;
}

const REASON_LABELS: Record<OnboardingCorrectionReason, string> = {
  unsigned_documents: "Unsigned documents uploaded",
  missing_required_pages: "Missing required pages/documents",
  invalid_document_quality: "Document quality is too poor to verify",
  mismatched_information: "Information mismatch across submitted documents",
  other: "Other Reason",
};

export function ApplicationTimeline({ application }: ApplicationTimelineProps) {
  const formData = application.form_data || {};
  const history = (formData.reviewHistory as OnboardingHistoryEntry[]) || [];

  // Parse and build all events
  const events: TimelineEvent[] = [];

  // 1. Invitation Event
  if (application.invited_at) {
    events.push({
      id: "invitation",
      type: "invitation",
      date: application.invited_at,
      title: "Onboarding Invitation Sent",
      note: `An invitation email was sent to ${application.applicant_email} to start the onboarding process.`,
    });
  }

  // 2. Submission / Completion Event
  if (application.completed_at) {
    events.push({
      id: `submission-${application.completed_at}`,
      type: "submission",
      date: application.completed_at,
      title: "Onboarding Submission Completed",
      note: "Applicant completed all 8 steps of the onboarding form and uploaded all required signed documents.",
    });
  }

  // 3. Correction & Reminder Events from reviewHistory
  history.forEach((entry, idx) => {
    if (entry.type === "reminder") {
      events.push({
        id: `reminder-${entry.sentAt}-${idx}`,
        type: "reminder",
        date: entry.sentAt,
        title: "Reminder Email Sent",
        note: entry.note,
        actor: entry.sentBy?.name,
      });
    } else {
      // Correction request
      events.push({
        id: `correction-${entry.requestedAt}-${idx}`,
        type: "correction",
        date: entry.requestedAt,
        title: "Correction Requested",
        details: REASON_LABELS[entry.reason] || entry.reason || "Correction requested",
        note: entry.note,
        actor: entry.requestedBy?.name,
      });
    }
  });

  // Sort events chronologically (newest first)
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const getEventStyles = (type: TimelineEvent["type"]) => {
    switch (type) {
      case "invitation":
        return {
          icon: <Mail className="w-4 h-4" />,
          colorClass: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/30",
          badgeVariant: "secondary" as const,
          badgeLabel: "Invitation",
        };
      case "submission":
        return {
          icon: <CheckCircle2 className="w-4 h-4" />,
          colorClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30",
          badgeVariant: "default" as const,
          badgeLabel: "Submission",
        };
      case "correction":
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          colorClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/30",
          badgeVariant: "destructive" as const,
          badgeLabel: "Correction Request",
        };
      case "reminder":
        return {
          icon: <Bell className="w-4 h-4" />,
          colorClass: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900/30",
          badgeVariant: "outline" as const,
          badgeLabel: "Reminder Sent",
        };
    }
  };

  const formatDateString = (dateString: string) => {
    try {
      return format(new Date(dateString), "PPP p");
    } catch {
      return dateString;
    }
  };

  return (
    <Card className="shadow-sm border">
      <CardHeader className="flex flex-row items-center gap-2.5 pb-4">
        <History className="w-5 h-5 text-muted-foreground" />
        <CardTitle className="text-xl">Onboarding History Log</CardTitle>
      </CardHeader>
      <CardContent>
        {sortedEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-sm">
            <Clock className="w-8 h-8 mb-2 opacity-30" />
            <p>No timeline history available yet.</p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-muted-foreground/15">
            {sortedEvents.map((event) => {
              const styles = getEventStyles(event.type);
              return (
                <div key={event.id} className="relative group">
                  {/* Event Marker Node */}
                  <div
                    className={`absolute -left-[27px] top-0.5 flex h-6.5 w-6.5 items-center justify-center rounded-full border bg-background shadow-xs z-10 transition-transform group-hover:scale-110 ${styles.colorClass}`}
                  >
                    {styles.icon}
                  </div>

                  {/* Event Panel Content */}
                  <div className="rounded-lg border bg-card p-4 transition-all duration-200 hover:border-muted-foreground/30 hover:shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">
                          {event.title}
                        </span>
                        <Badge variant={styles.badgeVariant} className="text-[10px] py-0 px-2 font-medium">
                          {styles.badgeLabel}
                        </Badge>
                        {event.details && (
                          <Badge variant="outline" className="text-[10px] py-0 px-2 font-medium text-amber-600 border-amber-200 dark:text-amber-400 dark:border-amber-900/30">
                            {event.details}
                          </Badge>
                        )}
                      </div>
                      <time className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDateString(event.date)}
                      </time>
                    </div>

                    {event.note && (
                      <p className="text-sm text-muted-foreground leading-relaxed break-words bg-muted/20 p-2.5 rounded-md border border-muted/50 mt-1.5">
                        {event.note}
                      </p>
                    )}

                    {event.actor && (
                      <div className="flex items-center gap-1 mt-3 text-[11px] text-muted-foreground">
                        <User className="w-3.5 h-3.5" />
                        <span>
                          Action by: <strong>{event.actor}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
