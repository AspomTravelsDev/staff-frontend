"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { uploadVerificationProofAction } from "../../actions.server";

type VerificationProof = {
  fileName: string;
  storagePath: string;
  uploadedAt: string;
  fileId?: string;
};

export function VerificationProofDialog({
  open,
  title,
  fieldName,
  applicationId,
  onOpenChange,
  onUploaded,
}: {
  open: boolean;
  title: string;
  fieldName: string;
  applicationId: string;
  onOpenChange: (open: boolean) => void;
  onUploaded: (proof: VerificationProof) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    if (!file) {
      toast.error("Upload an image of the verification proof to continue.");
      return;
    }

    startTransition(async () => {
      const result = await uploadVerificationProofAction(
        applicationId,
        file,
        fieldName,
      );
      if (!result.success) {
        toast.error(result.error.message || "Failed to upload verification proof.");
        return;
      }

      onUploaded(result.data);
      setFile(null);
      onOpenChange(false);
      toast.success("Verification proof uploaded.");
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload verification proof</DialogTitle>
          <DialogDescription>
            Upload an image before marking {title.toLowerCase()} as verified.
            Accepted formats: JPG, JPEG, or PNG up to 2MB.
          </DialogDescription>
        </DialogHeader>
        <input
          type="file"
          accept=".jpg,.jpeg,.png,image/jpeg,image/png"
          onChange={(event) => {
            const nextFile = event.target.files?.[0] || null;
            if (nextFile && (nextFile.type === "image/jpeg" || nextFile.type === "image/png") && nextFile.size <= 2 * 1024 * 1024) {
              setFile(nextFile);
            } else {
              setFile(null);
              toast.error("Please select a JPG, JPEG, or PNG image up to 2MB.");
              event.target.value = "";
            }
          }}
          className="block w-full text-xs text-muted-foreground file:mr-4 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary-foreground hover:file:bg-primary/90"
        />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={!file || isPending}>
            {isPending ? "Uploading..." : "Upload and verify"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
