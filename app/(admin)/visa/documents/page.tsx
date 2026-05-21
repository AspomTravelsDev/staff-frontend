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

  const result = await getAllDocuments({ type: "visa" });
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

      <a
        href="https://home.mycloud.com/action/share/d0c4d3a8-8f59-4396-98dd-d628d21688ef"
        target="_blank"
        rel="noreferrer"
        className="group relative overflow-hidden rounded-xl border bg-linear-to-r from-amber-50 via-white to-sky-50 p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
      >
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-sky-200/40 blur-2xl" />
        <div className="absolute -bottom-12 -left-10 h-36 w-36 rounded-full bg-amber-200/40 blur-2xl" />
        <div className="relative flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
              Cloud Docs
            </p>
            <h2 className="text-lg font-semibold text-slate-900">
              View Visa Cloud Documents
            </h2>
            <p className="text-sm text-slate-600">
              Open the shared cloud folder for official visa templates.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition group-hover:bg-slate-800">
            Open
            <span aria-hidden="true">→</span>
          </div>
        </div>
      </a>

      <DocumentListTable
        documents={documents}
        isLoading={false}
        showDelete={isSupervisorOrSuper}
      />
    </div>
  );
}
