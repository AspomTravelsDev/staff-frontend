"use client";

import { useState, useMemo } from "react";
import { createLeaveRequest } from "@/lib/api/leave";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { format, addBusinessDays } from "date-fns";
import { getRoleLabel } from "@/types/user-types";

interface RequestLeaveModalProps {
  userName: string;
  role: string | undefined;
}

// removed local map

const leaveTypes = [
  { value: "Casual", label: "Casual Leave" },
  { value: "Emergency", label: "Emergency Leave" },
  { value: "Sick", label: "Sick Leave" },
];

export function RequestLeaveModal({ userName, role }: RequestLeaveModalProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState(leaveTypes[0].value);
  const [days, setDays] = useState(1);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [reason, setReason] = useState("");

  const endDate = useMemo(() => {
    if (!startDate || !days) return "";
    const end = addBusinessDays(startDate, days);
    return format(end, "yyyy-MM-dd");
  }, [startDate, days]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!startDate) {
      toast.error("Please pick a proposed start date.");
      return;
    }
    setLoading(true);
    try {
      await createLeaveRequest({
        type,
        start_date: format(startDate, "yyyy-MM-dd"),
        days,
        reason,
      });
      toast.success("Leave request submitted successfully.");
      setOpen(false);
      // Reset form
      setDays(1);
      setStartDate(undefined);
      setReason("");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to submit leave request.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">
          Request Leave
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle>Request Leave</DialogTitle>
          <DialogDescription>
            Submit a new leave application. Your request will be reviewed by HR.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Name</Label>
              <Input value={userName} readOnly />
            </div>
            <div>
              <Label>Role</Label>
              <Input value={getRoleLabel(role) || "-"} readOnly />
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <Label>Type of Leave</Label>
              <Select value={type} onValueChange={setType} name="type" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {leaveTypes.map((lt) => (
                    <SelectItem key={lt.value} value={lt.value}>
                      {lt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Number of Days</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                name="days"
                required
              />
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <Label>Proposed Start Date</Label>
              <DatePicker
                value={startDate}
                onChange={setStartDate}
                placeholder="Pick a start date"
                minDate={today}
              />
            </div>
            <div>
              <Label>Resumption Date</Label>
              <Input value={endDate} readOnly required />
            </div>
          </div>
          <div>
            <Label>Reason</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              name="reason"
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
