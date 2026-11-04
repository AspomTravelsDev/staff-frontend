import { DocumentListTable } from "./components/document-list-table";
import { UploadDocumentDialog } from "./components/upload-document-dialog";
import { getDocuments } from "./queries";
import { getRolesMetadataContract } from "@/lib/auth/roles-metadata";

export default async function HROnboardingDocumentsPage() {
  const [documents, roleMetadata] = await Promise.all([
    getDocuments(),
    getRolesMetadataContract(),
  ]);

  const departments = roleMetadata.departments.filter(
    (department) =>
      department !== "Customer Service" &&
      department !== "Other" &&
      department !== "others",
  );

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Onboarding Documents
          </h1>
          <p className="text-muted-foreground">
            Manage onboarding resources for new staff, including general
            documents, NYSC, checklists, SOPs, job descriptions, and guides.
          </p>
        </div>
        <UploadDocumentDialog departments={departments} />
      </div>

      <DocumentListTable
        documents={documents}
        isLoading={false}
        showDelete={true}
        departments={departments}
      />
    </div>
  );
}
