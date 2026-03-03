"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconCopy,
  IconCheck,
  IconTrash,
  IconMail,
  IconDownload,
  IconRefresh,
} from "@tabler/icons-react";

import type { ApplicationDetail } from "../../queries";
import { updateApplicationStatus, deleteApplication } from "../../new/actions";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ApplicationActionsProps {
  application: ApplicationDetail;
}

export function ApplicationActions({ application }: ApplicationActionsProps) {
  const router = useRouter();
  const [copied, setCopied] = useState<"id" | "url" | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/visa/apply/${application.country}/${application.id}`
      : "";

  const handleCopy = async (type: "id" | "url") => {
    const text = type === "id" ? application.id : publicUrl;
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true);
    const result = await updateApplicationStatus(
      application.id,
      newStatus as ApplicationDetail["status"],
    );
    setIsUpdating(false);

    if (result.error) {
      console.error("Failed to update status:", result.error);
      toast.error(result.error || "Failed to update status");
    } else {
      toast.success(`Status updated to ${newStatus}`);
      router.refresh();
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteApplication(application.id);
    setIsDeleting(false);

    if (result.error) {
      console.error("Failed to delete:", result.error);
      toast.error(result.error || "Failed to delete application");
    } else {
      toast.success("Application deleted successfully");
      router.push("/visa/applications");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-4">
      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => handleCopy("id")}
          >
            {copied === "id" ? (
              <IconCheck className="mr-2 size-4" />
            ) : (
              <IconCopy className="mr-2 size-4" />
            )}
            Copy Application ID
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => handleCopy("url")}
          >
            {copied === "url" ? (
              <IconCheck className="mr-2 size-4" />
            ) : (
              <IconCopy className="mr-2 size-4" />
            )}
            Copy Public URL
          </Button>
          <Button variant="outline" className="w-full justify-start" disabled>
            <IconMail className="mr-2 size-4" />
            Send Reminder Email
          </Button>
          <Button variant="outline" className="w-full justify-start" disabled>
            <IconDownload className="mr-2 size-4" />
            Export as PDF
          </Button>
        </CardContent>
      </Card>

      {/* Status management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status</CardTitle>
          <CardDescription>Update application status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select
            value={application.status}
            onValueChange={handleStatusChange}
            disabled={isUpdating}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          {isUpdating && (
            <p className="text-muted-foreground flex items-center gap-2 text-sm">
              <IconRefresh className="size-4 animate-spin" />
              Updating status...
            </p>
          )}
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Timeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Created</span>
            <span>{formatDate(application.created_at)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last Updated</span>
            <span>{formatDate(application.updated_at)}</span>
          </div>
          {application.submitted_at && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Submitted</span>
              <span>{formatDate(application.submitted_at)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive text-base">
            Danger Zone
          </CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="w-full"
                disabled={isDeleting}
              >
                <IconTrash className="mr-2 size-4" />
                Delete Application
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  application and all associated data including uploaded
                  documents.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
