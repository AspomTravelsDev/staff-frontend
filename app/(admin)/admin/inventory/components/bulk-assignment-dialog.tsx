"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { issueEquipment, type GadgetChecklist, type InventoryItem } from "@/lib/api/inventory";
import type { Employee } from "@/lib/api/employees";

const fields: { key: keyof GadgetChecklist; label: string }[] = [
  { key: "screen", label: "Screen & display" }, { key: "charger", label: "Charger & cables" },
  { key: "buttons", label: "Buttons & keyboard" }, { key: "battery", label: "Battery & charging" },
  { key: "ports", label: "Ports & connectivity" }, { key: "cameraMic", label: "Camera, mic & speaker" },
  { key: "overall", label: "Body & casing" },
];
const emptyChecklist: GadgetChecklist = { screen: "", charger: "", buttons: "", battery: "", ports: "", cameraMic: "", overall: "" };

export function BulkAssignmentDialog({ open, onOpenChange, items, employees }: {
  open: boolean; onOpenChange: (open: boolean) => void; items: InventoryItem[]; employees: Employee[];
}) {
  const router = useRouter();
  const [assigneeId, setAssigneeId] = useState("");
  const [notes, setNotes] = useState("");
  const [checklists, setChecklists] = useState<Record<string, GadgetChecklist>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAssigneeId("");
    setNotes("");
    setChecklists(Object.fromEntries(items.map((item) => [item.id, { ...emptyChecklist, ...item.defaultChecklist }])));
  }, [open, items]);

  const updateChecklist = (itemId: string, key: keyof GadgetChecklist, value: string) => {
    setChecklists((current) => ({ ...current, [itemId]: { ...current[itemId], [key]: value } }));
  };

  const submit = async () => {
    if (!assigneeId || items.length === 0 || items.length > 50) return;
    const missing = items.find((item) => fields.some(({ key }) => !checklists[item.id]?.[key]?.trim()));
    if (missing) {
      toast.error(`Complete the assignment checklist for ${missing.name}. Enter N/A when a field does not apply.`);
      return;
    }
    setBusy(true);
    try {
      await issueEquipment({ assigneeId, notes, items: items.map((item) => ({ id: item.id, adminChecklist: checklists[item.id] })) });
      toast.success(`${items.length} devices sent to staff for acknowledgement as one batch.`);
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not assign selected devices.");
    } finally {
      setBusy(false);
    }
  };

  return <Dialog open={open} onOpenChange={(value) => !busy && onOpenChange(value)}>
    <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>Assign {items.length} selected {items.length === 1 ? "device" : "devices"}</DialogTitle>
        <DialogDescription>Choose one staff member. The selected devices will be grouped into one acknowledgement and asset form.</DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-2"><Label>Staff member</Label><Select value={assigneeId} onValueChange={setAssigneeId}><SelectTrigger><SelectValue placeholder="Choose staff member" /></SelectTrigger><SelectContent>{employees.map((employee) => <SelectItem key={employee.id} value={employee.id}>{employee.firstName} {employee.lastName} · {employee.department}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-3">{items.map((item) => <details key={item.id} className="rounded-md border p-3" open={items.length <= 3}>
          <summary className="cursor-pointer text-sm font-medium">{item.name} · {item.serialNumber || item.assetTag || "No asset reference"}</summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">{fields.map(({ key, label }) => <label key={key} className="space-y-1 text-xs"><span>{label}</span><Input maxLength={500} value={checklists[item.id]?.[key] || ""} onChange={(event) => updateChecklist(item.id, key, event.target.value)} placeholder="Enter observation or N/A" /></label>)}</div>
        </details>)}</div>
        <div className="space-y-2"><Label>Instructions (optional)</Label><Textarea maxLength={2000} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Shared instructions for this equipment issue" /></div>
        <div className="flex justify-end gap-2"><Button variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>Cancel</Button><Button disabled={busy || !assigneeId || items.length === 0 || items.length > 50} onClick={submit}>{busy ? "Assigning…" : `Assign ${items.length} devices`}</Button></div>
      </div>
    </DialogContent>
  </Dialog>;
}
