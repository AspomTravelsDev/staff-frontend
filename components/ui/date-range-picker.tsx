"use client";

import * as React from "react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { IconCalendar } from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { formatLagosDateForInput } from "@/lib/utils/attendance";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface DatePickerWithRangeProps {
  date: DateRange | undefined;
  setDate: (date: DateRange | undefined) => void;
  disabled?: boolean;
  className?: string;
  applyOnConfirm?: boolean;
}

export function DatePickerWithRange({
  className,
  date,
  setDate,
  disabled,
  applyOnConfirm = false,
}: DatePickerWithRangeProps) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<DateRange | undefined>(date);
  const [month, setMonth] = React.useState<Date | undefined>(date?.from);
  const selected = applyOnConfirm ? draft : date;
  const selectPreset = (preset: "today" | "month" | "30days") => {
    const today = new Date(`${formatLagosDateForInput(new Date())}T12:00:00`);
    const from = new Date(today);
    const to = new Date(today);
    if (preset === "month") {
      from.setDate(1);
      to.setMonth(to.getMonth() + 1, 0);
    } else if (preset === "30days") {
      from.setDate(from.getDate() - 29);
    }
    setDraft({ from, to });
    setMonth(from);
  };
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={open} onOpenChange={(value) => { if (value) { setDraft(date); setMonth(date?.from); } setOpen(value); }}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-[260px] justify-start text-left font-normal bg-background px-3 h-10",
              !date && "text-muted-foreground",
              className,
            )}
          >
            <IconCalendar className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto max-w-[calc(100vw-2rem)] p-0" align="end">
          {applyOnConfirm && <div className="flex flex-wrap gap-1 border-b p-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => selectPreset("today")}>Today</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => selectPreset("month")}>This month</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => selectPreset("30days")}>Last 30 days</Button>
          </div>}
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={selected?.from}
            month={applyOnConfirm ? month : undefined}
            onMonthChange={applyOnConfirm ? setMonth : undefined}
            selected={selected}
            onSelect={applyOnConfirm ? setDraft : setDate}
            numberOfMonths={2}
          />
          {applyOnConfirm && <div className="flex flex-wrap items-center justify-between gap-2 border-t p-3">
            <p className="text-xs text-muted-foreground" role="status">{draft?.from ? `${format(draft.from, "dd MMM yyyy")} – ${format(draft.to ?? draft.from, "dd MMM yyyy")}` : "Choose a date or range"}</p>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="button" size="sm" disabled={!draft?.from || disabled} onClick={() => { if (!draft?.from) return; setDate({ from: draft.from, to: draft.to ?? draft.from }); setOpen(false); }}>Apply</Button>
            </div>
          </div>}
        </PopoverContent>
      </Popover>
    </div>
  );
}
