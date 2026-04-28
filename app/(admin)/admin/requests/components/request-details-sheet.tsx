import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { RequestItem } from "@/lib/api/requests";
import { getRoleLabel, User } from "@/types/user-types";
import { RequestComments } from "./request-comments";

function getStatusVariant(status: string) {
  switch (status) {
    case "completed":
    case "approved":
      return "default"; // green/primary
    case "rejected":
      return "destructive";
    case "in_progress":
    case "cancelled":
      return "secondary";
    case "pending":
    default:
      return "outline";
  }
}

export function RequestDetailsSheet({
  request,
  open,
  onOpenChange,
}: {
  request: RequestItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!request) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md px-6 py-4">
        <SheetHeader className="mb-6">
          <SheetTitle>Request Details</SheetTitle>
          <SheetDescription>
            Full details for the {request.category} request.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                Status
              </h4>
              <Badge variant={getStatusVariant(request.status)}>
                {request.status.replace("_", " ")}
              </Badge>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                Date Submitted
              </h4>
              <p className="font-medium">
                {format(new Date(request.request_date), "MMM d, yyyy")}
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">
              Requester
            </h4>
            <p className="font-medium">{request.requester_name}</p>
            <p className="text-sm text-muted-foreground capitalize">
              {request.requester_role
                ? getRoleLabel(request.requester_role as User["role"]) ||
                  request.requester_role
                : "User"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                Category
              </h4>
              <p className="font-medium">{request.category}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                Priority
              </h4>
              <Badge variant="outline" className="capitalize">
                {request.priority}
              </Badge>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">
              Subject / Reason
            </h4>
            <div className="bg-muted/50 rounded-md p-3 text-sm">
              {request.reason}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">
              Details
            </h4>
            <div className="bg-muted/50 rounded-md p-3 text-sm min-h-[100px] whitespace-pre-wrap">
              {request.details || "No additional details provided."}
            </div>
          </div>

          {request.logs && request.logs.length > 0 && (
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                Activity Log
              </h4>
              <div className="space-y-3 max-h-48 overflow-y-auto pr-2 rounded-md bg-muted/20 p-3">
                {request.logs.map((log) => (
                  <div
                    key={log.id}
                    className="text-xs text-muted-foreground flex gap-2"
                  >
                    <span className="shrink-0 text-primary/70">
                      {format(new Date(log.created_at), "MMM d, h:mm a")}
                    </span>
                    <span>
                      <strong>{log.user_name}</strong> changed status from{" "}
                      <span className="capitalize">
                        {log.old_value?.replace("_", " ")}
                      </span>{" "}
                      to{" "}
                      <span className="capitalize font-medium text-foreground">
                        {log.new_value?.replace("_", " ")}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              Comments
            </h4>
            <RequestComments
              requestId={request.id}
              initialStatus={request.status}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
