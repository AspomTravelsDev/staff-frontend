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
import { uploadScopedDocumentAction, uploadScopedDocumentsAction, updateScopedDocumentAction } from "@/lib/api/document-folder-actions";
import { Loader2, UploadCloud, AlertTriangle, Pencil } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { DocumentFile } from "@/types/file-types";

interface UploadDocumentDialogProps {
  document?: DocumentFile;
  trigger?: React.ReactNode;
  folderId?: string | null;
  scope?: "visa" | "hr";
  departments?: string[];
  allowMultiple?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialFiles?: File[];
}

export function UploadDocumentDialog({
  document: existingDoc,
  trigger,
  folderId,
  scope = "visa",
  departments = [],
  allowMultiple = true,
  open: controlledOpen,
  onOpenChange,
  initialFiles = [],
}: UploadDocumentDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (nextOpen: boolean) => {
    setInternalOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };
  const [file, setFile] = useState<File | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [category, setCategory] = useState("policies");
  const [department, setDepartment] = useState("HR");
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
      setCategory(existingDoc.category || "policies");
      setDepartment(existingDoc.department || "HR");
      setFile(null); // Reset file selection on open
      setSelectedFiles([]);
    } else if (!existingDoc && open && initialFiles.length === 0) {
      // Clear form for new upload
      setTitle("");
      setDescription("");
      setTags("");
      setCategory("policies");
      setDepartment("HR");
      setError(null);
      setFile(null);
      setSelectedFiles([]);
    }

  }, [existingDoc, open, initialFiles.length]);

  useEffect(() => {
    if (!existingDoc && open && initialFiles.length > 0) {
      setError(null);
      setFile(initialFiles[0]);
      setSelectedFiles(initialFiles);
    }
  }, [existingDoc, open, initialFiles]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const invalidFile = files.find((selectedFile) => selectedFile.type !== "application/pdf");
    if (invalidFile) {
      setError(`"${invalidFile.name}" is not a PDF file.`);
      setFile(null);
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const oversizedFile = files.find((selectedFile) => selectedFile.size > 2 * 1024 * 1024);
    if (oversizedFile) {
      setError(`"${oversizedFile.name}" exceeds the 2MB file size limit.`);
      setFile(null);
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setError(null);
    setFile(files[0]);
    setSelectedFiles(files);
  };

  const handleSubmit = async () => {
    if (!isEditing && selectedFiles.length === 0) {
      setError("Please select a file to upload.");
      return;
    }
    if (!isEditing && selectedFiles.length > 1) {
      setIsPending(true);
      try {
        const formDataList = selectedFiles.map((selectedFile) => {
          const formData = new FormData();
          formData.append("file", selectedFile);
          formData.append("title", selectedFile.name.replace(/\.pdf$/i, ""));
          if (description) formData.append("description", description);
          if (tags) formData.append("tags", tags);
          if (scope === "hr") {
            formData.append("category", category);
            formData.append("department", department);
          }
          if (folderId) formData.append("folder_id", folderId);
          return formData;
        });
        const result = await uploadScopedDocumentsAction(scope, formDataList);
        if (result.error) {
          setError(result.error);
          return;
        }
        toast.success(`${selectedFiles.length} documents uploaded successfully`);
        setOpen(false);
        return;
      } finally {
        setIsPending(false);
      }
    }
    if (!title.trim() && !isEditing) {
      setError("Please enter a document title.");
      return;
    }

    const formData = new FormData();
    if (file) formData.append("file", file);
    formData.append("title", title);
    if (description) formData.append("description", description);
    if (tags) formData.append("tags", tags);
    if (scope === "hr") {
      formData.append("category", category);
      formData.append("department", department);
    }
    if (folderId) formData.append("folder_id", folderId);

    try {
      setIsPending(true);
      const result = isEditing
        ? await updateScopedDocumentAction(scope, existingDoc.id, formData)
        : await uploadScopedDocumentAction(scope, formData);

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
      setSelectedFiles([]);
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
            Upload document
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Document" : "Upload document"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the document details."
              : "Upload one or more PDF documents. Each file must be 2MB or smaller."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">
              Title{!isEditing && selectedFiles.length <= 1 ? " *" : ""}
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                selectedFiles.length > 1
                  ? "Titles will use the selected filenames"
                  : "e.g. Canada Visitor Visa Checklist"
              }
              disabled={!isEditing && selectedFiles.length > 1}
            />
          </div>
          {scope === "hr" && <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="document-category">Category *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="document-category" className="h-10">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    ["handbook", "Handbook"],
                    ["policies", "Policies"],
                    ["contracts", "Contracts"],
                    ["checklist", "Checklist"],
                    ["sop", "SOP"],
                    ["job_description", "Job Description"],
                    ["guide", "Guide"],
                    ["nysc", "NYSC"],
                    ["other", "Other"],
                  ].map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="document-department">Department *</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger id="document-department" className="h-10">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="General">General (All Departments)</SelectItem>
                  {departments.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>}

          <div className="grid gap-2">
            <Label htmlFor="tags">Tags (optional)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder={scope === "visa" ? "e.g. Passport, Bank Statement, Form" : "e.g. policy, leave, handbook"}
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
              {isEditing ? "Replace PDF (Optional)" : "Select PDF files *"}
            </Label>
            <Input
              id="file"
              type="file"
              accept=".pdf"
              multiple={!isEditing && allowMultiple}
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

          {selectedFiles.length > 1 && !error ? (
            <div className="text-sm text-muted-foreground">
              Selected: <span className="font-medium text-foreground">{selectedFiles.length} PDF files</span>
            </div>
          ) : file && !error && (
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
            disabled={
              (!isEditing && selectedFiles.length === 0) ||
              (!isEditing && selectedFiles.length <= 1 && !title.trim()) ||
              !!error ||
              isPending
            }
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Save Changes" : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
