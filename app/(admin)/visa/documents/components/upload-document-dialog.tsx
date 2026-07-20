"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadVisaDocumentAction, updateVisaDocumentAction } from "../actions";
import { Loader2, UploadCloud, AlertTriangle, Pencil } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { DocumentFile } from "@/types/file-types";

interface UploadDocumentDialogProps {
  document?: DocumentFile;
  trigger?: React.ReactNode;
  folderId?: string | null;
}

export function UploadDocumentDialog({
  document: existingDoc,
  trigger,
  folderId,
}: UploadDocumentDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!existingDoc;

  // Pre-populate form when editing
  useEffect(() => {
    if (existingDoc && open) {
      setTitle(existingDoc.title);
      setDescription(existingDoc.description || "");
      setTags(existingDoc.tags?.join(", ") || "");
      setError(null);
      setFile(null); // Reset file selection on open
    } else if (!existingDoc && open) {
      // Clear form for new upload
      setTitle("");
      setDescription("");
      setTags("");
      setError(null);
      setFile(null);
    }
  }, [existingDoc, open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (selectedFile.type !== "application/pdf") {
      setError("Only PDF files are allowed.");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Validate file size (2MB = 2 * 1024 * 1024 bytes)
    if (selectedFile.size > 2 * 1024 * 1024) {
      setError("File size must be less than 2MB. Please compress your PDF.");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setError(null);
    setFile(selectedFile);
  };

  const handleSubmit = async () => {
    if (!isEditing && !file) {
      setError("Please select a file to upload.");
      return;
    }
    if (!title.trim()) {
      setError("Please enter a document title.");
      return;
    }

    const formData = new FormData();
    if (file) formData.append("file", file);
    formData.append("title", title);
    if (description) formData.append("description", description);
    if (tags) formData.append("tags", tags);
    if (folderId) formData.append("folder_id", folderId);

    try {
      setIsPending(true);
      const result = isEditing
        ? await updateVisaDocumentAction(existingDoc.id, formData)
        : await uploadVisaDocumentAction(formData);

      if (result.error) {
        setError(result.error);
        return;
      }
      toast.success(
        isEditing
          ? "Document updated successfully"
          : "Document uploaded successfully",
      );
      setOpen(false);
      // Reset form
      setFile(null);
      setTitle("");
      setDescription("");
      setTags("");
      setError(null);
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <UploadCloud className="mr-2 h-4 w-4" />
            Upload Sample
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Visa Sample" : "Upload Visa Sample Document"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details for this sample document."
              : "Upload a PDF document to serve as a sample for clients. Max file size is 2MB."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Canada Visitor Visa Checklist"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="tags">Tags (optional)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. Passport, Bank Statement, Form"
            />
            <p className="text-[10px] text-muted-foreground">
              Separate tags with commas
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the document..."
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="file">
              {isEditing ? "Replace PDF (Optional)" : "Select PDF *"}
            </Label>
            <Input
              id="file"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              ref={fileInputRef}
              disabled={isPending}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {file && !error && (
            <div className="text-sm text-muted-foreground">
              Selected:{" "}
              <span className="font-medium text-foreground">{file.name}</span> (
              {(file.size / 1024 / 1024).toFixed(2)} MB)
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={(!isEditing && !file) || !title || !!error || isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Save Changes" : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
