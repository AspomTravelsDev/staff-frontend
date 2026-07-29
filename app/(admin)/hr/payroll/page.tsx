import { Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PayrollManager } from "./components/payroll-manager";
import { SalarySettings } from "./components/salary-settings";
import { getEmployees } from "@/lib/api/employees";

export default async function HRPayrollPage() {
  const employeesData = await getEmployees({ status: "Active", limit: 1000 });
  const employees = employeesData.items;

  return (
    <div className="flex flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Payroll</h1>
        <p className="text-muted-foreground">
          Manage payroll runs and staff salary settings.
        </p>
      </div>

      <Tabs defaultValue="runs">
        <TabsList className="w-full max-w-xs">
          <TabsTrigger value="runs" className="flex-1">Payroll Runs</TabsTrigger>
          <TabsTrigger value="salary" className="flex-1">Salary Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="runs" className="mt-6">
          <Suspense fallback={<div className="py-16 text-center text-sm text-muted-foreground">Loading payroll…</div>}>
            <PayrollManager />
          </Suspense>
        </TabsContent>

        <TabsContent value="salary" className="mt-6">
          <SalarySettings initialEmployees={employees} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
