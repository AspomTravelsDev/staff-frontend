import { DocumentListTable } from "../../hr/docs/components/document-list-table";
import { getDocuments } from "./queries";

export default async function MyDocumentsPage() {
  const documents = await getDocuments();

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
        documents={documents}
        isLoading={false}
        showDelete={false}
      />
    </div>
  );
}
