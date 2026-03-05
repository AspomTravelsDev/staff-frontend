import { UploadDocumentDialog } from "./components/upload-document-dialog";
import { DocumentViewWrapper } from "./components/document-view-wrapper";
import { getDocuments } from "./queries";

export default async function HRDocumentsPage() {
  const documents = await getDocuments();

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

      <DocumentViewWrapper documents={documents} showDelete={true} />
    </div>
  );
}
