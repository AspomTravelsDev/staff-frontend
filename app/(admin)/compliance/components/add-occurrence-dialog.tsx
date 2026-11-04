"use client";

import { useMemo, useState } from "react";
import { Plus, X, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox";
import { addBatchComplianceOccurrences } from "@/lib/api/compliance";
import { type Severity, OFFICIAL_POLICY_CATEGORIES } from "@/lib/types/compliance";
import { type Employee } from "@/lib/api/employees";
import { toast } from "sonner";

interface AddOccurrenceDialogProps {
  employees: Employee[];
  departments: string[];
}

export function AddOccurrenceDialog({
  employees,
  departments,
}: AddOccurrenceDialogProps) {
  const [open, setOpen] = useState(false);
  const [dialogContainer, setDialogContainer] = useState<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [staffSearch, setStaffSearch] = useState("");
  const staffOptions = useMemo(() => employees.map(employee => ({
    value: employee.id,
    label: `${employee.firstName} ${employee.lastName} · ${employee.department} · ${employee.staff_id}`,
  })), [employees]);
  const [formData, setFormData] = useState({
    type: "",
    points: 1.0,
    date: "",
    severity: "",
    description: "",
    evidence: "",
  });

  const handleTypeChange = (typeVal: string) => {
    const matched = OFFICIAL_POLICY_CATEGORIES.find((c) => c.type === typeVal);
    setFormData((prev) => ({
      ...prev,
      type: typeVal,
      points: matched ? matched.points : 1.0,
    }));
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUserIds(selectedUserIds.filter((id) => id !== userId));
  };

  const handleAddDepartment = (dept: string) => {
    const deptUserIds = employees
      .filter((e) => e.department === dept)
      .map((e) => e.id);
    
    const newIds = Array.from(new Set([...selectedUserIds, ...deptUserIds]));
    setSelectedUserIds(newIds);
    toast.info(`Added ${deptUserIds.length} staff members from ${dept}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUserIds.length === 0) {
      toast.error("Please select at least one employee");
      return;
    }
    if (!formData.type) {
      toast.error("Please select a policy category from the list");
      return;
    }

    setLoading(true);

    try {
      const attachments = new FormData();
      evidenceFiles.forEach(file => attachments.append("evidence_files[]", file));
      const res = await addBatchComplianceOccurrences({
        user_ids: selectedUserIds,
        type: formData.type,
        points: formData.points,
        occurrence_date: `${formData.date} 12:00:00`,
        severity: formData.severity as Severity,
        description: formData.description,
        evidence: formData.evidence,
      }, evidenceFiles.length ? attachments : undefined);

      if (!res.success) {
        toast.error(res.error || "Unable to initiate compliance query");
        return;
      }

      toast.success(`Compliance queries sent to ${selectedUserIds.length} staff members`);
      setOpen(false);
      setFormData({
        type: "",
        points: 1.0,
        date: "",
        severity: "",
        description: "",
    evidence: "",
      });
      setEvidenceFiles([]);
      setSelectedUserIds([]);
      setStaffSearch("");
      // Refresh the page or trigger a re-fetch
      window.location.reload();
    } catch (error: unknown) {
      console.error("Unable to initiate compliance query", error);
      toast.error(error instanceof Error ? error.message : "Unable to initiate compliance query");
    } finally {
      setLoading(false);
    }
  };

  const selectedEmployees = employees.filter((e) => selectedUserIds.includes(e.id));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Initiate query
        </Button>
      </DialogTrigger>
      <DialogContent ref={setDialogContainer} className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
          <DialogHeader>
            <DialogTitle>Initiate compliance query</DialogTitle>
            <DialogDescription>
              Raise a compliance query for review. You can select multiple staff members or an entire department. Raising a query does not add occurrences or apply disciplinary action. An outcome is recorded after review.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4 overflow-y-auto pr-2">
            {/* Staff Selection */}
            <div className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Label htmlFor="compliance-staff-search">Staff involved ({selectedUserIds.length})</Label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  {/* Select by Department */}
                  <Select onValueChange={handleAddDepartment}>
                    <SelectTrigger className="w-full sm:w-[160px] h-8 text-xs">
                      <Users className="mr-2 h-3 w-3" />
                      <SelectValue placeholder="Add by Dept" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Combobox
                    multiple
                    items={staffOptions}
                    value={staffOptions.filter(option => selectedUserIds.includes(option.value))}
                    inputValue={staffSearch}
                    onInputValueChange={setStaffSearch}
                    onValueChange={options => {
                      setSelectedUserIds(options.map(option => option.value));
                      setStaffSearch("");
                    }}
                    disabled={loading}
                  >
                    <ComboboxInput
                      id="compliance-staff-search"
                      placeholder="Search staff…"
                      aria-label="Search staff by name, department or staff ID"
                      className="w-full sm:w-60"
                    />
                    <ComboboxContent portalContainer={dialogContainer} className="min-w-64 max-w-[calc(100vw-2rem)]">
                      <ComboboxEmpty>No staff match your search.</ComboboxEmpty>
                      <ComboboxList>
                        {option => (
                          <ComboboxItem key={option.value} value={option}>
                            <span className="whitespace-normal break-words">{option.label}</span>
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </div>
              </div>

              {/* Selected List */}
              <div className="min-h-[60px] p-2 border rounded-md bg-muted/20 flex flex-wrap gap-2 max-h-[120px] overflow-y-auto">
                {selectedEmployees.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic p-1">No staff selected yet.</p>
                ) : (
                  selectedEmployees.map((emp) => (
                    <Badge key={emp.id} variant="secondary" className="pl-2 pr-1 py-1 gap-1">
                      <span className="text-[10px]">{emp.firstName} {emp.lastName}</span>
                      <button 
                        type="button"
                        onClick={() => handleRemoveUser(emp.id)}
                        aria-label={`Remove ${emp.firstName} ${emp.lastName}`}
                        className="hover:bg-muted-foreground/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right text-sm">
                Policy Category
              </Label>
              <div className="col-span-3 space-y-1.5">
                <Combobox<(typeof OFFICIAL_POLICY_CATEGORIES)[number]>
                  items={OFFICIAL_POLICY_CATEGORIES}
                  value={OFFICIAL_POLICY_CATEGORIES.find(category => category.type === formData.type) ?? null}
                  itemToStringLabel={category => category.label}
                  itemToStringValue={category => category.type}
                  onValueChange={category => handleTypeChange(category?.type ?? "")}
                  disabled={loading}
                >
                  <ComboboxInput id="type" placeholder="Search policy categories…" className="w-full" required />
                  <ComboboxContent portalContainer={dialogContainer}>
                    <ComboboxEmpty>No policy categories match your search.</ComboboxEmpty>
                    <ComboboxList>
                      {category => (
                        <ComboboxItem key={category.type} value={category}>
                          <span className="whitespace-normal break-words">{category.label}</span>
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
                {formData.type && (
                  <div className="flex items-center justify-between text-xs px-2 py-1 rounded bg-muted/40 border">
                    <span className="text-muted-foreground">Policy reference (if confirmed):</span>
                    <span className="font-semibold text-primary">
                      {OFFICIAL_POLICY_CATEGORIES.find((c) => c.type === formData.type)?.unitText || `${formData.points} Occurrence(s)`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right text-sm">
                Incident date
              </Label>
              <Input
                id="date"
                type="date"
                className="col-span-3"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="severity" className="text-right text-sm">
                Reported severity
              </Label>
              <Select
                value={formData.severity}
                onValueChange={(val) =>
                  setFormData({ ...formData, severity: val })
                }
                required
              >
                <SelectTrigger className="w-full col-span-3">
                  <SelectValue placeholder="Select reported severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right text-sm">
                Description
              </Label>
              <Textarea
                id="description"
                className="col-span-3"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="evidence">Evidence or reference</Label>
              <Textarea id="evidence" value={formData.evidence} onChange={(e) => setFormData({ ...formData, evidence: e.target.value })} placeholder="Record timestamps, message references, or file history. Evidence must be verified before confirming an occurrence." maxLength={10000} />
              <Label htmlFor="evidence-files">Attach evidence documents (optional)</Label>
              <Input id="evidence-files" type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" disabled={loading} onChange={event => {
                const files = Array.from(event.target.files ?? []);
                if (files.length + evidenceFiles.length > 5 || files.some(file => file.size > 10 * 1024 * 1024) || [...evidenceFiles, ...files].reduce((total, file) => total + file.size, 0) > 15 * 1024 * 1024) {
                  toast.error("Attach up to 5 documents: 10 MB per file and 15 MB in total.");
                } else setEvidenceFiles(previous => [...previous, ...files]);
                event.target.value = "";
              }} />
              <p className="text-xs text-muted-foreground">PDF, Word, Excel or images. Up to 5 files, 10 MB each and 15 MB in total. Staff involved can view these documents.</p>
              {evidenceFiles.length > 0 && <ul className="divide-y text-sm">{evidenceFiles.map((file, index) => <li key={index} className="flex items-center justify-between gap-2 py-2"><span className="min-w-0 break-words">{file.name}</span><Button type="button" variant="ghost" size="sm" disabled={loading} aria-label={`Remove ${file.name}`} onClick={() => setEvidenceFiles(previous => previous.filter((_, item) => item !== index))}>Remove</Button></li>)}</ul>}
              <p className="text-xs text-muted-foreground">Record the facts for review and allow each staff member to respond. Any occurrence or corrective action is decided separately after review.</p>
            </div>
          </div>
          <DialogFooter className="mt-auto pt-2 border-t">
            <Button 
              variant="ghost" 
              type="button" 
              onClick={() => setSelectedUserIds([])}
              disabled={selectedUserIds.length === 0 || loading}
              className="text-xs mr-auto"
            >
              Clear Selection
            </Button>
            <Button type="submit" disabled={loading || selectedUserIds.length === 0}>
              {loading ? "Sending query…" : `Send query to ${selectedUserIds.length} staff ${selectedUserIds.length === 1 ? "member" : "members"}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
