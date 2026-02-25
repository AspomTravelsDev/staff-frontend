import { DocumentListTable } from "./components/document-list-table";
import { UploadDocumentDialog } from "./components/upload-document-dialog";
import { getAllDocuments } from "@/lib/api/files";
import { getCurrentUser } from "@/lib/auth/session";
import { USER_ROLES } from "@/types/user-types";
import { redirect } from "next/navigation";

export default async function VisaDocumentsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Restrict to Visa Officers and Super Admins
  if (
    user.role !== USER_ROLES.VISA_OFFICER &&
    user.role !== USER_ROLES.SUPER_ADMIN
  ) {
    redirect("/dashboard");
  }

  const result = await getAllDocuments({ category: "visa" });
  const documents = result.success ? result.data : [];

  const isSupervisorOrSuper =
    user.role === USER_ROLES.SUPER_ADMIN ||
    (user.role === USER_ROLES.VISA_OFFICER && user.is_supervisor);

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Visa Sample Documents
          </h1>
          <p className="text-muted-foreground">
            Access sample checklists and forms for Visa applications.
          </p>
        </div>
        {isSupervisorOrSuper && <UploadDocumentDialog />}
      </div>

      <DocumentListTable
        documents={documents}
        isLoading={false}
        showDelete={isSupervisorOrSuper}
      />
    </div>
  );
}
