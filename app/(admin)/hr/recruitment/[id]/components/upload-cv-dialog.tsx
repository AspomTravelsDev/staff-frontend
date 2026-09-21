"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
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
import { UploadCloud, FileText, Loader2, CheckCircle2 } from "lucide-react";
import { uploadCandidateCv } from "@/lib/api/recruitment";
import { toast } from "sonner";

interface UploadCvDialogProps {
  roleId: string;
  roleTitle: string;
  trigger?: React.ReactNode;
}

export function UploadCvDialog({ roleId, roleTitle, trigger }: UploadCvDialogProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [candidatePhone, setCandidatePhone] = useState("");

  const [uploading, setUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      const ext = selected.name.split(".").pop()?.toLowerCase();
      if (!["pdf", "docx", "doc", "txt"].includes(ext || "")) {
        toast.error("Please select a PDF or Word document (.pdf, .docx, .doc).");
        return;
      }
      setFile(selected);
      // Pre-fill candidate name from filename if empty
      if (!candidateName) {
        const rawName = selected.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
        setCandidateName(rawName);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      const ext = dropped.name.split(".").pop()?.toLowerCase();
      if (!["pdf", "docx", "doc", "txt"].includes(ext || "")) {
        toast.error("Please upload a PDF or Word document.");
        return;
      }
      setFile(dropped);
      if (!candidateName) {
        const rawName = dropped.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
        setCandidateName(rawName);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please select a CV document to upload.");
      return;
    }

    try {
      setUploading(true);
      setUploadStep("Extracting text and reading document...");

      const formData = new FormData();
      formData.append("cv_file", file);
      if (candidateName.trim()) formData.append("name", candidateName.trim());
      if (candidateEmail.trim()) formData.append("email", candidateEmail.trim());
      if (candidatePhone.trim()) formData.append("phone", candidatePhone.trim());

      setUploadStep("Evaluating candidate with Gemini AI against role criteria...");
      const candidate = await uploadCandidateCv(roleId, formData);

      toast.success(
        `Candidate analyzed! Match score: ${candidate.ai_score ?? "N/A"}%`
      );
      setOpen(false);
      setFile(null);
      setCandidateName("");
      setCandidateEmail("");
      setCandidatePhone("");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to upload and analyze CV.");
    } finally {
      setUploading(false);
      setUploadStep("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <UploadCloud className="h-4 w-4" />
            Upload Candidate CV
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Upload Candidate CV
          </DialogTitle>
          <DialogDescription>
            Upload a candidate's resume for <strong>{roleTitle}</strong>. The system will extract text locally and evaluate candidate qualifications against role criteria.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* File Upload Dropzone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              file
                ? "border-primary/50 bg-muted/30"
                : "border-muted hover:border-primary/40 hover:bg-muted/30"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc,.txt"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />

            {file ? (
              <div className="flex flex-col items-center gap-2">
                <div className="p-3 bg-primary/10 text-primary rounded-full">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="text-sm font-medium text-foreground max-w-[280px] truncate">
                  {file.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB • Click or drop another to replace
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="p-3 bg-muted text-muted-foreground rounded-full">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <div className="text-sm font-medium">
                  Click to browse or drop resume here
                </div>
                <div className="text-xs text-muted-foreground">
                  Supports PDF or Word documents (.pdf, .docx, up to 15MB)
                </div>
              </div>
            )}
          </div>

          {/* Optional manual contact overrides */}
          <div className="space-y-3 pt-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Candidate Details (Optional - auto-extracted by AI if blank)
            </p>

            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs">Candidate Name</Label>
              <Input
                id="name"
                placeholder="Leave blank for automatic AI extraction"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                disabled={uploading}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Auto-extracted"
                  value={candidateEmail}
                  onChange={(e) => setCandidateEmail(e.target.value)}
                  disabled={uploading}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="Auto-extracted"
                  value={candidatePhone}
                  onChange={(e) => setCandidatePhone(e.target.value)}
                  disabled={uploading}
                />
              </div>
            </div>
          </div>

          {/* Progress Banner during Upload */}
          {uploading && (
            <div className="rounded-lg border border-primary/20 bg-primary/10 p-3 flex items-center gap-3">
              <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
              <div className="text-xs text-primary font-medium">
                {uploadStep}
              </div>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!file || uploading} className="gap-2">
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing CV...
                </>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4" />
                  Upload & Screen CV
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
