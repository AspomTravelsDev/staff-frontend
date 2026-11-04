"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { submitWorkFromHomeRequest } from "@/lib/api/work-from-home";

export function WorkFromHomeRequestDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const result = await submitWorkFromHomeRequest({ start_date: startDate, end_date: endDate, reason: reason.trim() });
    if (result.success) {
      toast.success("Request sent to HR for review.");
      setOpen(false);
      setReason("");
      router.refresh();
    } else toast.error(result.error?.error || "Could not submit your request.");
    setBusy(false);
  }

  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild><Button variant="outline" size="sm" className="h-11 w-full justify-center gap-2 whitespace-normal px-2 text-center leading-tight sm:h-9 sm:w-auto sm:whitespace-nowrap sm:px-3"><CalendarDays className="size-4" /><span>Request work from home</span></Button></DialogTrigger>
    <DialogContent className="sm:max-w-md">
      <form onSubmit={submit}>
        <DialogHeader><DialogTitle>Request work from home</DialogTitle><DialogDescription>Choose the dates and explain your request. HR approval is required before the days count as attended.</DialogDescription></DialogHeader>
        <div className="space-y-4 py-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label htmlFor="wfh-start">Start date</Label><Input id="wfh-start" type="date" value={startDate} onChange={e => { setStartDate(e.target.value); if (!endDate) setEndDate(e.target.value); }} required /></div>
            <div className="space-y-2"><Label htmlFor="wfh-end">End date</Label><Input id="wfh-end" type="date" min={startDate || undefined} value={endDate} onChange={e => setEndDate(e.target.value)} required /></div>
          </div>
          <div className="space-y-2"><Label htmlFor="wfh-reason">Reason</Label><Textarea id="wfh-reason" value={reason} onChange={e => setReason(e.target.value)} maxLength={1000} rows={4} placeholder="Add context for HR" required /></div>
        </div>
        <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={busy} className="gap-2">{busy ? "Sending…" : <><Send className="size-4" />Submit request</>}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
