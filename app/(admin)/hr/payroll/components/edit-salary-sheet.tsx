"use client";

import { useState, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { updateUser } from "@/lib/api/employees";
import type { Employee } from "@/lib/api/employees";
import {
  calculatePayrollEntry,
  calculateMonthlyTax,
  isTaxExempt,
} from "@/lib/payroll/calculations";

const CONTRACT_TYPES = [
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" },
  { value: "contract", label: "Contract" },
  { value: "nysc", label: "NYSC" },
  { value: "intern", label: "Intern" },
];

function formatNGN(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getEstimatedNet(grossPay: number, contractType: string | null, dateJoined: string | null): {
  tax: number;
  net: number;
} {
  const now = new Date();
  const payrollMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const isIntern = isTaxExempt(contractType);

  const result = calculatePayrollEntry({
    baseSalary: grossPay,
    contractType: contractType ?? null,
    isIntern,
    dateJoined: dateJoined ?? null,
    payrollMonth,
    proratedDays: 0,
    accommodationAmount: null,
    attendanceDays: 0,
    suspensionDays: 0,
    otherDeductions: [],
    additions: [],
  });

  return {
    tax: result.tax_amount,
    net: result.net_amount,
  };
}

interface EditSalarySheetProps {
  employee: Employee | null;
  open: boolean;
  onClose: () => void;
  onSaved: (updated: Employee) => void;
}

export function EditSalarySheet({ employee, open, onClose, onSaved }: EditSalarySheetProps) {
  const [grossPayInput, setGrossPayInput] = useState("");
  const [contractType, setContractType] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // Sync state when employee changes
  useMemo(() => {
    if (employee) {
      setGrossPayInput(employee.gross_pay ?? "");
      setContractType(employee.contract_type ?? "full_time");
    }
  }, [employee]);

  const parsedGross = parseFloat(grossPayInput.replace(/,/g, "")) || 0;
  const { tax, net } = getEstimatedNet(parsedGross, contractType, employee?.joinDate ?? null);

  const originalGross = parseFloat(employee?.gross_pay ?? "0") || 0;
  const grossChanged = parsedGross !== originalGross;
  const grossDiff = parsedGross - originalGross;

  const handleSave = async () => {
    if (!employee) return;
    if (parsedGross < 0) {
      toast.error("Gross pay cannot be negative.");
      return;
    }

    setIsSaving(true);
    try {
      const updated = await updateUser(employee.id, {
        gross_pay: parsedGross || null,
        contract_type: contractType || null,
      });

      const updatedEmployee: Employee = {
        ...employee,
        gross_pay: String(parsedGross),
        contract_type: contractType,
      };

      onSaved(updatedEmployee);
      toast.success(`Salary updated for ${employee.firstName} ${employee.lastName}.`);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save salary.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!employee) return null;

  const fullName = `${employee.firstName} ${employee.lastName}`.trim();

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-md flex flex-col gap-0 p-0 overflow-y-auto">
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="text-lg font-semibold">{fullName}</SheetTitle>
          <p className="text-sm text-muted-foreground">
            {employee.staff_id && <span className="font-mono">{employee.staff_id}</span>}
            {employee.department && (
              <span> · {employee.department}</span>
            )}
          </p>
        </SheetHeader>

        <div className="flex-1 px-6 py-6 space-y-6">
          {/* Gross Pay */}
          <div className="space-y-2">
            <Label htmlFor="edit-gross-pay" className="text-sm font-medium">
              Gross Pay <span className="text-muted-foreground font-normal">(₦ / month)</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
                ₦
              </span>
              <Input
                id="edit-gross-pay"
                type="number"
                min={0}
                step={1000}
                className="pl-7 h-10 text-base font-medium"
                value={grossPayInput}
                onChange={(e) => setGrossPayInput(e.target.value)}
                placeholder="0"
              />
            </div>
            {grossChanged && originalGross > 0 && (
              <p className="text-xs flex items-center gap-1">
                {grossDiff > 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-rose-500" />
                )}
                <span className={grossDiff > 0 ? "text-green-600" : "text-rose-600"}>
                  {grossDiff > 0 ? "+" : ""}{formatNGN(grossDiff)} from current {formatNGN(originalGross)}
                </span>
              </p>
            )}
          </div>

          {/* Contract Type */}
          <div className="space-y-2">
            <Label htmlFor="edit-contract-type" className="text-sm font-medium">
              Contract Type
            </Label>
            <Select value={contractType} onValueChange={setContractType}>
              <SelectTrigger id="edit-contract-type" className="h-10">
                <SelectValue placeholder="Select contract type" />
              </SelectTrigger>
              <SelectContent>
                {CONTRACT_TYPES.map((ct) => (
                  <SelectItem key={ct.value} value={ct.value}>
                    {ct.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Live Net Preview */}
          {parsedGross > 0 && (
            <div className="rounded-xl border bg-muted/40 p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Est. Net Preview (full month, no absences)
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Gross Pay</span>
                  <span className="font-medium">{formatNGN(parsedGross)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Est. PAYE Tax</span>
                  <span className="text-rose-600 font-medium">− {formatNGN(tax)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between text-sm font-semibold">
                  <span>Est. Net Pay</span>
                  <span className="text-green-700">{formatNGN(net)}</span>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Estimated only. Actual net will vary based on attendance, deductions, and accommodation.
              </p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 pb-6 pt-2 border-t flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleSave}
            disabled={isSaving || parsedGross < 0}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving…
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
