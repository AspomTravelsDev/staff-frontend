"use client";

import { useState } from "react";
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
import { createLoanRequest } from "@/lib/api/loan-requests";

export function LoanRequestDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState("");
  const [repaymentMonths, setRepaymentMonths] = useState<number | "">("");
  const [suggestedMonthlyDeduction, setSuggestedMonthlyDeduction] = useState<
    number | ""
  >("");

  async function submitForm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (amount <= 0 || reason.trim().length < 5) {
      toast.error("Please provide a valid amount and reason.");
      return;
    }

    try {
      setIsSubmitting(true);
      await createLoanRequest({
        amount,
        reason,
        repayment_months:
          repaymentMonths === "" ? undefined : Number(repaymentMonths),
        suggested_monthly_deduction:
          suggestedMonthlyDeduction === ""
            ? undefined
            : Number(suggestedMonthlyDeduction),
      });
      toast.success("Loan request submitted.");
      setOpen(false);
      setAmount(0);
      setReason("");
      setRepaymentMonths("");
      setSuggestedMonthlyDeduction("");
      router.refresh();
    } catch {
      toast.error("Failed to submit loan request.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Request Loan
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle>Loan Request</DialogTitle>
          <DialogDescription>
            Submit a loan request for HR and Accounts review.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={submitForm}>
          <div className="space-y-2">
            <Label htmlFor="loan-amount">Amount</Label>
            <Input
              id="loan-amount"
              type="number"
              min={1}
              value={amount || ""}
              onChange={(e) => setAmount(Number(e.target.value))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="loan-repayment-months">
              Repayment Months (Optional)
            </Label>
            <Input
              id="loan-repayment-months"
              type="number"
              min={1}
              max={60}
              value={repaymentMonths}
              onChange={(e) =>
                setRepaymentMonths(
                  e.target.value === "" ? "" : Number(e.target.value),
                )
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="loan-monthly-deduction">
              Suggested Monthly Deduction (Optional)
            </Label>
            <Input
              id="loan-monthly-deduction"
              type="number"
              min={0}
              value={suggestedMonthlyDeduction}
              onChange={(e) =>
                setSuggestedMonthlyDeduction(
                  e.target.value === "" ? "" : Number(e.target.value),
                )
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="loan-reason">Reason</Label>
            <Textarea
              id="loan-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why you need this loan"
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
