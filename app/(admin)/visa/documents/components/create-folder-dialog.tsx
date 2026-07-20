"use client";

import { useState, useEffect } from "react";
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
import { FolderPlus, Loader2, Pencil } from "lucide-react";
import { createVisaFolderAction, updateVisaFolderAction } from "../actions";
import { toast } from "sonner";
import { DocumentFolder } from "@/types/file-types";

interface CreateFolderDialogProps {
  folder?: DocumentFolder;
  parentId?: string | null;
  trigger?: React.ReactNode;
}

export function CreateFolderDialog({
  folder: existingFolder,
  parentId,
  trigger,
}: CreateFolderDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const isEditing = !!existingFolder;

  useEffect(() => {
    if (existingFolder && open) {
      setName(existingFolder.name);
      setError(null);
    } else if (!existingFolder && open) {
      setName("");
      setError(null);
    }
  }, [existingFolder, open]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Please enter a folder name.");
      return;
    }

    try {
      setIsPending(true);
      setError(null);

      const result = isEditing
        ? await updateVisaFolderAction(existingFolder.id, name)
        : await createVisaFolderAction(name, parentId);

      if (result.error) {
        setError(result.error);
        return;
      }

      toast.success(
        isEditing
          ? "Folder renamed successfully"
          : "Folder created successfully"
      );
      setOpen(false);
      setName("");
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
          <Button variant="outline">
            <FolderPlus className="mr-2 h-4 w-4" />
            New Folder
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Rename Folder" : "Create New Folder"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Change the name of this folder."
              : "Create a new folder to organize checklists and template files."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Folder Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder="e.g. Canada Visitor Visa"
              disabled={isPending}
            />
          </div>

          {error && (
            <p className="text-xs font-semibold text-destructive">{error}</p>
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
          <Button onClick={handleSubmit} disabled={!name.trim() || isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Rename" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
