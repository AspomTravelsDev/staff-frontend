"use client";

import { useTransition } from "react";
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
}

export function VisaDocumentsExplorer({
  folders,
  documents,
  breadcrumbs,
  allFolders,
  isSupervisorOrSuper,
  currentFolderId,
}: VisaDocumentsExplorerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Breadcrumbs items={breadcrumbs} onNavigate={handleNavigate} />
        
        {isSupervisorOrSuper && (
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <CreateFolderDialog parentId={currentFolderId} />
            <UploadDocumentDialog folderId={currentFolderId} />
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
      />
    </div>
  );
}
