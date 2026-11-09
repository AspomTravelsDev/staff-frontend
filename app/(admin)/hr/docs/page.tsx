import { VisaDocumentsExplorer } from "../../visa/documents/components/visa-documents-explorer";
import { getAllFolders, getNestedDocuments } from "@/lib/api/files";
import { getRolesMetadataContract } from "@/lib/auth/roles-metadata";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {  CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function HRDocumentsPage({ searchParams }: { searchParams: Promise<{ folder?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const currentFolderId = resolvedSearchParams.folder || "root";
  const [nestedResult, allFoldersResult, roleMetadata] = await Promise.all([
    getNestedDocuments({ type: "hr,onboarding", folder_id: currentFolderId }),
    getAllFolders({ type: "hr,onboarding" }),
    getRolesMetadataContract(),
  ]);

  const departments = roleMetadata.departments.filter(
    (department) =>
      department !== "Customer Service" &&
      department !== "Other" &&
      department !== "others",
  );
  const loadErrors = [
    !nestedResult.success ? nestedResult.error?.error : null,
    !allFoldersResult.success ? allFoldersResult.error?.error : null,
  ].filter(Boolean);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        <CardHeader className="border-b">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl">HR Documents</CardTitle>
              <CardDescription>
                Organize employee and onboarding documents in folders. Department and category remain document metadata.
              </CardDescription>
            </div>
            <Badge variant="secondary">HR workspace</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {loadErrors.length > 0 && (
            <Alert variant="destructive" className="mb-6">
              <AlertTitle>Documents could not be loaded</AlertTitle>
              <AlertDescription>{loadErrors.join(" ")}</AlertDescription>
            </Alert>
          )}

          <VisaDocumentsExplorer
            folders={nestedResult.success ? nestedResult.data.folders : []}
            documents={nestedResult.success ? nestedResult.data.documents : []}
            breadcrumbs={nestedResult.success ? nestedResult.data.breadcrumbs : []}
            allFolders={allFoldersResult.success ? allFoldersResult.data : []}
            isSupervisorOrSuper={true}
            currentFolderId={currentFolderId === "root" ? null : currentFolderId}
            scope="hr"
            departments={departments}
          />
        </CardContent>
    </div>
  );
}
