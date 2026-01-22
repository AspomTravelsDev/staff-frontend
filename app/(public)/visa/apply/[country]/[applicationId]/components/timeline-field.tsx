"use client";

import { useState } from "react";
import {
  IconPlus,
  IconTrash,
  IconGripVertical,
  IconAlertCircle,
} from "@tabler/icons-react";
import type { TimelineEntry } from "@/lib/validations/visa";
import type { FieldDefinition } from "@/lib/visa/fields";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";

interface TimelineFieldProps {
  value?: TimelineEntry[];
  onChange: (value: TimelineEntry[]) => void;
  config: NonNullable<FieldDefinition["timelineConfig"]>;
  className?: string;
}

export function TimelineField({
  value = [],
  onChange,
  config,
  className,
}: TimelineFieldProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(
    value.length === 0 ? null : 0,
  );

  const addEntry = () => {
    const newEntry: TimelineEntry = {
      id: crypto.randomUUID(),
    };
    onChange([...value, newEntry]);
    setExpandedIndex(value.length);
  };

  const removeEntry = (index: number) => {
    const newValue = value.filter((_, i) => i !== index);
    onChange(newValue);
    if (expandedIndex === index) {
      setExpandedIndex(null);
    } else if (expandedIndex !== null && expandedIndex > index) {
      setExpandedIndex(expandedIndex - 1);
    }
  };

  const updateEntry = (index: number, field: string, fieldValue: unknown) => {
    const newValue = [...value];
    newValue[index] = { ...newValue[index], [field]: fieldValue };
    onChange(newValue);
  };

  // Check for gaps in timeline (for 10-year history fields)
  const checkForGaps = (): { hasGaps: boolean; message?: string } => {
    if (!config.requireNoGaps || value.length === 0) {
      return { hasGaps: false };
    }

    // Sort entries by end date
    const sortedEntries = [...value]
      .filter((e) => e.start_date && e.end_date)
      .sort((a, b) => {
        const dateA = new Date(a.end_date as string);
        const dateB = new Date(b.end_date as string);
        return dateB.getTime() - dateA.getTime();
      });

    if (sortedEntries.length === 0) {
      return {
        hasGaps: true,
        message: "Please add at least one entry with dates",
      };
    }

    // Check if timeline covers required years
    const now = new Date();
    const requiredStartDate = new Date(
      now.getFullYear() - config.minYears,
      now.getMonth(),
      now.getDate(),
    );

    const oldestEntry = sortedEntries[sortedEntries.length - 1];
    const oldestDate = new Date(oldestEntry.start_date as string);

    if (oldestDate > requiredStartDate) {
      return {
        hasGaps: true,
        message: `Your history should go back to ${requiredStartDate.toLocaleDateString()}`,
      };
    }

    // Check for gaps between entries
    for (let i = 0; i < sortedEntries.length - 1; i++) {
      const currentStart = new Date(sortedEntries[i].start_date as string);
      const previousEnd = new Date(sortedEntries[i + 1].end_date as string);

      // Allow 1 day gap for consecutive entries
      const gapDays =
        (currentStart.getTime() - previousEnd.getTime()) /
        (1000 * 60 * 60 * 24);
      if (gapDays > 1) {
        return {
          hasGaps: true,
          message: `Gap detected between ${previousEnd.toLocaleDateString()} and ${currentStart.toLocaleDateString()}`,
        };
      }
    }

    return { hasGaps: false };
  };

  const gapCheck = checkForGaps();

  const renderFieldInput = (
    entryIndex: number,
    fieldDef: Omit<FieldDefinition, "step" | "countries" | "conditions">,
    entry: TimelineEntry,
  ) => {
    const fieldValue = entry[fieldDef.name as keyof TimelineEntry];

    switch (fieldDef.type) {
      case "select":
        return (
          <Select
            value={fieldValue as string}
            onValueChange={(val) => updateEntry(entryIndex, fieldDef.name, val)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {fieldDef.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "date":
        return (
          <DatePicker
            value={fieldValue ? new Date(fieldValue as string) : undefined}
            onChange={(date) =>
              updateEntry(entryIndex, fieldDef.name, date?.toISOString())
            }
            placeholder="Select date"
          />
        );

      default:
        return (
          <Input
            value={(fieldValue as string) || ""}
            onChange={(e) =>
              updateEntry(entryIndex, fieldDef.name, e.target.value)
            }
            placeholder={fieldDef.placeholder}
          />
        );
    }
  };

  const getEntrySummary = (entry: TimelineEntry): string => {
    const parts: string[] = [];

    if (entry.activity_type) {
      parts.push(entry.activity_type);
    }
    if (entry.organization || entry.institution) {
      parts.push(entry.organization || entry.institution || "");
    }
    if (entry.position || entry.field_of_study) {
      parts.push(entry.position || entry.field_of_study || "");
    }
    if (entry.country) {
      parts.push(entry.country);
    }
    if (entry.child_name) {
      parts.push(entry.child_name);
    }

    return parts.join(" • ") || "New entry";
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Gap warning */}
      {config.requireNoGaps && gapCheck.hasGaps && value.length > 0 && (
        <div className="bg-destructive/10 text-destructive flex items-start gap-2 rounded-md p-3 text-sm">
          <IconAlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{gapCheck.message}</span>
        </div>
      )}

      {/* Timeline entries */}
      <div className="space-y-2">
        {value.map((entry, index) => (
          <Card key={entry.id} className="overflow-hidden">
            <div
              role="button"
              tabIndex={0}
              onClick={() =>
                setExpandedIndex(expandedIndex === index ? null : index)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setExpandedIndex(expandedIndex === index ? null : index);
                }
              }}
              className="hover:bg-muted/50 flex w-full cursor-pointer items-center gap-2 p-3 text-left transition-colors"
            >
              <IconGripVertical className="text-muted-foreground size-4 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">
                  {getEntrySummary(entry)}
                </div>
                {entry.start_date && entry.end_date && (
                  <div className="text-muted-foreground text-xs">
                    {new Date(entry.start_date as string).toLocaleDateString()}{" "}
                    – {new Date(entry.end_date as string).toLocaleDateString()}
                  </div>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive size-7 shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  removeEntry(index);
                }}
              >
                <IconTrash className="size-4" />
              </Button>
            </div>

            {expandedIndex === index && (
              <CardContent className="border-t pt-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  {config.fields.map((fieldDef) => (
                    <div key={fieldDef.name} className="space-y-1.5">
                      <Label className="text-xs">{fieldDef.label}</Label>
                      {renderFieldInput(index, fieldDef, entry)}
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Add button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addEntry}
        className="w-full"
      >
        <IconPlus className="mr-2 size-4" />
        Add Entry
      </Button>

      {/* Info text */}
      {config.requireNoGaps && (
        <p className="text-muted-foreground text-xs">
          Please ensure there are no gaps in your {config.minYears}-year
          history. Include all periods of employment, education, unemployment,
          and travel.
        </p>
      )}
    </div>
  );
}
