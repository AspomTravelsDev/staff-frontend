import { DocumentListTable } from "../docs/components/document-list-table";
import { UploadDocumentDialog } from "./components/upload-document-dialog";
import { getDocuments } from "./queries";

export default async function HROnboardingDocumentsPage() {
  const documents = await getDocuments();

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Onboarding Documents
          </h1>
          <p className="text-muted-foreground">
            Manage onboarding documents including General, NYSC, and Other.
          </p>
        </div>
        <UploadDocumentDialog />
      </div>

      <DocumentListTable
        documents={documents}
        isLoading={false}
        showDelete={true}
      />
    </div>
  );
}
