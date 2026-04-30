import { FileText } from "lucide-react";
import { ExportButton } from "./export-button";
import { PayslipContent } from "./payslip-content";

interface PayslipDocumentProps {
  entry: any;
  user: any;
}

export function PayslipDocument({ entry, user }: PayslipDocumentProps) {
  if (!entry) return null;

  return (
    <div className="space-y-6">
      {/* Document Header with Export */}
      <div className="flex justify-between items-center bg-background p-4 rounded-xl border">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg text-primary">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Payslip Document</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
              Monthly Statement
            </p>
          </div>
        </div>
        <ExportButton />
      </div>

      <PayslipContent entry={entry} user={user} fallbackMonth={entry.run?.payroll_month} />
    </div>
  );
}
