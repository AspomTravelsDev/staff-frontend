import { PayrollManager } from "./components/payroll-manager";

export default function HRPayrollPage() {
  return (
    <div className="flex flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Payroll Run Manager</h1>
        <p className="text-muted-foreground">
          Generate monthly payroll, apply HR overrides, and approve each staff
          entry.
        </p>
      </div>
      <PayrollManager />
    </div>
  );
}
