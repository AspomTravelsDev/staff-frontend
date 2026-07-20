"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DocumentFile, DocumentFolder } from "@/types/file-types";
import { moveVisaDocumentAction } from "../actions";
import { toast } from "sonner";
import { Loader2, FolderSymlink } from "lucide-react";

interface MoveDocumentDialogProps {
  document: DocumentFile;
  allFolders: DocumentFolder[];
  trigger: React.ReactNode;
}

export function MoveDocumentDialog({ document, allFolders, trigger }: MoveDocumentDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string>("root");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      // Default selected to current folder (if null, then "root")
      setSelectedFolderId(document.folder_id || "root");
    }
  }, [open, document]);

  const handleMove = async () => {
    setIsSubmitting(true);
    try {
      // Map "root" back to null on server side
      const targetFolderId = selectedFolderId === "root" ? null : selectedFolderId;
      const result = await moveVisaDocumentAction(document.id, targetFolderId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Document moved successfully");
        setOpen(false);
      }
    } catch (e) {
      console.error(e);
      toast.error("Error moving document");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <FolderSymlink className="h-5 w-5 text-sky-600" />
            <span>Move Document</span>
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-1.5">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              Document to Move
            </span>
            <p className="text-sm font-semibold text-slate-800 truncate">
              {document.title}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              Select Destination Folder
            </label>
            <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a folder" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                <SelectItem value="root">
                  <span className="font-semibold text-sky-600">📂 [Root Folder]</span>
                </SelectItem>
                {allFolders.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    📂 {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleMove} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Moving...
              </>
            ) : (
              "Move Document"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
