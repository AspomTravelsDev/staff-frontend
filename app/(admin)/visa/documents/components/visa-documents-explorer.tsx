"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { DocumentFile, DocumentFolder, BreadcrumbItem } from "@/types/file-types";
import { Breadcrumbs } from "./breadcrumbs";
import { CreateFolderDialog } from "./create-folder-dialog";
import { UploadDocumentDialog } from "./upload-document-dialog";
import { DocumentListTable } from "./document-list-table";

interface VisaDocumentsExplorerProps {
  folders: DocumentFolder[];
  documents: DocumentFile[];
  breadcrumbs: BreadcrumbItem[];
  allFolders: DocumentFolder[];
  isSupervisorOrSuper: boolean;
  currentFolderId: string | null;
  scope?: "visa" | "hr";
  departments?: string[];
}

export function VisaDocumentsExplorer({
  folders,
  documents,
  breadcrumbs,
  allFolders,
  isSupervisorOrSuper,
  currentFolderId,
  scope = "visa",
  departments = [],
}: VisaDocumentsExplorerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [isFileDragActive, setIsFileDragActive] = useState(false);
  const [droppedFiles, setDroppedFiles] = useState<File[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const handleFileDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (event.dataTransfer.types.includes("application/x-document-ids")) return;
    if (!event.dataTransfer.types.includes("Files")) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setIsFileDragActive(true);
  };

  const handleFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    if (event.dataTransfer.types.includes("application/x-document-ids")) return;
    if (!event.dataTransfer.files.length) return;
    event.preventDefault();
    setIsFileDragActive(false);
    const files = Array.from(event.dataTransfer.files);
    setDroppedFiles(files);
    setIsUploadOpen(true);
  };

  const handleNavigate = (folderId: string | null) => {
    startTransition(() => {
      const params = new URLSearchParams(window.location.search);
      if (folderId) {
        params.set("folder", folderId);
      } else {
        params.delete("folder");
      }
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const parentFolderId =
    breadcrumbs.length > 0
      ? breadcrumbs.length > 1
        ? breadcrumbs[breadcrumbs.length - 2].id
        : null
      : null;

  return (
    <div
      className="relative space-y-6"
      onDragOver={handleFileDragOver}
      onDragLeave={(event) => {
        if (event.currentTarget === event.target) setIsFileDragActive(false);
      }}
      onDrop={handleFileDrop}
    >
      {isFileDragActive && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-lg border-2 border-dashed border-primary bg-primary/5">
          <div className="rounded-md bg-background px-4 py-3 text-sm font-medium shadow-sm">
            Drop documents to upload
          </div>
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Breadcrumbs items={breadcrumbs} onNavigate={handleNavigate} />
        
        {isSupervisorOrSuper && (
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <CreateFolderDialog parentId={currentFolderId} scope={scope} />
            <UploadDocumentDialog
              folderId={currentFolderId}
              scope={scope}
              departments={departments}
              open={isUploadOpen}
              onOpenChange={(open) => {
                setIsUploadOpen(open);
                if (!open) setDroppedFiles([]);
              }}
              initialFiles={droppedFiles}
            />
          </div>
        )}
      </div>

      <DocumentListTable
        folders={folders}
        documents={documents}
        allFolders={allFolders}
        isLoading={isPending}
        showDelete={isSupervisorOrSuper}
        currentFolderId={currentFolderId}
        parentFolderId={parentFolderId}
        onNavigateFolder={handleNavigate}
        scope={scope}
        departments={departments}
      />
    </div>
  );
}
