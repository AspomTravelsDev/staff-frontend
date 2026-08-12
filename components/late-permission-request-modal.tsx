"use client";

import React, { useState } from "react";
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
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const todayStr = formatLagosDateForInput(new Date());
  const [requestDate, setRequestDate] = useState(todayStr);
  const [expectedArrivalTime, setExpectedArrivalTime] = useState("10:00 AM");
  const [reason, setReason] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!requestDate) {
      toast.error("Please select a target date");
      return;
    }

    if (!expectedArrivalTime.trim()) {
      toast.error("Please enter your expected arrival time");
      return;
    }

    if (!reason.trim()) {
      toast.error("Please provide a reason for being late");
      return;
    }

    setLoading(true);

    try {
      const res = await submitLatePermissionRequest({
        request_date: requestDate,
        expected_arrival_time: expectedArrivalTime,
        reason: reason.trim(),
      });

      if (res.success) {
        toast.success("Late permission request submitted to HR & Compliance!");
        setReason("");
        setOpen(false);
        if (onRequestSubmitted) onRequestSubmitted();
      } else {
        toast.error(res.error?.error || "Failed to submit request");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred while submitting request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <Clock className="size-3.5 text-indigo-500" />
            Request Permission to be Late
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Clock className="size-5 text-indigo-600 dark:text-indigo-400" />
              Request Permission to be Late
            </DialogTitle>
            <DialogDescription className="text-xs">
              Send an advance notice to HR & Compliance for expected late arrival. Approved requests prevent compliance lateness penalties.
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
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reason" className="text-xs font-semibold">
                Reason for Late Arrival
              </Label>
              <Textarea
                id="reason"
                rows={3}
                placeholder="State your reason (e.g. Unexpected vehicle breakdown, medical appointment, etc.)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="text-xs"
                required
              />
            </div>

            <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-[11px] flex items-start gap-2">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>
                HR and Compliance will review your request. When approved, your clock-in record for that day will be marked as <strong>Late (Permitted)</strong>.
              </span>
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
