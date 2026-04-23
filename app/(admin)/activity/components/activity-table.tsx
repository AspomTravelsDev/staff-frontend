"use client";

import { formatDistanceToNow } from "date-fns";
import { getRoleLabel } from "@/types/user-types";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ActivityItem } from "@/lib/api/types";
import type { User } from "@/types/user-types";

interface ActivityTableProps {
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
  holidays: "bg-purple-500",
  ticket: "bg-slate-500",
};

function formatAction(action: string): string {
  return action
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function ActivityTable({ activities }: ActivityTableProps) {
  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <FileText className="h-12 w-12 opacity-50 mb-4" />
        <p>No activity found</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Actor</TableHead>
          <TableHead>Action</TableHead>
          <TableHead>Entity</TableHead>
          <TableHead>Details</TableHead>
          <TableHead>Time</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {activities.map((activity) => {
          const Icon = actionIcons[activity.action] || RefreshCw;

          return (
            <TableRow
              key={activity.id}
              className={!activity.is_read ? "bg-muted/30" : ""}
            >
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{activity.actor_name}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${roleColors[activity.actor_role]}`}
                    />
                    <span className="text-xs text-muted-foreground capitalize">
                      {getRoleLabel(activity.actor_role)}
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span>{formatAction(activity.action)}</span>
                </div>
              </TableCell>
              <TableCell>
                {activity.entity_title && (
                  <div className="flex flex-col text-sm">
                    <span className="font-medium text-foreground">
                      {activity.entity_title}
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {activity.entity_type.replace("_", " ")}
                    </span>
                  </div>
                )}
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  {activity.previous_status && activity.new_status && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <Badge
                        variant="outline"
                        className="text-[10px] h-5 px-1.5"
                      >
                        {activity.previous_status}
                      </Badge>
                      <span className="text-muted-foreground">→</span>
                      <Badge
                        variant="secondary"
                        className="text-[10px] h-5 px-1.5"
                      >
                        {activity.new_status}
                      </Badge>
                    </div>
                  )}
                  {activity.note && (
                    <p className="text-sm text-muted-foreground italic truncate max-w-75">
                      &quot;{activity.note}&quot;
                    </p>
                  )}
                  {!activity.note &&
                    !activity.previous_status &&
                    activity.description && (
                      <p className="text-sm text-muted-foreground">
                        {activity.description}
                      </p>
                    )}
                </div>
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {formatDistanceToNow(new Date(activity.timestamp), {
                  addSuffix: true,
                })}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
