import { StaffRequestsTable } from "./components/staff-requests-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllHrRequests } from "@/lib/api/hr-requests";

export default async function StaffRequestsPage() {
  let requests = [];
  try {
    const response = await getAllHrRequests();
    console.log(
      "[HR Requests Page] API Response:",
      JSON.stringify(response, null, 2),
    );
    requests = response.data?.data || response.data || [];
    console.log("[HR Requests Page] Extracted data:", requests);
  } catch (error) {
    console.error("[HR Requests Page] Failed to fetch hr requests:", error);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff Requests</h1>
          <p className="text-muted-foreground">
            Review and manage requests for new personnel from staff members.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <StaffRequestsTable requests={requests} />
        </CardContent>
      </Card>
    </div>
  );
}
