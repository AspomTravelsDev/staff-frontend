"use client";

import { useState, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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

interface RequestLeaveModalProps {
  userName: string;
  role: string | undefined;
}

const roleToDepartment: Record<string, string> = {
  super: "Super Admin",
  admin: "Admin",
  it: "IT",
  account: "Accounts",
  visa: "Visa",
  hr: "HR",
  media: "Social Media",
  compliance: "Compliance",
};

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
    const end = addBusinessDays(startDate, days - 1);
    return format(end, "yyyy-MM-dd");
  }, [startDate, days]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: Call server action to request leave
    setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="default" className="mb-4">
          Request Leave
        </Button>
      </SheetTrigger>
      <SheetContent className="p-4">
        <SheetHeader>
          <SheetTitle>Request Leave</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={userName} readOnly />
            </div>
            <div>
              <Label>Department</Label>
              <Input
                value={role ? roleToDepartment[role] || role : "-"}
                readOnly
              />
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
                // name="startDate"
                // required
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
          <div className="flex justify-end">
            <Button type="submit">Submit</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
