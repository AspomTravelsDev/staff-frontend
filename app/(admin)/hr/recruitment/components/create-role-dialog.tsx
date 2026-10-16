"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { createRecruitmentRole } from "@/lib/api/recruitment";
import { departmentForAssessment } from "@/lib/recruitment/pipeline-configuration";
import { suggestedAssessmentTrack } from "@/lib/recruitment/assessment-configuration";
import {
  DepartmentAssessmentSelect,
  PipelineSettingsFields,
  defaultPipelineSettings,
} from "./pipeline-settings-fields";
import { CriteriaPillsInput } from "./criteria-pills-input";
import { cn } from "@/lib/utils";

interface StaffRequestOption {
  id: string;
  department?: string;
  request_type?: string;
  quantity?: number;
  reason?: string;
  requester?: { name: string };
}
interface CreateRoleDialogProps {
  hrRequests?: StaffRequestOption[];
  preselectedRequestId?: string;
  trigger?: React.ReactNode;
  triggerClassName?: string;
}
export function CreateRoleDialog({
  hrRequests = [],
  preselectedRequestId,
  trigger,
  triggerClassName,
}: CreateRoleDialogProps) {
  const router = useRouter();
  const request = hrRequests.find((r) => r.id === preselectedRequestId);
  const initial = {
    title: "",
    department: request?.department ?? "",
    openings_count: request?.quantity ?? 1,
    employment_type: request?.request_type ?? "full staff",
    job_description: request?.reason ?? "",
    custom_instructions: "",
    hr_request_id: preselectedRequestId ?? "",
    salary_budget_min: "",
    salary_budget_max: "",
  };
  const [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [form, setForm] = useState(initial);
  const [settings, setSettings] = useState(
    defaultPipelineSettings(suggestedAssessmentTrack(initial.department)),
  );
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (
      !settings.track ||
      settings.custom_questions.some((q) => q.trim().length < 3)
    ) {
      setError(
        "Choose the department assessment and complete any custom questions.",
      );
      return;
    }
    if (Number(form.salary_budget_max) < Number(form.salary_budget_min)) {
      setError("The maximum salary must be at least the minimum.");
      return;
    }
    setBusy(true);
    try {
      const result = await createRecruitmentRole({
        ...form,
        department: departmentForAssessment(settings.track),
        salary_budget_min: Number(form.salary_budget_min),
        salary_budget_max: Number(form.salary_budget_max),
        hr_request_id: form.hr_request_id || undefined,
        pipeline_settings: settings,
      });
      if (!result.success || !result.data) {
        setError(
          result.error || "The role could not be created. Please retry.",
        );
        return;
      }
      toast.success("Recruitment role created.");
      setOpen(false);
      setForm(initial);
      setSettings(
        defaultPipelineSettings(suggestedAssessmentTrack(initial.department)),
      );
      router.push(`/hr/recruitment/${result.data.id}`);
    } catch {
      setError("The role could not be created. Please retry.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!busy) setOpen(value);
      }}
    >
      <DialogTrigger asChild>
        {trigger || (
          <Button className={cn("gap-2", triggerClassName)}>
            <Plus className="size-4" />
            Create recruitment role
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create recruitment role</DialogTitle>
          <DialogDescription>
            Set the vacancy, monthly salary budget and assessment standards.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <fieldset disabled={busy} className="space-y-3">
            {hrRequests.length > 0 && (
              <div className="space-y-1.5">
                <Label htmlFor="role-staff-request">
                  Staff request (optional)
                </Label>
                <Select
                  disabled={busy}
                  value={form.hr_request_id || "standalone"}
                  onValueChange={(value) => {
                    const selected = hrRequests.find((r) => r.id === value);
                    setForm({
                      ...form,
                      hr_request_id: value === "standalone" ? "" : value,
                      ...(selected
                        ? {
                            department: selected.department || form.department,
                            openings_count:
                              selected.quantity || form.openings_count,
                            employment_type:
                              selected.request_type || form.employment_type,
                            job_description:
                              selected.reason || form.job_description,
                          }
                        : {}),
                    });
                    if (selected?.department)
                      setSettings(
                        defaultPipelineSettings(
                          suggestedAssessmentTrack(selected.department),
                        ),
                      );
                  }}
                >
                  <SelectTrigger id="role-staff-request" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standalone">Standalone role</SelectItem>
                    {hrRequests.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.department} · {r.quantity} openings
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="role-title">Job title</Label>
                <Input
                  id="role-title"
                  required
                  maxLength={255}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <DepartmentAssessmentSelect
                value={settings.track}
                disabled={busy}
                onChange={(track) => {
                  setSettings({ ...settings, track });
                  setForm({
                    ...form,
                    department: departmentForAssessment(track),
                  });
                }}
              />
              <div className="space-y-1.5">
                <Label htmlFor="role-employment">Employment type</Label>
                <Select
                  disabled={busy}
                  value={form.employment_type}
                  onValueChange={(value) =>
                    setForm({ ...form, employment_type: value })
                  }
                >
                  <SelectTrigger id="role-employment" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["full staff", "intern", "corps member", "contract"].map(
                      (type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="role-openings">Openings</Label>
                <Input
                  id="role-openings"
                  type="number"
                  min={1}
                  step={1}
                  required
                  value={form.openings_count}
                  onChange={(e) =>
                    setForm({ ...form, openings_count: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="role-salary-min">
                  Minimum monthly salary (NGN)
                </Label>
                <Input
                  id="role-salary-min"
                  type="number"
                  min={0}
                  required
                  value={form.salary_budget_min}
                  onChange={(e) =>
                    setForm({ ...form, salary_budget_min: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="role-salary-max">
                  Maximum monthly salary (NGN)
                </Label>
                <Input
                  id="role-salary-max"
                  type="number"
                  min={0}
                  required
                  value={form.salary_budget_max}
                  onChange={(e) =>
                    setForm({ ...form, salary_budget_max: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role-requirements">Role requirements</Label>
              <Textarea
                id="role-requirements"
                value={form.job_description}
                onChange={(e) =>
                  setForm({ ...form, job_description: e.target.value })
                }
              />
            </div>
            <CriteriaPillsInput
              value={form.custom_instructions}
              onChange={(value) =>
                setForm({ ...form, custom_instructions: value })
              }
            />
            <section className="space-y-2 border-t pt-3">
              <h3 className="text-xs font-medium">Assessment standards</h3>
              <PipelineSettingsFields
                value={settings}
                onChange={setSettings}
                showDepartment={false}
              />
            </section>
          </fieldset>
          {error && (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button disabled={busy} type="submit">
              {busy && <Loader2 className="size-4 animate-spin" />}
              {busy ? "Creating…" : "Create role"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
