"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getEmployeeEquipment, getInventory, issueEquipment, returnSelectedEquipment, initiateFullClearance, type InventoryItem, type GadgetChecklist } from "@/lib/api/inventory";
import type { Employee } from "@/lib/api/employees";
import { assetType, equipmentIssueRecords, equipmentFormRows, suggestedEquipmentSelection } from "@/lib/equipment-form";
import { downloadAssetFormPdf } from "@/components/inventory/asset-form-pdf-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const labels: Record<keyof GadgetChecklist, string> = { screen: "Screen & display", charger: "Charger & cables", buttons: "Buttons & keyboard", battery: "Battery & charging", ports: "Ports & connectivity", cameraMic: "Camera, mic & speaker", overall: "Body & casing" };
const empty: GadgetChecklist = { screen: "", charger: "", buttons: "", battery: "", ports: "", cameraMic: "", overall: "" };

export function StaffEquipment({ employees, canIssue }: { employees: Employee[]; canIssue: boolean }) {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [equipment, setEquipment] = useState<InventoryItem[]>([]);
  const [available, setAvailable] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [dialog, setDialog] = useState<"issue" | "return" | "full" | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [checklists, setChecklists] = useState<Record<string, GadgetChecklist>>({});
  const [notes, setNotes] = useState("");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const employee = employees.find((item) => item.id === employeeId);
  const name = employee ? `${employee.firstName} ${employee.lastName}` : "";
  useEffect(() => {
    if (!employeeId) return;
    let cancelled = false;
    async function load() {
      setLoading(true); setError("");
      try {
        const current = await getEmployeeEquipment(employeeId);
        const stock: InventoryItem[] = [];
        if (canIssue) {
          let page = 1;
          let pages = 1;
          do {
            const result = await getInventory({ status: "Storage", limit: 100, page });
            stock.push(...result.items.filter((item) => !item.openAssignment));
            pages = result.pagination.total_pages;
            page++;
          } while (page <= pages && !cancelled);
        }
        if (!cancelled) { setEquipment(current); setAvailable(stock); }
      } catch (error) { if (!cancelled) setError(error instanceof Error ? error.message : "Could not load equipment. Try again."); }
      finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [employeeId, revision, canIssue]);

  const records = equipmentIssueRecords(equipment, { id: employeeId, name, phone: employee?.phone, mobile_phone: employee?.mobile_phone, department: employee?.department, role: employee?.role });
  function openDialog(value: "issue" | "return" | "full") {
    setSelected([]); setNotes(""); setQuery(""); setChecklists({}); setDialog(value);
  }
  function toggle(item: InventoryItem, checked: boolean) {
    const candidates = dialog === "issue" ? available : equipment.filter((item) => !item.openAssignment);
    const ids = checked ? suggestedEquipmentSelection(candidates, item.id) : [item.id];
    setSelected((current) => checked ? Array.from(new Set([...current, ...ids])) : current.filter((id) => !ids.includes(id)));
    setChecklists((current) => Object.fromEntries(candidates.map((candidate) => [candidate.id, current[candidate.id] || { ...empty, ...candidate.defaultChecklist }])));
  }
  async function submit() {
    if (!employeeId || (!selected.length && dialog !== "full")) return;
    setBusy(true);
    try {
      if (dialog === "issue") await issueEquipment({ assigneeId: employeeId, notes, items: selected.map((id) => ({ id, adminChecklist: checklists[id] || empty })) });
      else if (dialog === "return") await returnSelectedEquipment(employeeId, selected, notes);
      else await initiateFullClearance(employeeId, notes);
      toast.success(dialog === "issue" ? "Equipment sent for staff acknowledgement." : "Return requested. Staff will review the equipment before IT inspection.");
      setDialog(null); setRevision((value) => value + 1); router.refresh();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not save. Refresh and try again."); }
    finally { setBusy(false); }
  }
  const filteredEmployees = employees
    .filter((employee) => `${employee.firstName} ${employee.lastName} ${employee.staff_id} ${employee.department}`.toLowerCase().includes(employeeSearch.trim().toLowerCase()))
    .sort((a, b) => Number(b.status === "Active") - Number(a.status === "Active")
      || `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));
  const candidates = dialog === "issue" ? available : equipment.filter((item) => !item.openAssignment);
  return <div className="space-y-5">
    <div className="flex flex-wrap justify-between gap-3"><div><h2 className="text-lg font-semibold">Staff equipment</h2><p className="text-sm text-muted-foreground">View an employee’s equipment, issue a set, or request selected returns.</p></div><Button variant="outline" onClick={() => downloadAssetFormPdf(undefined, [], "Blank_Asset_Form.pdf", { blank: true })}>Download blank form</Button></div>
    {!employeeId ? <div className="space-y-3">
      <Input aria-label="Search employees" placeholder="Search by employee name, staff ID, or department" value={employeeSearch} onChange={(event) => setEmployeeSearch(event.target.value)} />
      <p className="text-sm text-muted-foreground">Choose an employee to view or manage their equipment.</p>
      <div className="max-h-[32rem] divide-y overflow-y-auto rounded-lg border">
        {filteredEmployees.map((employee) => <div key={employee.id} className="flex items-center justify-between gap-3 p-4"><div><p className="font-medium">{employee.firstName} {employee.lastName}</p><p className="text-xs text-muted-foreground">{employee.staff_id} · {employee.department}{employee.status ? ` · ${employee.status}` : ""}</p></div><Button variant="outline" onClick={() => { setEquipment([]); setLoading(true); setEmployeeId(employee.id); }}>Open equipment</Button></div>)}
        {!filteredEmployees.length && <p className="p-6 text-sm text-muted-foreground">No employees match your search.</p>}
      </div>
    </div> : <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold">{name}</h3><p className="text-sm text-muted-foreground">{employee?.staff_id} · {employee?.department}</p></div><Button variant="outline" onClick={() => { setEmployeeId(""); setEmployeeSearch(""); }}>Change employee</Button></div>}
    {employeeId && loading && <p role="status" className="text-sm text-muted-foreground">Loading equipment…</p>}
    {employeeId && error && <div role="alert"><p>{error}</p><Button variant="outline" onClick={() => setRevision((value) => value + 1)}>Try again</Button></div>}
    {employee && !loading && !error && <>
      <div className="flex flex-wrap items-center gap-2"><span className="mr-auto text-sm text-muted-foreground">{equipment.length} items held by {name}</span>{canIssue && <><Button onClick={() => openDialog("issue")}>Issue equipment</Button><Button variant="outline" disabled={!equipment.length} onClick={() => openDialog("return")}>Return selected equipment</Button><Button variant="outline" disabled={!equipment.length} onClick={() => openDialog("full")}>Full equipment clearance</Button></>}<Button variant="outline" disabled={!equipment.length} onClick={() => downloadAssetFormPdf(undefined, records, `Current_Equipment_${name.replaceAll(" ", "_")}.pdf`, { current: true })}>Current equipment form</Button></div>
      <div className="rounded-lg border"><Table><TableHeader><TableRow><TableHead>S/N</TableHead><TableHead>Asset type</TableHead><TableHead>Model</TableHead><TableHead>Serial number / asset ref</TableHead><TableHead>Current state / comment</TableHead></TableRow></TableHeader><TableBody>{equipmentFormRows(records, true).map((row, index) => { const item = row.assignment?.inventoryItem; return <TableRow key={row.assignment?.id || row.type}><TableCell>{index + 1}</TableCell><TableCell>{row.type}</TableCell><TableCell>{item?.name || "—"}</TableCell><TableCell>{item?.serialNumber || item?.assetTag || "—"}</TableCell><TableCell>{item ? `${item.conditionRating}${item.conditionDetails ? ` · ${item.conditionDetails}` : ""}${item.openAssignment ? " · Review in progress" : ""}` : "Not issued"}</TableCell></TableRow>; })}</TableBody></Table></div>
      <p className="text-xs text-muted-foreground">This is the current custody list. Historical issue acknowledgements remain in each asset’s history. Repairs and upgrades return only the selected items; other equipment stays assigned.</p>
    </>}
    <Dialog open={!!dialog} onOpenChange={(open) => !open && !busy && setDialog(null)}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>{dialog === "issue" ? "Issue equipment" : dialog === "full" ? "Full equipment clearance" : "Return selected equipment"} · {name}</DialogTitle><DialogDescription>{dialog === "issue" ? "Select equipment and review its checklist. Linked accessories are suggested together; you can remove any item." : dialog === "full" ? "All equipment currently held by this employee will require handover and clearance. Existing open workflows must be resolved first." : "Select the equipment being returned. Linked accessories are suggested, but can be removed. Other equipment remains assigned. For repair, custody changes only after clearance; then record the repair provider in inventory."}</DialogDescription></DialogHeader>
      {dialog !== "full" ? <><Input aria-label="Search equipment" placeholder="Search model, serial, or asset type" value={query} onChange={(event) => setQuery(event.target.value)} /><div className="space-y-3">{candidates.filter((item) => `${item.name} ${item.serialNumber} ${assetType(item)}`.toLowerCase().includes(query.toLowerCase())).map((item) => <div key={item.id} className="space-y-3 border-b pb-3"><label className="flex items-start gap-3"><Checkbox checked={selected.includes(item.id)} onCheckedChange={(checked) => toggle(item, checked === true)} /><span><span className="block text-sm font-medium">{assetType(item)} · {item.name}</span><span className="text-xs text-muted-foreground">{item.serialNumber || item.assetTag} · {item.conditionRating}</span></span></label>{dialog === "issue" && selected.includes(item.id) && <details><summary className="cursor-pointer text-sm">Review assignment checklist</summary><div className="mt-3 grid gap-3 sm:grid-cols-2">{(Object.keys(labels) as (keyof GadgetChecklist)[]).map((key) => <label key={key} className="space-y-1 text-xs">{labels[key]}<Input value={checklists[item.id]?.[key] || ""} onChange={(event) => setChecklists((current) => ({ ...current, [item.id]: { ...current[item.id], [key]: event.target.value } }))} /></label>)}</div></details>}</div>)}{!candidates.length && <p className="text-sm text-muted-foreground">No eligible equipment. Items with an open workflow cannot be selected.</p>}</div></> : <ul className="list-inside list-disc text-sm">{equipment.map((item) => <li key={item.id}>{assetType(item)} · {item.name}</li>)}</ul>}
      <label className="space-y-2 text-sm">{dialog === "issue" ? "Instructions (optional)" : "Reason / context (optional)"}<Textarea value={notes} onChange={(event) => setNotes(event.target.value)} /></label><div className="flex justify-end gap-2"><Button variant="outline" disabled={busy} onClick={() => setDialog(null)}>Cancel</Button><Button disabled={busy || (dialog !== "full" && !selected.length)} onClick={submit}>{busy ? "Saving…" : dialog === "issue" ? `Send ${selected.length} items for acknowledgement` : "Request handover"}</Button></div>
    </DialogContent></Dialog>
  </div>;
}
