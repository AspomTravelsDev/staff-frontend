"use client";

import { formatDistanceToNow } from "date-fns";
import { getRoleLabel, User } from "@/types/user-types";
import {
  FileText,
  UserPlus,
  MessageSquare,
  Upload,
  Trash2,
  RefreshCw,
  PlusCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { ActivityItem } from "@/lib/api/types";

interface ActivityListProps {
  activities: ActivityItem[];
}

const actionIcons: Record<string, React.ElementType> = {
  created: PlusCircle,
  updated: RefreshCw,
  status_changed: RefreshCw,
  assigned: UserPlus,
  note_added: MessageSquare,
  document_uploaded: Upload,
  document_deleted: Trash2,
};

const actionColors: Record<string, string> = {
  created: "bg-green-100 text-green-700",
  updated: "bg-blue-100 text-blue-700",
  status_changed: "bg-purple-100 text-purple-700",
  assigned: "bg-orange-100 text-orange-700",
  note_added: "bg-gray-100 text-gray-700",
  document_uploaded: "bg-cyan-100 text-cyan-700",
  document_deleted: "bg-red-100 text-red-700",
};

const roleColors: Record<User["role"], string> = {
  super: "bg-red-500",
  admin: "bg-purple-500",
  it: "bg-blue-500",
  account: "bg-green-500",
  visa: "bg-orange-500",
  hr: "bg-pink-500",
  "social-media": "bg-cyan-500",
  compliance: "bg-yellow-500",
  "birth-services": "bg-teal-500",
  holidays: "bg-indigo-500",
  ticket: "bg-slate-500",
};

function formatAction(action: string): string {
  return action
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function ActivityList({ activities }: ActivityListProps) {
  if (activities.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">No activity found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        const Icon = actionIcons[activity.action] || RefreshCw;
        const colorClass =
          actionColors[activity.action] || "bg-gray-100 text-gray-700";

        return (
          <Card
            key={activity.id}
            className={
              activity.is_read === false ? "border-primary/50 bg-primary/5" : ""
            }
          >
            <CardContent className="flex gap-4 py-4">
              {/* Icon */}
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${colorClass}`}
              >
                <Icon className="h-5 w-5" />
              </div>

              {/* Content */}
              <div className="flex-1 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-medium">{activity.actor_name}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      {activity.description || formatAction(activity.action)}
                    </span>
                  </div>
                  <span className="shrink-0 text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.timestamp), {
                      addSuffix: true,
                    })}
                  </span>
                </div>

                {activity.entity_title && (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">
                      {activity.entity_type.replace("_", " ")}:
                    </span>{" "}
                    {activity.entity_title}
                  </p>
                )}

                {/* Status change indicator */}
                {activity.previous_status && activity.new_status && (
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline">{activity.previous_status}</Badge>
                    <span className="text-muted-foreground">→</span>
                    <Badge>{activity.new_status}</Badge>
                  </div>
                )}

                {/* Note */}
                {activity.note && (
                  <p className="text-sm text-muted-foreground italic">
                    &ldquo;{activity.note}&rdquo;
                  </p>
                )}

                {/* Actor role badge */}
                <div className="flex items-center gap-2 pt-1">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${roleColors[activity.actor_role]}`}
                  />
                  <span className="text-xs text-muted-foreground capitalize">
                    {getRoleLabel(activity.actor_role)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
