"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DocumentFile, DocumentFolder } from "@/types/file-types";
import { moveVisaDocumentAction } from "../actions";
import { toast } from "sonner";
import {
  Loader2,
  FolderSymlink,
  Folder,
  Home,
  Search,
  Check,
  CornerDownRight,
  AlertCircle,
  FileText,
  X,
  ChevronRight,
} from "lucide-react";
import {
  buildFolderTree,
  formatFolderPath,
  getFolderPathSegments,
  FolderTreeNode,
} from "../lib/folder-tree";

interface MoveDocumentDialogProps {
  document: DocumentFile;
  allFolders: DocumentFolder[];
  trigger: React.ReactNode;
}

export function MoveDocumentDialog({
  document,
  allFolders,
  trigger,
}: MoveDocumentDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string>("root");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Map for fast O(1) folder lookups
  const foldersById = useMemo(
    () => new Map<string, DocumentFolder>(allFolders.map((f) => [f.id, f])),
    [allFolders]
  );

  // Build hierarchical depth-first tree
  const folderTree = useMemo(
    () => buildFolderTree(allFolders),
    [allFolders]
  );

  // Current folder of the document
  const currentFolderId = document.folder_id || "root";

  // Current folder path segments
  const currentLocationSegments = useMemo(
    () => getFolderPathSegments(document.folder_id, foldersById),
    [document.folder_id, foldersById]
  );

  // Reset selection & search when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedFolderId(document.folder_id || "root");
      setSearchQuery("");
    }
  }, [open, document.folder_id]);

  // Filter tree nodes based on search query
  const filteredTree = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return folderTree;

    return folderTree.filter(
      (node) =>
        node.name.toLowerCase().includes(q) ||
        node.fullPath.toLowerCase().includes(q)
    );
  }, [folderTree, searchQuery]);

  const isRootMatchingSearch = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return "root".includes(q) || "home".includes(q) || "top".includes(q);
  }, [searchQuery]);

  // Destination path string for the currently selected folder
  const destinationPathString = useMemo(() => {
    if (selectedFolderId === "root") {
      return "Root Folder";
    }
    return formatFolderPath(selectedFolderId, foldersById);
  }, [selectedFolderId, foldersById]);

  const isCurrentLocationSelected = selectedFolderId === currentFolderId;

  const handleMove = async () => {
    if (isCurrentLocationSelected) {
      toast.info("Document is already in this folder");
      return;
    }

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
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] flex flex-col p-6 gap-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900 text-lg">
            <FolderSymlink className="h-5 w-5 text-sky-600" />
            <span>Move Document</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Select a destination folder in the hierarchy to relocate this document.
          </DialogDescription>
        </DialogHeader>

        {/* Current Document & Location Context */}
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 space-y-2 text-xs">
          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-lg bg-sky-100/60 text-sky-700 shrink-0">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Document
              </p>
              <p className="text-sm font-semibold text-slate-900 truncate" title={document.title}>
                {document.title}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-1.5 text-xs">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Current Location:
            </span>
            <div className="flex items-center gap-1 font-medium text-slate-700 max-w-[340px] truncate text-[11px] bg-white border border-slate-200/70 rounded-md px-2 py-0.5">
              {currentLocationSegments.map((segment, idx) => (
                <span key={idx} className="flex items-center gap-1">
                  {idx === 0 ? (
                    <Home className="h-3 w-3 text-sky-600 shrink-0" />
                  ) : (
                    <ChevronRight className="h-3 w-3 text-slate-400 shrink-0" />
                  )}
                  <span
                    className={
                      idx === currentLocationSegments.length - 1
                        ? "font-semibold text-slate-900"
                        : "text-slate-600"
                    }
                  >
                    {segment}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Destination Folder Selection */}
        <div className="space-y-2 flex-1 min-h-0 flex flex-col">
          <div className="flex items-center justify-between">
            <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              Select Destination Folder
            </label>
            <span className="text-[11px] text-muted-foreground font-mono">
              {allFolders.length + 1} total folders
            </span>
          </div>

          {/* Search/Filter Bar */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search folders by name or path..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-8 h-8 text-xs bg-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Hierarchical Folder List */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white max-h-[240px] overflow-y-auto divide-y divide-slate-100">
            {/* Root Folder Option */}
            {isRootMatchingSearch && (
              <div
                role="button"
                tabIndex={0}
                onClick={() => setSelectedFolderId("root")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setSelectedFolderId("root");
                  }
                }}
                className={`flex items-center justify-between p-2.5 text-xs transition-colors cursor-pointer select-none ${
                  selectedFolderId === "root"
                    ? "bg-sky-50 font-medium text-sky-950 border-l-4 border-sky-600"
                    : "hover:bg-slate-50 text-slate-800"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1 rounded bg-sky-100 text-sky-700">
                    <Home className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-900">
                        [Root Folder]
                      </span>
                      {currentFolderId === "root" && (
                        <Badge
                          variant="outline"
                          className="text-[9px] px-1 py-0 h-4 bg-slate-100 text-slate-600 font-normal"
                        >
                          Current
                        </Badge>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      Top-level directory
                    </span>
                  </div>
                </div>

                {selectedFolderId === "root" && (
                  <Check className="h-4 w-4 text-sky-600 shrink-0 ml-2" />
                )}
              </div>
            )}

            {/* Tree Folder Nodes */}
            {filteredTree.map((node: FolderTreeNode) => {
              const isSelected = selectedFolderId === node.id;
              const isCurrent = currentFolderId === node.id;
              const hasSearch = searchQuery.trim().length > 0;

              return (
                <div
                  key={node.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedFolderId(node.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setSelectedFolderId(node.id);
                    }
                  }}
                  style={{
                    paddingLeft: hasSearch ? "12px" : `${Math.min(node.depth, 6) * 18 + 12}px`,
                  }}
                  className={`flex items-center justify-between pr-3 py-2 text-xs transition-colors cursor-pointer select-none ${
                    isSelected
                      ? "bg-sky-50 font-medium text-sky-950 border-l-4 border-sky-600"
                      : "hover:bg-slate-50 text-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {!hasSearch && node.depth > 0 && (
                      <CornerDownRight className="h-3 w-3 text-slate-400 shrink-0" />
                    )}
                    <Folder className="h-3.5 w-3.5 text-amber-500 fill-amber-100 shrink-0" />

                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium text-slate-900 truncate">
                          {node.name}
                        </span>
                        {isCurrent && (
                          <Badge
                            variant="outline"
                            className="text-[9px] px-1 py-0 h-4 bg-slate-100 text-slate-600 font-normal"
                          >
                            Current
                          </Badge>
                        )}
                      </div>

                      {/* Parent / Full Path Context */}
                      {hasSearch ? (
                        <span className="text-[10px] text-sky-700 truncate font-mono">
                          {node.fullPath}
                        </span>
                      ) : (
                        node.parentPath && (
                          <span className="text-[10px] text-muted-foreground truncate">
                            in {node.parentPath}
                          </span>
                        )
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="h-4 w-4 text-sky-600 shrink-0 ml-2" />
                  )}
                </div>
              );
            })}

            {filteredTree.length === 0 && !isRootMatchingSearch && (
              <div className="p-6 text-center text-xs text-muted-foreground">
                No matching folders found for &quot;{searchQuery}&quot;
              </div>
            )}
          </div>
        </div>

        {/* Target Destination Confirmation / Validation Notice */}
        {isCurrentLocationSelected ? (
          <div className="rounded-lg bg-amber-50 border border-amber-200/80 px-3 py-2 text-xs text-amber-800 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>This document is already inside this folder.</span>
          </div>
        ) : (
          <div className="rounded-lg bg-sky-50/70 border border-sky-200/70 px-3 py-2 text-xs text-sky-900 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <FolderSymlink className="h-4 w-4 text-sky-600 shrink-0" />
              <span className="text-muted-foreground shrink-0">Moving to:</span>
              <span className="font-semibold text-slate-900 truncate">
                {destinationPathString}
              </span>
            </div>
          </div>
        )}

        {/* Dialog Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            onClick={handleMove}
            disabled={isSubmitting || isCurrentLocationSelected}
            className="text-xs"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
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
