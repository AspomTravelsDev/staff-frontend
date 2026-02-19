"use client";

import { DocumentListTable } from "../../hr/docs/components/document-list-table";
import { useDocuments } from "@/lib/api/hooks/use-files";

export default function MyDocumentsPage() {
  const { data: documents, isLoading } = useDocuments();

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Documents & Handbooks
          </h1>
          <p className="text-muted-foreground">
            Download official company documents and policies.
          </p>
        </div>
      </div>

      <DocumentListTable
        documents={documents || []}
        isLoading={isLoading}
        showDelete={false}
      />
    </div>
  );
}
