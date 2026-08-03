"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  deleteApplicationAction,
  generateDocumentsAction,
  requestCorrectionAction,
  sendReminderAction,
} from "../../actions";

interface ApplicationActionsClientProps {
  applicationId: string; // The UUID for API calls
  readableId: string; // The formatted ID (e.g. ASPOM-...)
  status: string | null;
}

export function ApplicationActionsClient({
  applicationId,
  readableId,
  status,
}: ApplicationActionsClientProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSendingReminder, setIsSendingReminder] = useState(false);
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);
  const [reminderNote, setReminderNote] = useState("");
  const [isCorrectionDialogOpen, setIsCorrectionDialogOpen] = useState(false);
  const [isSubmittingCorrection, setIsSubmittingCorrection] = useState(false);
  const [correctionReason, setCorrectionReason] = useState<
    | "unsigned_documents"
    | "missing_required_pages"
    | "missing_supporting_documents"
    | "invalid_document_quality"
    | "mismatched_information"
    | "other"
    | ""
  >("");
  const [correctionNote, setCorrectionNote] = useState("");

  const correctionReasons = [
    {
      value: "unsigned_documents" as const,
      label: "Unsigned documents uploaded",
    },
    {
      value: "missing_required_pages" as const,
      label: "Missing required pages/documents",
    },
    {
      value: "missing_supporting_documents" as const,
      label: "Missing required supporting credentials (ID, NYSC, etc.)",
    },
    {
      value: "invalid_document_quality" as const,
      label: "Document quality is too poor to verify",
    },
    {
      value: "mismatched_information" as const,
      label: "Information mismatch across submitted documents",
    },
    {
      value: "other" as const,
      label: "Other",
    },
  ];

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteApplicationAction(applicationId);
      toast.success("Application deleted successfully");
      router.push("/hr/applications");
    } catch (error) {
      toast.error("Failed to delete application");
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleGenerateDocuments = async () => {
    setIsGenerating(true);
    try {
      await generateDocumentsAction(applicationId);
      toast.success("Documents generated successfully");
      router.refresh(); // Refresh to show new documents in preview
    } catch (error) {
      toast.error("Failed to generate documents");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendReminder = async () => {
    if (!reminderNote.trim()) {
      toast.error("Please add a reminder note");
      return;
    }

    if (reminderNote.trim().length < 10) {
      toast.error("Reminder note must be at least 10 characters");
      return;
    }

    setIsSendingReminder(true);
    try {
      await sendReminderAction(applicationId, reminderNote.trim());
      toast.success("Reminder email sent");
      setIsReminderDialogOpen(false);
      setReminderNote("");
      router.refresh();
    } catch (error) {
      toast.error("Failed to send reminder email");
      console.error(error);
    } finally {
      setIsSendingReminder(false);
    }
  };

  const handleSubmitCorrection = async () => {
    if (!correctionReason) {
      toast.error("Please select a correction reason");
      return;
    }

    if (!correctionNote.trim()) {
      toast.error("Please add a correction note");
      return;
    }

    setIsSubmittingCorrection(true);
    try {
      await requestCorrectionAction(
        applicationId,
        correctionReason,
        correctionNote.trim(),
      );
      toast.success("Correction request sent to applicant");
      setIsCorrectionDialogOpen(false);
      setCorrectionReason("");
      setCorrectionNote("");
      router.refresh();
    } catch (error) {
      toast.error("Failed to request correction");
      console.error(error);
    } finally {
      setIsSubmittingCorrection(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={handleGenerateDocuments}
            disabled={isGenerating}
          >
            {isGenerating ? "Generating..." : "Generate Documents"}
          </Button>

          <Button
            variant="outline"
            onClick={() => setIsReminderDialogOpen(true)}
            disabled={isSendingReminder || status === "completed"}
          >
            {isSendingReminder ? "Sending..." : "Send Reminder Email"}
          </Button>

          <Button
            variant="secondary"
            onClick={() => setIsCorrectionDialogOpen(true)}
            disabled={status !== "completed"}
          >
            Request Correction
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete Application"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the application for{" "}
                  <strong>{readableId}</strong> and all associated documents.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <p className="text-xs text-muted-foreground">
          {status === "completed"
            ? "This application is completed. You can request correction to reopen it for applicant updates."
            : "Actions to manage the application process."}
        </p>

        <Dialog
          open={isReminderDialogOpen}
          onOpenChange={setIsReminderDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Reminder Email</DialogTitle>
              <DialogDescription>
                Send a reminder to the applicant with a note from HR.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <label className="text-sm font-medium">Reminder Note *</label>
              <Textarea
                value={reminderNote}
                onChange={(e) => setReminderNote(e.target.value)}
                placeholder="Add a clear reminder note for the applicant."
                rows={5}
              />
              <p className="text-xs text-muted-foreground">
                Minimum 10 characters.
              </p>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsReminderDialogOpen(false)}
                disabled={isSendingReminder}
              >
                Cancel
              </Button>
              <Button onClick={handleSendReminder} disabled={isSendingReminder}>
                {isSendingReminder ? "Sending..." : "Send Reminder"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isCorrectionDialogOpen}
          onOpenChange={setIsCorrectionDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Applicant Correction</DialogTitle>
              <DialogDescription>
                This will set the application back to in progress and email the
                applicant with your note.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Reason *</label>
                <Select
                  value={correctionReason}
                  onValueChange={(value) =>
                    setCorrectionReason(value as typeof correctionReason)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select correction reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {correctionReasons.map((reason) => (
                      <SelectItem key={reason.value} value={reason.value}>
                        {reason.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Note *</label>
                <Textarea
                  value={correctionNote}
                  onChange={(e) => setCorrectionNote(e.target.value)}
                  placeholder="Explain exactly what needs correction (e.g. NDA was uploaded unsigned)."
                  rows={5}
                />
                <p className="text-xs text-muted-foreground">
                  Minimum 10 characters.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCorrectionDialogOpen(false)}
                disabled={isSubmittingCorrection}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitCorrection}
                disabled={isSubmittingCorrection}
              >
                {isSubmittingCorrection
                  ? "Submitting..."
                  : "Send Correction Request"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
