import { getEmployees } from "@/lib/api/employees";
import { getDepartmentalContacts } from "@/lib/api/departmental-contacts";
import { DirectoryClient } from "./client";

export const metadata = {
    title: "Staff Directory | Aspom Portal",
    description: "Browse staff directory and departmental contacts",
};

export default async function DirectoryPage() {
    // We fetch employees without pagination for the directory, so we can filter client-side.
    // getEmployees with no page works, but defaults to limit 20. Let's pass a huge limit or just use the client to fetch more inside if needed. 
    // Actually, getEmployees uses client-side pagination from a full payload in backend. So limit 1000 will get all.
    const initialEmployeesResult = await getEmployees({ limit: 1000, status: "Active" });
    const initialDeps = await getDepartmentalContacts();

    return (
        <div className="flex flex-col gap-8 p-4 md:p-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Staff Directory</h1>
            </div>

            <DirectoryClient
                initialEmployees={initialEmployeesResult.items}
                initialDepartmentalContacts={initialDeps}
            />
        </div>
    );
}
