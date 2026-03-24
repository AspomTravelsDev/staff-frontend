"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Client,
  CRM_SERVICE_OPTIONS,
  CRM_SOURCE_OPTIONS,
  CRM_STATUS_OPTIONS,
  CreateClientRequest,
} from "@/lib/api/crm-constants";
import { createClientAction } from "../actions";
import { Loader2 } from "lucide-react";
import { useEmployees } from "@/lib/api/hooks/use-employees";

interface AddClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId?: string;
}

const EMPTY_FORM: CreateClientRequest = {
  name: "",
  contactPerson: "",
  email: "",
  phone: "",
  status: "potential",
  service: "",
  source: "",
  notes: "",
  assignedTo: "",
};

export function AddClientDialog({
  open,
  onOpenChange,
  currentUserId,
}: AddClientDialogProps) {
  const [form, setForm] = useState<CreateClientRequest>({
    ...EMPTY_FORM,
    assignedTo: currentUserId || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: employeesData } = useEmployees({ status: "Active" });
  const employees = employeesData?.items || [];

  const set = (field: keyof CreateClientRequest, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    if (!form.name || !form.service || !form.source) {
      setError("Please fill in Name, Service, and Source.");
      return;
    }
    setError(null);
    setLoading(true);
    const result = await createClientAction(form);
    setLoading(false);
    if (result.success) {
      setForm({ ...EMPTY_FORM, assignedTo: currentUserId || "" });
      onOpenChange(false);
    } else {
      setError(result.error ?? "Failed to add client.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Name */}
          <div className="grid gap-1.5">
            <Label htmlFor="name">
              Client / Company Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g. Adaeze Okonkwo or Elevate Consulting"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>

          {/* Contact Person & DOB */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="contactPerson">Contact Person</Label>
              <Input
                id="contactPerson"
                placeholder="Primary contact name"
                value={form.contactPerson}
                onChange={(e) => set("contactPerson", e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="dateOfBirth">Date of Birth (Optional)</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={form.dateOfBirth ?? ""}
                onChange={(e) => set("dateOfBirth", e.target.value)}
              />
            </div>
          </div>

          {/* Email + Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="client@example.com"
                value={form.email ?? ""}
                onChange={(e) => set("email", e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+234 800 000 0000"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
            </div>
          </div>

          {/* Status + Service */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>
                Status <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.status}
                onValueChange={(v) => set("status", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {CRM_STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>
                Service <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.service}
                onValueChange={(v) => set("service", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  {CRM_SERVICE_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Source + Assigned To */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>
                Source <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.source}
                onValueChange={(v) => set("source", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="How they found us" />
                </SelectTrigger>
                <SelectContent>
                  {CRM_SOURCE_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Assigned To</Label>
              <Select
                value={form.assignedTo || "unassigned"}
                onValueChange={(v) =>
                  set("assignedTo", v === "unassigned" ? "" : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.firstName} {e.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="grid gap-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any relevant details about this customer..."
              rows={3}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Customer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
