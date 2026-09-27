"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Plus, Briefcase, SlidersHorizontal, Loader2 } from "lucide-react";
import { createRecruitmentRole } from "@/lib/api/recruitment";
import { PLATFORM_DEPARTMENTS } from "@/lib/utils/role-department";
import { CriteriaPillsInput } from "./criteria-pills-input";
import { toast } from "sonner";

interface CreateRoleDialogProps {
  hrRequests?: any[];
  preselectedRequestId?: string;
  trigger?: React.ReactNode;
}

export function CreateRoleDialog({
  hrRequests = [],
  preselectedRequestId,
  trigger,
}: CreateRoleDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    department: "",
    openings_count: 1,
    employment_type: "full staff",
    job_description: "",
    custom_instructions: "",
    hr_request_id: preselectedRequestId || "",
  });

  const handleRequestSelect = (reqId: string) => {
    const selected = hrRequests.find((r) => r.id === reqId);
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        hr_request_id: selected.id,
        department: selected.department || prev.department,
        employment_type: selected.request_type || prev.employment_type,
        openings_count: selected.quantity || prev.openings_count,
        title: prev.title || `${selected.department} ${selected.request_type}`,
        job_description: prev.job_description || selected.reason || "",
      }));
    } else {
      setFormData((prev) => ({ ...prev, hr_request_id: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.department.trim()) {
      toast.error("Role title and department are required.");
      return;
    }

    try {
      setLoading(true);
      const res = await createRecruitmentRole({
        title: formData.title.trim(),
        department: formData.department.trim(),
        openings_count: Number(formData.openings_count) || 1,
        employment_type: formData.employment_type,
        job_description: formData.job_description.trim() || undefined,
        custom_instructions: formData.custom_instructions.trim() || undefined,
        hr_request_id: formData.hr_request_id || undefined,
      });

      if (!res.success || !res.data) {
        toast.error(res.error || "Failed to create recruitment role.");
        return;
      }

      toast.success("Recruitment role created successfully!");
      setOpen(false);
      router.push(`/hr/recruitment/${res.data.id}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to create recruitment role.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Recruitment Role
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Briefcase className="h-5 w-5 text-primary" />
            Create Recruitment Role
          </DialogTitle>
          <DialogDescription>
            Define role parameters, target department, and screening instructions for candidates.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {hrRequests.length > 0 && (
            <div className="space-y-2 rounded-lg border p-3 bg-muted/30">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Link to Staff Request (Optional)
              </Label>
              <Select
                value={formData.hr_request_id}
                onValueChange={handleRequestSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a pending/approved staff request..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- Standalone Role (No Request) --</SelectItem>
                  {hrRequests.map((req) => (
                    <SelectItem key={req.id} value={req.id}>
                      {req.department} - {req.request_type} ({req.quantity} opening{req.quantity > 1 ? "s" : ""}) • By {req.requester?.name || "Staff"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title <span className="text-destructive">*</span></Label>
              <Input
                id="title"
                placeholder="e.g. Senior Frontend Developer"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department <span className="text-destructive">*</span></Label>
              <Select
                value={formData.department}
                onValueChange={(val) => setFormData({ ...formData, department: val })}
              >
                <SelectTrigger id="department">
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORM_DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employment_type">Employment Type</Label>
              <Select
                value={formData.employment_type}
                onValueChange={(val) => setFormData({ ...formData, employment_type: val })}
              >
                <SelectTrigger id="employment_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full staff">Full Staff</SelectItem>
                  <SelectItem value="intern">Intern</SelectItem>
                  <SelectItem value="corps member">Corps Member (NYSC)</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="openings_count">Number of Openings</Label>
              <Input
                id="openings_count"
                type="number"
                min={1}
                value={formData.openings_count}
                onChange={(e) => setFormData({ ...formData, openings_count: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="job_description">Job Description / Requirements</Label>
            <Textarea
              id="job_description"
              placeholder="Outline the core responsibilities, key skills, and expected background for this position..."
              rows={3}
              value={formData.job_description}
              onChange={(e) => setFormData({ ...formData, job_description: e.target.value })}
            />
          </div>

          <CriteriaPillsInput
            value={formData.custom_instructions}
            onChange={(val) => setFormData({ ...formData, custom_instructions: val })}
          />

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Role & Open Workspace
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
