import { DocumentViewWrapper } from "../../hr/docs/components/document-view-wrapper";
import { getDocuments } from "./queries";

export default async function MyDocumentsPage() {
  const documents = await getDocuments();

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Employee Documents
          </h1>
          <p className="text-muted-foreground">
            Access your onboarding and official company documents.
          </p>
        </div>
      </div>

      <DocumentViewWrapper documents={documents} showDelete={false} />
    </div>
  );
}
