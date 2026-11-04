"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatLagosDateForInput } from "@/lib/utils/attendance";
import { submitLatePermissionRequest } from "@/lib/api/clock-in";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Clock, Send, Calendar, AlertCircle } from "lucide-react";

interface LatePermissionRequestModalProps {
  trigger?: React.ReactNode;
  onRequestSubmitted?: () => void;
}

export function LatePermissionRequestModal({
  trigger,
  onRequestSubmitted,
}: LatePermissionRequestModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const todayStr = formatLagosDateForInput(new Date());
  const [requestDate, setRequestDate] = useState(todayStr);
  const [expectedArrivalTime, setExpectedArrivalTime] = useState("10:00 AM");
  const [requestType, setRequestType] = useState<"late_arrival" | "half_day">("late_arrival");
  const [expectedClockOutTime, setExpectedClockOutTime] = useState("3:00 PM");
  const [reason, setReason] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!requestDate) {
      toast.error("Please select a target date");
      return;
    }

    if (requestType === "late_arrival" && !expectedArrivalTime.trim()) {
      toast.error("Please enter your expected arrival time");
      return;
    }
    if (requestType === "half_day" && !expectedClockOutTime.trim()) {
      toast.error("Please enter your expected clock-out time");
      return;
    }

    if (!reason.trim()) {
      toast.error("Please provide a reason for your request");
      return;
    }

    setLoading(true);

    try {
      const res = await submitLatePermissionRequest({
        request_date: requestDate,
        request_type: requestType,
        ...(requestType === "late_arrival" ? { expected_arrival_time: expectedArrivalTime } : {}),
        ...(requestType === "half_day" ? { expected_clock_out_time: expectedClockOutTime } : {}),
        reason: reason.trim(),
      });

      if (res.success) {
        toast.success("Attendance request submitted to HR & Compliance!");
        setReason("");
        setOpen(false);
        router.refresh();
        if (onRequestSubmitted) onRequestSubmitted();
      } else {
        toast.error(res.error?.error || "Failed to submit request");
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "An error occurred while submitting request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
        <Button variant="outline" size="sm" className="h-11 w-full justify-center gap-1.5 whitespace-normal px-2 text-center text-xs leading-tight sm:h-9 sm:w-auto sm:whitespace-nowrap sm:px-3">
            <Clock className="size-4 shrink-0 text-indigo-500" />
            <span>Request attendance permission</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Clock className="size-5 text-indigo-600 dark:text-indigo-400" />
              Request attendance permission
            </DialogTitle>
            <DialogDescription className="text-xs">
              Ask HR & Compliance to approve a late arrival or half day (leaving before 4 PM).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="request_date" className="text-xs font-semibold flex items-center gap-1">
                <Calendar className="size-3.5 text-muted-foreground" />
                Target Date
              </Label>
              <Input
                id="request_date"
                type="date"
                value={requestDate}
                onChange={(e) => setRequestDate(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="request_type" className="text-xs font-semibold">Request type</Label>
              <select id="request_type" value={requestType} onChange={(e) => setRequestType(e.target.value as typeof requestType)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                <option value="late_arrival">Late arrival</option>
                <option value="half_day">Half day</option>
              </select>
            </div>

            {requestType === "late_arrival" && <div className="space-y-1.5">
              <Label htmlFor="expected_arrival_time" className="text-xs font-semibold">
                Expected Arrival Time
              </Label>
              <Input
                id="expected_arrival_time"
                placeholder="e.g. 10:15 AM"
                value={expectedArrivalTime}
                onChange={(e) => setExpectedArrivalTime(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>}

            {requestType === "half_day" && <div className="space-y-1.5">
              <Label htmlFor="expected_clock_out_time" className="text-xs font-semibold">Expected Clock-out Time</Label>
              <Input id="expected_clock_out_time" placeholder="e.g. 3:00 PM" value={expectedClockOutTime} onChange={(e) => setExpectedClockOutTime(e.target.value)} className="h-9 text-xs" required />
            </div>}

            <div className="space-y-1.5">
              <Label htmlFor="reason" className="text-xs font-semibold">
                Reason for Request
              </Label>
              <Textarea
                id="reason"
                rows={3}
              placeholder="Briefly explain why you need this attendance permission."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="text-xs"
                required
              />
            </div>

            <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-[11px] flex items-start gap-2">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <p>
                HR and Compliance will review your request. Clock-outs before 4:00 PM are recorded as half days for payroll.
                </p>
                <p>
                  <Link
                    href="/my/attendance"
                    onClick={() => setOpen(false)}
                    className="inline-flex items-center gap-1 font-semibold underline hover:text-indigo-900 dark:hover:text-indigo-200"
                  >
                    View your submitted requests in My Attendance &rarr;
                  </Link>
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5"
            >
              {loading ? "Submitting..." : (
                <>
                  <Send className="size-3.5" />
                  Submit Request
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
