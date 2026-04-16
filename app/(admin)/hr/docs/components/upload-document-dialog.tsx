"use client";

import { useEffect, useRef, useState } from "react";
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
import { uploadDocumentAction, updateDocumentAction } from "../actions";
import { Loader2, UploadCloud, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner"; // Assuming sonner is used
import { DocumentFile } from "@/types/file-types";

const DOCUMENT_CATEGORIES = [
  { value: "handbook", label: "Handbook" },
  { value: "policies", label: "Policies" },
  { value: "contracts", label: "Contracts" },
  { value: "checklist", label: "Checklist" },
  { value: "sop", label: "SOP" },
  { value: "job_description", label: "Job Description" },
  { value: "guide", label: "Guide" },
  { value: "general", label: "General" },
  { value: "nysc", label: "NYSC" },
  { value: "other", label: "Other" },
];

const DEPARTMENTS = [
  { value: "General", label: "General (All Departments)" },
  { value: "Management", label: "Management" },
  { value: "Administration", label: "Administration" },
  { value: "HR", label: "HR" },
  { value: "IT", label: "IT" },
  { value: "Accounts", label: "Accounts" },
  { value: "Visa", label: "Visa" },
  { value: "Social Media", label: "Social Media" },
  { value: "Compliance", label: "Compliance" },
  { value: "Birth Services", label: "Birth Services" },
  { value: "Holidays", label: "Holidays" },
  { value: "Ticketing", label: "Ticketing" },
];

interface UploadDocumentDialogProps {
  document?: DocumentFile;
  trigger?: React.ReactNode;
}

export function UploadDocumentDialog({
  document: existingDoc,
  trigger,
}: UploadDocumentDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("policies");
  const [department, setDepartment] = useState("HR");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditing = !!existingDoc;

  useEffect(() => {
    if (!open) return;

    if (existingDoc) {
      setTitle(existingDoc.title);
      setCategory(existingDoc.category || "policies");
      setDepartment(existingDoc.department || "HR");
      setDescription(existingDoc.description || "");
      setError(null);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setTitle("");
    setCategory("policies");
    setDepartment("HR");
    setDescription("");
    setError(null);
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [existingDoc, open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      setError("Only PDF, Word, and PowerPoint files are allowed.");
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

  const handleUpload = async () => {
    if (!isEditing && !file) {
      setError("Please select a file to upload.");
      return;
    }
    if (!title.trim()) {
      setError("Please enter a document title.");
      return;
    }

    const formData = new FormData();
    if (file && !isEditing) {
      formData.append("file", file);
    }
    formData.append("title", title);
    formData.append("category", category);
    formData.append("department", department);
    if (description) formData.append("description", description);

    try {
      setIsPending(true);
      const result = isEditing
        ? await updateDocumentAction(existingDoc.id, formData)
        : await uploadDocumentAction(formData);
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
            Upload Document
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Document" : "Upload Document"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update document metadata for this document."
              : "Upload a PDF, Word, or PowerPoint document. Max file size is 2MB."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Employee Handbook 2026"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_CATEGORIES.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="department">Department *</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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

          {!isEditing && (
            <div className="grid gap-2">
              <Label htmlFor="file">Select File *</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx"
                onChange={handleFileChange}
                ref={fileInputRef}
                disabled={isPending}
              />
            </div>
          )}

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
            onClick={handleUpload}
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
