"use client";

import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SlidersHorizontal, Plus, Check } from "lucide-react";

export const SUGGESTED_CRITERIA_PILLS = [
  "Attention to Detail",
  "Leadership Potential",
  "Fast Learner & Smart",
  "Multitasking Ability",
  "Problem Solving",
  "Strong Work Ethic",
  "Good Communication",
  "Proactive & Self-Starter",
  "Works Well Under Pressure",
  "Team Player",
  "Time Management",
  "Lagos Resident",
  "Job Stability (Low Turnover)",
  "Strong Industry Experience",
];

interface CriteriaPillsInputProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  label?: string;
  description?: string;
  placeholder?: string;
  rows?: number;
}

export function CriteriaPillsInput({
  value,
  onChange,
  id = "custom_instructions",
  label = "Candidate Screening Instructions (What to look for)",
  description = "Click suggested traits or type specific skills, qualifications, or dealbreakers for evaluating candidate fit.",
  placeholder = "e.g. Look for strong React experience, high attention to detail, agency background...",
  rows = 3,
}: CriteriaPillsInputProps) {
  const isSelected = (trait: string) => {
    return value.toLowerCase().includes(trait.toLowerCase());
  };

  const togglePill = (trait: string) => {
    const lowerVal = value.toLowerCase();
    const lowerTrait = trait.toLowerCase();

    if (lowerVal.includes(lowerTrait)) {
      // Cleanly remove the trait
      const escaped = trait.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(?:,\\s*)?${escaped}(?:,\\s*|\\.\\s*)?`, "gi");
      let nextVal = value.replace(regex, ", ").replace(/^,\s*|,\s*$/g, "").trim();
      // Clean duplicate commas
      nextVal = nextVal.replace(/,\s*,/g, ",").replace(/^,\s*|,\s*$/g, "");
      onChange(nextVal);
    } else {
      // Append trait
      const trimmed = value.trim();
      if (!trimmed) {
        onChange(trait);
      } else if (trimmed.endsWith(".") || trimmed.endsWith(",")) {
        onChange(`${trimmed} ${trait}`);
      } else {
        onChange(`${trimmed}, ${trait}`);
      }
    }
  };

  return (
    <div className="space-y-2.5 rounded-lg border bg-muted/30 p-3.5">
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-foreground font-medium text-xs">
          <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
          {label}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>

      {/* Suggested Trait Pills */}
      <div className="space-y-1.5 pt-1">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Suggested Criteria (Click to add/remove)
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED_CRITERIA_PILLS.map((pill) => {
            const active = isSelected(pill);
            return (
              <button
                key={pill}
                type="button"
                onClick={() => togglePill(pill)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-all cursor-pointer select-none ${
                  active
                    ? "bg-primary text-primary-foreground font-medium shadow-sm"
                    : "bg-background border border-muted-foreground/20 text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
              >
                {active ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Plus className="h-3 w-3 opacity-60" />
                )}
                <span>{pill}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Freeform Textarea */}
      <div className="pt-1.5">
        <Label htmlFor={id} className="text-[11px] text-muted-foreground mb-1 block">
          Custom Notes & Specific Requirements:
        </Label>
        <Textarea
          id={id}
          rows={rows}
          className="bg-background text-xs leading-relaxed"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}
