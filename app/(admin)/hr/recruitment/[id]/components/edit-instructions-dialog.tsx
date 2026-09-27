"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SlidersHorizontal, Edit3, Loader2 } from "lucide-react";
import type { RecruitmentRole } from "@/lib/types/recruitment";
import { updateRecruitmentRole } from "@/lib/api/recruitment";
import { PLATFORM_DEPARTMENTS } from "@/lib/utils/role-department";
import { CriteriaPillsInput } from "../../components/criteria-pills-input";
import { toast } from "sonner";

interface EditInstructionsDialogProps {
  role: RecruitmentRole;
  trigger?: React.ReactNode;
}

export function EditInstructionsDialog({ role, trigger }: EditInstructionsDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: role.title,
    department: role.department,
    openings_count: role.openings_count,
    employment_type: role.employment_type,
    job_description: role.job_description || "",
    custom_instructions: role.custom_instructions || "",
    status: role.status,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await updateRecruitmentRole(role.id, formData);
      if (!res.success) {
        toast.error(res.error || "Failed to update role.");
        return;
      }
      toast.success("Role and screening criteria updated successfully!");
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update role.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-1.5">
            <Edit3 className="h-3.5 w-3.5" />
            Edit Criteria & Instructions
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-primary" />
            Role Criteria & Screening Instructions
          </DialogTitle>
          <DialogDescription>
            Update screening instructions or role parameters. Re-analyzing candidates will use these updated criteria.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-title">Job Title</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-dept">Department</Label>
              <Select
                value={formData.department}
                onValueChange={(val) => setFormData({ ...formData, department: val })}
              >
                <SelectTrigger id="edit-dept">
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-status">Campaign Status</Label>
              <Select
                value={formData.status}
                onValueChange={(val: any) => setFormData({ ...formData, status: val })}
              >
                <SelectTrigger id="edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-openings">Openings</Label>
              <Input
                id="edit-openings"
                type="number"
                min={1}
                value={formData.openings_count}
                onChange={(e) => setFormData({ ...formData, openings_count: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-desc">Job Description</Label>
            <Textarea
              id="edit-desc"
              rows={3}
              value={formData.job_description}
              onChange={(e) => setFormData({ ...formData, job_description: e.target.value })}
            />
          </div>

          <CriteriaPillsInput
            value={formData.custom_instructions}
            onChange={(val) => setFormData({ ...formData, custom_instructions: val })}
            rows={4}
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
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
