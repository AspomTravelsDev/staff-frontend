"use client";

import { DocumentListTable } from "./components/document-list-table";
import { UploadDocumentDialog } from "./components/upload-document-dialog";
import { useDocuments } from "@/lib/api/hooks/use-files";

export default function HRDocumentsPage() {
  const { data: documents, isLoading } = useDocuments();

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Access Documents
          </h1>
          <p className="text-muted-foreground">
            Manage organization documents and handbooks.
          </p>
        </div>
        <UploadDocumentDialog />
      </div>

      <DocumentListTable
        documents={documents || []}
        isLoading={isLoading}
        showDelete={true}
      />
    </div>
  );
}
