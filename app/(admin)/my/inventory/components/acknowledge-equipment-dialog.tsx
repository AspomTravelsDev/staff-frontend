"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { acknowledgeEquipment, type InventoryAssignment } from "@/lib/api/inventory";
import { assetType } from "@/lib/equipment-form";
import { AssetUndertakingFields } from "@/components/inventory/asset-undertaking-fields";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const checklist = z.object({ screen: z.string().trim().min(1), charger: z.string().trim().min(1), buttons: z.string().trim().min(1), battery: z.string().trim().min(1), ports: z.string().trim().min(1), cameraMic: z.string().trim().min(1), overall: z.string().trim().min(1) });
const schema = z.object({ agreedToTerms: z.boolean().refine(Boolean, "Read and accept the undertaking to continue."), items: z.array(z.object({ id: z.string(), reviewed: z.boolean().refine(Boolean, "Confirm this item's condition."), conditionRating: z.enum(["Excellent", "Good", "Fair", "Poor", "Broken"]), conditionDetails: z.string().trim().min(5, "Describe the condition (at least 5 characters)."), staffChecklist: checklist })) });
type Values = z.infer<typeof schema>;
const labels = { screen: "Screen & display", charger: "Charger & cables", buttons: "Buttons & keyboard", battery: "Battery & charging", ports: "Ports & connectivity", cameraMic: "Camera, mic & speaker", overall: "Body & casing" };

export function AcknowledgeEquipmentDialog({ assignments, onClose }: { assignments: InventoryAssignment[]; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { agreedToTerms: false, items: assignments.map((assignment) => ({ id: assignment.id, reviewed: false, conditionRating: assignment.staffConditionRating || assignment.inventoryItem?.conditionRating || "Good", conditionDetails: assignment.staffConditionDetails || assignment.inventoryItem?.conditionDetails || "", staffChecklist: { screen: "", charger: "", buttons: "", battery: "", ports: "", cameraMic: "", overall: "", ...(assignment.staffChecklist ?? assignment.adminChecklist) } })) } });
  async function submit(values: Values) {
    setBusy(true);
    try { await acknowledgeEquipment({ batchId: assignments[0].issueBatchId!, agreedToTerms: values.agreedToTerms, items: values.items }); toast.success("Equipment accepted. Sent to Admin / IT for review."); onClose(); router.refresh(); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Could not accept equipment. Refresh and try again."); }
    finally { setBusy(false); }
  }
  return <Dialog open onOpenChange={(open) => !open && !busy && onClose()}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>Accept equipment</DialogTitle><DialogDescription>Review each item and confirm its condition. All listed items are accepted together. To reject an item, close this form and use its individual review.</DialogDescription></DialogHeader><Form {...form}><form className="space-y-5" onSubmit={form.handleSubmit(submit, () => toast.error("Review each item, complete its condition and checklist, and accept the undertaking."))}>
    {assignments.map((assignment, index) => <section key={assignment.id} className="space-y-3 border-b pb-4"><div><h3 className="font-medium">{assetType(assignment.assetSnapshot ?? assignment.inventoryItem)} · {(assignment.assetSnapshot ?? assignment.inventoryItem)?.name}</h3><p className="text-xs text-muted-foreground">{assignment.inventoryItem?.serialNumber || assignment.inventoryItem?.assetTag}</p></div>{assignment.complianceDecision === "rejected" && assignment.complianceNotes && <p className="text-sm">Compliance feedback: {assignment.complianceNotes}</p>}{assignment.officerDecision === "rejected" && assignment.officerNotes && <p className="text-sm">IT feedback: {assignment.officerNotes}</p>}
      <label className="block space-y-1 text-sm">Condition<select className="w-full rounded-md border bg-background p-2" {...form.register(`items.${index}.conditionRating`)}>{["Excellent", "Good", "Fair", "Poor", "Broken"].map((value) => <option key={value}>{value}</option>)}</select></label>
      <label className="block space-y-1 text-sm">Condition details<Textarea {...form.register(`items.${index}.conditionDetails`)} /></label>{form.formState.errors.items?.[index]?.conditionDetails && <p className="text-sm text-destructive">{form.formState.errors.items[index]?.conditionDetails?.message}</p>}
      <details><summary className="cursor-pointer text-sm font-medium">Review or update checklist</summary><div className="mt-3 grid gap-3 sm:grid-cols-2">{(Object.keys(labels) as (keyof typeof labels)[]).map((key) => <label key={key} className="space-y-1 text-xs">{labels[key]}<Input {...form.register(`items.${index}.staffChecklist.${key}`)} /></label>)}</div></details>
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" {...form.register(`items.${index}.reviewed`)} />I inspected this item and confirm its condition and checklist.</label>
    </section>)}
    <AssetUndertakingFields /><div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button><Button disabled={busy}>{busy ? "Saving…" : `Accept ${assignments.length} items`}</Button></div>
  </form></Form></DialogContent></Dialog>;
}
