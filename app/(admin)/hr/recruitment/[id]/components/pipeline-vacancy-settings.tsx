"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
import { PipelineDisclosure } from "../../components/pipeline-disclosure";
import {
  PipelineSettingsFields,
  defaultPipelineSettings,
} from "../../components/pipeline-settings-fields";
import { saveRecruitmentPipelineSettings } from "@/lib/api/recruitment-pipeline";
import { updateRecruitmentRole } from "@/lib/api/recruitment";
import { suggestedAssessmentTrack } from "@/lib/recruitment/assessment-configuration";
import {
  pipelineStages,
  pipelineLabels,
  type PipelineSettings,
} from "@/lib/types/recruitment-pipeline";
import type { RecruitmentRole } from "@/lib/types/recruitment";

export function PipelineVacancySettings({
  role: initial,
  onSaved,
  registerClose,
}: {
  role: RecruitmentRole;
  onSaved: (role: RecruitmentRole) => void;
  registerClose: (guard: () => Promise<boolean>) => () => void;
}) {
  const router = useRouter();
  const [role, setRole] = useState(initial),
    [settings, setSettings] = useState<PipelineSettings>(
      initial.pipeline_config ??
        defaultPipelineSettings(suggestedAssessmentTrack(initial.department)),
    );
  const [minimum, setMinimum] = useState(initial.salary_budget_min ?? 0),
    [maximum, setMaximum] = useState(initial.salary_budget_max ?? 0),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const [status, setStatus] = useState(initial.status),
    [description, setDescription] = useState(initial.job_description ?? ""),
    [instructions, setInstructions] = useState(
      initial.custom_instructions ?? "",
    );
  const fingerprint = JSON.stringify({
    settings,
    minimum,
    maximum,
    status,
    description,
    instructions,
  });
  const baseline = useRef(fingerprint);
  useEffect(
    () =>
      registerClose(
        async () =>
          !busy &&
          (fingerprint === baseline.current ||
            window.confirm("Close without saving these vacancy settings?")),
      ),
    [busy, fingerprint, registerClose],
  );
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const statuses = Object.fromEntries(
        Object.entries(settings.statuses ?? {}).map(([stage, labels]) => [
          stage,
          labels.map((label) => label.trim()).filter(Boolean),
        ]),
      );
      const result = await saveRecruitmentPipelineSettings(role.id, {
        ...settings,
        statuses,
        salary_budget_min: minimum,
        salary_budget_max: maximum,
      });
      if (!result.success) {
        setMessage(result.error);
        return;
      }
      const details = await updateRecruitmentRole(role.id, {
        status,
        job_description: description,
        custom_instructions: instructions,
      });
      if (!details.success) {
        setMessage(
          details.error ||
            "Assessment saved; vacancy details could not be saved. Retry.",
        );
        return;
      }
      setRole(result.data);
      setSettings(result.data.pipeline_config!);
      setMessage("Vacancy settings saved.");
      baseline.current = fingerprint;
      onSaved({
        ...result.data,
        status,
        job_description: description,
        custom_instructions: instructions,
      });
      router.refresh();
    } catch {
      setMessage("Settings could not be saved. Please retry.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-4">
      <form className="space-y-4" onSubmit={submit}>
        <fieldset disabled={busy} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="vacancy-status">Recruitment status</Label>
              <Select
                disabled={busy}
                value={status}
                onValueChange={(value) => setStatus(value as typeof status)}
              >
                <SelectTrigger id="vacancy-status" className="w-full">
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
              <Label htmlFor="vacancy-salary-min">
                Minimum monthly salary (NGN)
              </Label>
              <Input
                id="vacancy-salary-min"
                type="number"
                min={0}
                required
                value={minimum}
                onChange={(e) => setMinimum(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vacancy-salary-max">
                Maximum monthly salary (NGN)
              </Label>
              <Input
                id="vacancy-salary-max"
                type="number"
                min={minimum}
                required
                value={maximum}
                onChange={(e) => setMaximum(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vacancy-requirements">Role requirements</Label>
            <Textarea
              id="vacancy-requirements"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vacancy-instructions">
              CV screening instructions
            </Label>
            <Textarea
              id="vacancy-instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>
          <PipelineSettingsFields
            value={settings}
            onChange={setSettings}
            locked={busy || !!role.pipeline_locked_at}
          />
          {role.pipeline_config && (
            <PipelineDisclosure
              className="border-t pt-3"
              title="Fixed questions and practical tasks"
            >
              <div className="space-y-3 text-xs">
                <h2 className="font-semibold">Oral interview</h2>
                <ol className="list-decimal space-y-2 pl-5">
                  {role.pipeline_config.oral_questions.map((q) => (
                    <li key={q.id}>{q.text}</li>
                  ))}
                </ol>
                <h2 className="font-semibold">Written exam</h2>
                <ol className="list-decimal space-y-2 pl-5">
                  {role.pipeline_config.written_questions.map((q) => (
                    <li key={q.id}>{q.text}</li>
                  ))}
                </ol>
                <h2 className="font-semibold">Practical tasks</h2>
                <ul className="list-disc space-y-2 pl-5">
                  {role.pipeline_config.practical_modules.map((task) => (
                    <li key={task.id}>{task.name}</li>
                  ))}
                </ul>
              </div>
            </PipelineDisclosure>
          )}
        </fieldset>
        {message && (
          <p role="status" className="text-sm">
            {message}
          </p>
        )}
        <Button disabled={busy} type="submit">
          {busy ? "Saving…" : "Save vacancy settings"}
        </Button>
      </form>
    </div>
  );
}
