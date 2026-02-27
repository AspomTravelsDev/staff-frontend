import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export function RequestDetailsSheet({
  request,
  open,
  onOpenChange,
}: {
  request: any;
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
            Full details for the {request.request_type} staff request.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                Status
              </h4>
              <Badge
                variant={
                  request.status === "approved"
                    ? "default"
                    : request.status === "rejected"
                      ? "destructive"
                      : request.status === "interviewing" ||
                          request.status === "in review"
                        ? "default"
                        : "secondary"
                }
                className={
                  request.status === "interviewing"
                    ? "bg-blue-500 hover:bg-blue-600"
                    : request.status === "in review"
                      ? "bg-amber-500 hover:bg-amber-600"
                      : ""
                }
              >
                {request.status.charAt(0).toUpperCase() +
                  request.status.slice(1)}
              </Badge>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                Date Submitted
              </h4>
              <p className="font-medium">
                {format(new Date(request.created_at), "MMM d, yyyy")}
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">
              Requester
            </h4>
            <p className="font-medium">
              {request.requester?.name || "Unknown Staff"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                Request Type
              </h4>
              <p className="font-medium capitalize">{request.request_type}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                Quantity
              </h4>
              <p className="font-medium">{request.quantity}</p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">
              Department
            </h4>
            <p className="font-medium">{request.department}</p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">
              Reason
            </h4>
            <div className="bg-muted/50 rounded-md p-3 text-sm">
              {request.reason}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">
              Additional Comments
            </h4>
            <div className="bg-muted/50 rounded-md p-3 text-sm min-h-[60px]">
              {request.comment || "No additional comments provided."}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
