"use client";

import { formatDistanceToNow } from "date-fns";
import {
  MoreHorizontal,
  Box,
  Wrench,
  Monitor,
  Key,
  HelpCircle,
  FileQuestion,
  Pencil,
  Trash2,
  Loader2,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { RequestItem } from "@/lib/api/requests";
import {
  useDeleteRequest,
  useUpdateRequest,
} from "@/lib/api/hooks/use-requests";
import { useState } from "react";

interface MyRequestsTableProps {
  requests: RequestItem[];
  onEdit: (request: RequestItem) => void;
}

const categoryIcons: Record<string, React.ElementType> = {
  Toiletries: Box,
  Repairs: Wrench,
  Gadget: Monitor,
  Access: Key,
  Other: HelpCircle,
};

function getStatusVariant(status: RequestItem["status"]) {
  switch (status) {
    case "completed":
    case "approved":
      return "default"; // green/primary
    case "rejected":
      return "destructive";
    case "in_progress":
      return "secondary";
    case "cancelled":
      return "secondary"; // or a specific variant for cancelled
    case "pending":
    default:
      return "outline";
  }
}

export function MyRequestsTable({ requests, onEdit }: MyRequestsTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const deleteMutation = useDeleteRequest();
  const updateMutation = useUpdateRequest();

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      setDeleteId(null);
    } catch (e) {
      console.error("Failed to delete request", e);
    }
  };

  const handleCancel = async () => {
    if (!cancelId) return;
    try {
      await updateMutation.mutateAsync({
        id: cancelId,
        data: { status: "cancelled" },
      });
      setCancelId(null);
    } catch (e) {
      console.error("Failed to cancel request", e);
    }
  };

  const isDeleting = deleteMutation.isPending;
  const isCancelling = updateMutation.isPending;

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border rounded-lg border-dashed">
        <FileQuestion className="h-12 w-12 opacity-50 mb-4" />
        <p>No requests found</p>
        <p className="text-sm">Create a new request to get started.</p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Category</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => {
            const CategoryIcon = categoryIcons[request.category] || HelpCircle;

            return (
              <TableRow key={request.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-muted">
                      <CategoryIcon className="h-4 w-4 text-foreground/70" />
                    </div>
                    <span className="font-medium text-sm">
                      {request.category}
                    </span>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex flex-col max-w-[300px]">
                    <span className="font-medium text-sm truncate">
                      {request.reason}
                    </span>
                    <span
                      className="text-xs text-muted-foreground truncate"
                      title={request.details}
                    >
                      {request.details}
                    </span>
                  </div>
                </TableCell>

                <TableCell>
                  <Badge variant={getStatusVariant(request.status)}>
                    {request.status.replace("_", " ")}
                  </Badge>
                </TableCell>

                <TableCell>
                  <Badge variant="outline" className="capitalize text-xs">
                    {request.priority}
                  </Badge>
                </TableCell>

                <TableCell className="whitespace-nowrap text-muted-foreground text-sm">
                  {formatDistanceToNow(new Date(request.request_date), {
                    addSuffix: true,
                  })}
                </TableCell>

                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {request.status === "pending" && (
                        <>
                          <DropdownMenuItem onClick={() => onEdit(request)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setCancelId(request.id)}
                            className="text-orange-600 focus:text-orange-600"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Cancel
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteId(request.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </>
                      )}

                      {request.status !== "pending" && (
                        <div className="px-2 py-1.5 text-xs text-muted-foreground">
                          No actions available
                        </div>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Request?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this request? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!cancelId}
        onOpenChange={(open) => !open && setCancelId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Request?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this request?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Back</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleCancel();
              }}
              className="bg-orange-600 hover:bg-orange-700"
              disabled={isCancelling}
            >
              {isCancelling && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Cancel Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
