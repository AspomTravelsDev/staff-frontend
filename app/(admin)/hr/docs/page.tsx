import { UploadDocumentDialog } from "./components/upload-document-dialog";
import { DocumentViewWrapper } from "./components/document-view-wrapper";
import { getDocuments } from "./queries";
import { getRolesMetadataContract } from "@/lib/auth/roles-metadata";

export default async function HRDocumentsPage() {
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
            Access Documents
          </h1>
          <p className="text-muted-foreground">
            Manage organization documents and handbooks.
          </p>
        </div>
        <UploadDocumentDialog departments={departments} />
      </div>

      <DocumentViewWrapper
        documents={documents}
        showDelete={true}
        departments={departments}
      />
    </div>
  );
}
