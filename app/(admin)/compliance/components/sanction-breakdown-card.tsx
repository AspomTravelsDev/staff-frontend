"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, Scale, ShieldAlert, CheckCircle2, Info, ChevronDown, ChevronUp } from "lucide-react";
import type { SanctionStep } from "@/lib/api/compliance";

interface SanctionBreakdownCardProps {
  steps?: SanctionStep[];
  defaultOpen?: boolean;
  className?: string;
}

const DEFAULT_STEPS: SanctionStep[] = [
  { step: 1, threshold: 2, label: "Verbal Warning" },
  { step: 2, threshold: 4, label: "Written Warning" },
  { step: 3, threshold: 6, label: "Final Written Warning" },
  { step: 4, threshold: 8, label: "Suspension" },
  { step: 5, threshold: 10, label: "Three days suspension" },
  { step: 6, threshold: 15, label: "One week suspension" },
  { step: 7, threshold: 20, label: "Termination" },
];

const OCCURRENCE_CONVERSIONS = [
  { title: "1 Absence", occurrences: "1 Occurrence", badge: "1 Occ.", desc: "Unapproved absence" },
  { title: "1 Customer complain", occurrences: "1 Occurrence", badge: "1 Occ.", desc: "Verified client dissatisfaction" },
  { title: "2 Tardies", occurrences: "1 Occurrence", badge: "0.5 Occ. ea", desc: "Two late arrivals count as one occurrence" },
  { title: "2 Missed Daily To-do-List/Report", occurrences: "1 Occurrence", badge: "0.5 Occ. ea", desc: "Two missing daily logs equal one occurrence" },
  { title: "1 Not meeting deadlines", occurrences: "1 Occurrence", badge: "1 Occ.", desc: "Unexcused failure to deliver on time" },
  { title: "1 Default in company policy/sop", occurrences: "1 Occurrence", badge: "1 Occ.", desc: "Non-compliance with standard operating procedures" },
];

export function SanctionBreakdownCard({
  steps = DEFAULT_STEPS,
  defaultOpen = false,
  className,
}: SanctionBreakdownCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const activeSteps = steps && steps.length > 0 ? steps : DEFAULT_STEPS;

  return (
    <Card className={`border shadow-sm overflow-hidden transition-all ${className || ""}`}>
      <CardHeader
        className="bg-muted/40 py-3 px-4 sm:px-6 cursor-pointer select-none hover:bg-muted/60 transition-colors"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Scale className="h-5 w-5 text-primary shrink-0" />
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                Official Sanction Grid & Disciplinary Breakdown
              </CardTitle>
              <CardDescription className="text-xs">
                Company policy conversion rules and cumulative disciplinary thresholds
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className="hidden sm:inline-flex text-xs font-normal border-primary/30 text-primary">
              Policy Guide
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              aria-label={isOpen ? "Collapse breakdown" : "Expand breakdown"}
            >
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isOpen && (
        <CardContent className="p-0 border-t animate-in fade-in-50 duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x">
            {/* Left Column: 1 Occurrence is equal to: */}
            <div className="lg:col-span-6 p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Info className="h-4 w-4 text-blue-500" />
                  1 Occurrence is equal to:
                </h4>
                <span className="text-[11px] text-muted-foreground">Rule Conversion</span>
              </div>

              <div className="space-y-2.5">
                {OCCURRENCE_CONVERSIONS.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between gap-2 p-2 rounded-md hover:bg-muted/30 transition-colors border border-transparent hover:border-border/50"
                  >
                    <div className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium leading-none text-foreground">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[10px] shrink-0 font-medium">
                      {item.badge}
                    </Badge>
                  </div>
                ))}
              </div>

              {/* Insubordination Special Callout */}
              <div className="rounded-md border border-red-200 bg-red-50/70 dark:bg-red-950/20 dark:border-red-900/40 p-3 flex items-start gap-2.5">
                <ShieldAlert className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-red-900 dark:text-red-200">
                    Insubordination jumps to Step 4
                  </p>
                  <p className="text-[11px] text-red-700/90 dark:text-red-300/80 mt-0.5">
                    Any verified insubordination automatically bypasses initial warnings and proceeds directly to Suspension.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Occurrences to Disciplinary Step and Action */}
            <div className="lg:col-span-6 p-4 sm:p-5 space-y-4 bg-muted/10">
              <div className="flex items-center justify-between pb-2 border-b">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  Disciplinary Steps & Actions
                </h4>
                <span className="text-[11px] text-muted-foreground">Cumulative Half-Year</span>
              </div>

              <div className="overflow-hidden rounded-md border bg-background">
                <table className="w-full text-left text-xs">
                  <thead className="bg-primary text-primary-foreground">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold w-1/3">Occurrences</th>
                      <th className="py-2.5 px-3 font-semibold">Disciplinary Step & Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {activeSteps.map((step) => {
                      const isSevere = step.step >= 4;
                      return (
                        <tr
                          key={step.step}
                          className={`hover:bg-muted/40 transition-colors ${
                            isSevere ? "bg-red-500/5 dark:bg-red-500/10" : ""
                          }`}
                        >
                          <td className="py-2.5 px-3 font-medium">
                            <span className="inline-flex items-center gap-1.5">
                              <span className="font-bold text-foreground">
                                {step.threshold}
                              </span>
                              <span className="text-muted-foreground">Occurrences</span>
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={isSevere ? "destructive" : "outline"}
                                className={`text-[10px] font-medium h-5 px-1.5 ${
                                  !isSevere ? "border-amber-500/40 text-amber-700 dark:text-amber-400" : ""
                                }`}
                              >
                                Step {step.step}
                              </Badge>
                              <span className={`font-medium ${isSevere ? "text-red-700 dark:text-red-300 font-semibold" : "text-foreground"}`}>
                                {step.label}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <p className="text-[11px] text-muted-foreground italic flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                Occurrences only accumulate onto the grid when confirmed through formal disciplinary action.
              </p>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
