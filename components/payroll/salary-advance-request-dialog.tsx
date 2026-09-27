"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createSalaryAdvanceRequest } from "@/lib/api/salary-advance-requests";

export function SalaryAdvanceRequestDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [amount, setAmount] = useState(0);
  const [repaymentMonths, setRepaymentMonths] = useState<number | "">(1);
  const [reason, setReason] = useState("");

  const computedMonthlyDeduction = useMemo(() => {
    if (amount <= 0) return "";
    const months = repaymentMonths === "" ? 1 : Number(repaymentMonths);
    if (!months || months <= 0) return "";
    return (amount / months).toFixed(2);
  }, [amount, repaymentMonths]);

  async function submitForm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (amount <= 0 || reason.trim().length < 5) {
      toast.error("Please provide a valid amount and reason.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await createSalaryAdvanceRequest({
        amount,
        reason,
        repayment_months:
          repaymentMonths === "" ? undefined : Number(repaymentMonths),
      });

      if (!res.success) {
        toast.error(res.error || "Failed to submit salary advance request.");
        return;
      }

      toast.success("Salary advance request submitted.");
      setOpen(false);
      setAmount(0);
      setRepaymentMonths(1);
      setReason("");
      router.refresh();
    } catch (error: any) {
      toast.error(error?.message || "Failed to submit salary advance request.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Request Salary Advance
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-135">
        <DialogHeader>
          <DialogTitle>Salary Advance Request</DialogTitle>
          <DialogDescription>
            Submit a salary advance request for HR and Accounts review.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={submitForm}>
          <div className="space-y-2">
            <Label htmlFor="advance-amount">Amount</Label>
            <Input
              id="advance-amount"
              type="number"
              min={1}
              value={amount || ""}
              onChange={(e) => setAmount(Number(e.target.value))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="advance-repayment-months">
              Repayment Duration (Months)
            </Label>
            <Input
              id="advance-repayment-months"
              type="number"
              min={1}
              max={60}
              value={repaymentMonths}
              onChange={(e) =>
                setRepaymentMonths(
                  e.target.value === "" ? "" : Number(e.target.value),
                )
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="advance-monthly-deduction">
              Monthly Deduction (Auto)
            </Label>
            <Input
              id="advance-monthly-deduction"
              type="text"
              value={computedMonthlyDeduction}
              readOnly
            />
            <p className="text-xs text-muted-foreground">
              This is auto-calculated as Amount divided by Repayment Duration.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="advance-reason">Reason</Label>
            <Textarea
              id="advance-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why you need this salary advance"
              required
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
