import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getMyPayrollHistory } from "@/lib/api/payroll";
import { PayrollHistory } from "./components/payroll-history";

export default async function PayslipPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  const historyResult = await getMyPayrollHistory();
  const entries = historyResult.success ? historyResult.data.data : [];

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8 lg:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tighter text-slate-800">My Payroll</h1>
          <p className="text-sm text-muted-foreground font-medium">View and download your monthly payment statements</p>
        </div>

        <PayrollHistory initialEntries={entries} user={user} />
      </div>
    </div>
  );
}
