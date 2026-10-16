"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { recruitmentTracks } from "@/lib/recruitment/pipeline-configuration";
import type { PipelineSettings } from "@/lib/types/recruitment-pipeline";
import { PipelineDisclosure } from "./pipeline-disclosure";

export const defaultPipelineSettings = (track = ""): PipelineSettings => ({
  track,
  custom_questions: [],
  thresholds: { oral_interview: 60, written_exam: 60, practical: 70 },
});

export function DepartmentAssessmentSelect({
  value,
  onChange,
  disabled = false,
  id = "department-assessment",
}: {
  value: string;
  onChange: (track: string) => void;
  disabled?: boolean;
  id?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>Department assessment</Label>
      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        required
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder="Choose an assessment" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(recruitmentTracks).map(([track, label]) => (
            <SelectItem key={track} value={track}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function PipelineSettingsFields({
  value,
  onChange,
  locked = false,
  showDepartment = true,
}: {
  value: PipelineSettings;
  onChange: (value: PipelineSettings) => void;
  locked?: boolean;
  showDepartment?: boolean;
}) {
  return (
    <div className="space-y-3">
      {showDepartment && (
        <DepartmentAssessmentSelect
          value={value.track}
          disabled={locked}
          onChange={(track) => onChange({ ...value, track })}
        />
      )}
      <p className="text-xs text-muted-foreground">
        Oral 35% · Written 25% · Practical 40%. Computer skills contribute 40%
        of the written score. All questions and tasks are included.
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {(
          [
            ["oral_interview", "Oral pass mark"],
            ["written_exam", "Written pass mark"],
            ["practical", "Practical pass mark"],
          ] as const
        ).map(([key, label]) => (
          <div key={key} className="space-y-1.5">
            <Label htmlFor={`threshold-${key}`}>{label}</Label>
            <div className="flex items-center gap-1.5">
              <Input
                id={`threshold-${key}`}
                type="number"
                min={1}
                max={100}
                required
                disabled={locked}
                value={value.thresholds[key]}
                onChange={(e) =>
                  onChange({
                    ...value,
                    thresholds: {
                      ...value.thresholds,
                      [key]: Number(e.target.value),
                    },
                  })
                }
              />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
          </div>
        ))}
      </div>
      <PipelineDisclosure
        title={`Custom oral questions (${value.custom_questions.length})`}
        className="border-t pt-2"
      >
        <div className="space-y-3">
          {value.custom_questions.map((text, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor={`custom-question-${i}`}>Question {i + 1}</Label>
                {!locked && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      onChange({
                        ...value,
                        custom_questions: value.custom_questions.filter(
                          (_, n) => n !== i,
                        ),
                      })
                    }
                  >
                    Remove question
                  </Button>
                )}
              </div>
              <Textarea
                id={`custom-question-${i}`}
                required
                minLength={3}
                maxLength={2000}
                disabled={locked}
                value={text}
                onChange={(e) =>
                  onChange({
                    ...value,
                    custom_questions: value.custom_questions.map((q, n) =>
                      n === i ? e.target.value : q,
                    ),
                  })
                }
              />
            </div>
          ))}
          {!locked && (
            <Button
              type="button"
              variant="outline"
              disabled={value.custom_questions.length >= 20}
              onClick={() =>
                onChange({
                  ...value,
                  custom_questions: [...value.custom_questions, ""],
                })
              }
            >
              Add question
            </Button>
          )}
        </div>
      </PipelineDisclosure>
      {locked && (
        <p className="text-xs text-muted-foreground">
          Questions and pass marks are locked because assessments have started.
        </p>
      )}
    </div>
  );
}
