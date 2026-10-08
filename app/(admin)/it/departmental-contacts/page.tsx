import { renderDataPage } from "@/lib/api/render-data-page";
import { getDepartmentalContacts } from "@/lib/api/departmental-contacts";
import { DepartmentalContactsClient } from "./client";

export const metadata = {
    title: "Manage Departmental Contacts | Aspom Portal",
    description: "IT Administration for Departmental Contacts",
};

export default async function DepartmentalContactsPage() {
  return renderDataPage(async () => {
    const initialContacts = await getDepartmentalContacts();

    return (
        <div className="flex flex-col gap-8 p-4 md:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Departmental Contacts</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage contact information for different departments.
                    </p>
                </div>
            </div>

            <DepartmentalContactsClient initialContacts={initialContacts} />
        </div>
    );

  }, "Unable to load departmental contacts");
}
