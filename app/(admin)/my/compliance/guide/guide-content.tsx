"use client";

import { useState } from "react";
import Image from "next/image";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GUIDE_GROUPS, filterComplianceRules, type GuideGroup } from "@/lib/compliance-guide";
import type { SanctionStep, CompliancePolicyContext } from "@/lib/types/compliance";

export function ComplianceGuideContent({ steps, clientErrorLevels = [] }: { steps: SanctionStep[]; clientErrorLevels?: CompliancePolicyContext["client_error_levels"] }) {
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState<GuideGroup>("All rules");
  const rules = filterComplianceRules(search, group);
  const clearFilters = () => { setSearch(""); setGroup("All rules"); };

  return <div className="space-y-8">
    <nav aria-label="Guide sections" className="flex flex-wrap gap-x-6 gap-y-2 border-b pb-4 text-sm">
      <a href="#occurrence-rules" className="underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Find a rule</a>
      <a href="#disciplinary-steps" className="underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Disciplinary steps</a>
      <a href="#how-counting-works" className="underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">How counting works</a>
      {clientErrorLevels.length > 0 && <a href="#client-error-matrix" className="underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Client error matrix</a>}
      <a href="#policy-grids" className="underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">View policy grid images</a>
    </nav>
    <div className="grid items-start gap-10 xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-12">
      <section id="occurrence-rules" aria-labelledby="rules-heading" className="min-w-0 scroll-mt-6">
        <div className="space-y-2">
          <h2 id="rules-heading" className="text-lg font-semibold">Find a rule</h2>
          <p className="text-sm text-muted-foreground">Occurrence values and consequences depend on severity. A first-time offence can still lead to more occurrences or stricter action; this applies to every offence.</p>
        </div>
        <div className="relative mt-5">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
          <Input aria-label="Search rules" type="search" placeholder="Search lateness, email, deadlines…" value={search} onChange={event => setSearch(event.target.value)} className="h-10 pl-9 pr-10 text-sm md:text-sm" />
          {search && <button type="button" aria-label="Clear search" onClick={() => setSearch("")} className="absolute right-2 top-2 rounded p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><X className="size-4" /></button>}
        </div>
        <div role="group" aria-label="Filter rules by category" className="mt-3 flex flex-wrap gap-2">
          {GUIDE_GROUPS.map(category => <button key={category} type="button" onClick={() => setGroup(category)} aria-pressed={group === category} className={`rounded-md px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${group === category ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"}`}>{category}</button>)}
        </div>
        <div className="mt-6 flex items-center justify-between gap-4 border-b pb-3 text-xs text-muted-foreground">
          <p role="status" aria-live="polite">{rules.length} {rules.length === 1 ? "rule" : "rules"}{group !== "All rules" ? ` in ${group.toLowerCase()}` : ""}</p>
          <span>Per incident</span>
        </div>
        {rules.length ? <ul className="divide-y">{rules.map(rule => <li key={rule.type} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1 py-5 sm:gap-x-8">
          <h3 className="text-sm font-medium leading-6">{rule.type === "Other" ? "Other policy issue" : rule.type}</h3>
          <div className="row-span-3 pt-0.5 text-right text-sm font-semibold tabular-nums">
            <span>{rule.points}</span><span className="mt-0.5 block text-xs font-normal text-muted-foreground">{rule.points === 1 ? "occurrence" : "occurrences"}</span>
          </div>
          <p className="max-w-prose text-sm leading-6 text-muted-foreground">{rule.description}</p>
          {rule.note && <p className={`mt-1 max-w-prose text-xs leading-5 ${rule.type === "Insubordination" ? "font-medium text-destructive" : "text-muted-foreground"}`}>{rule.note}</p>}
        </li>)}</ul> : <div className="space-y-3 py-12 text-center"><p className="font-medium">No matching rules</p><p className="text-sm text-muted-foreground">Try another word or choose a different category.</p><Button variant="outline" onClick={clearFilters}>Clear search and filters</Button></div>}
      </section>
      <aside id="disciplinary-steps" aria-labelledby="steps-heading" className="scroll-mt-6 border-t pt-6 xl:sticky xl:top-6 xl:border-l xl:border-t-0 xl:pl-8 xl:pt-0">
        <h2 id="steps-heading" className="text-lg font-semibold">Disciplinary steps</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Effective 29 October 2026. Verified occurrences add up over a rolling six-month window. The highest applicable step is recommended for review.</p>
        <ol className="mt-5 divide-y">{steps.map(step => <li key={step.step} className="flex gap-4 py-4"><span className="w-7 shrink-0 text-lg font-semibold tabular-nums">{step.threshold}</span><div><p className="text-sm font-medium">{step.label}</p><p className="mt-1 text-xs text-muted-foreground">Step {step.step} · from {step.threshold} occurrences</p></div></li>)}</ol>
        <p className="mt-4 text-xs leading-5 text-muted-foreground">Step 9 is a review for possible termination after further substantiated misconduct, with formal investigation and HR review. Deliberate insubordination may be considered at Step 5 or higher following review.</p>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">Reaching a previously actioned threshold again is flagged for review and does not automatically increase punishment.</p>
      </aside>
    </div>
    {clientErrorLevels.length > 0 && <section id="client-error-matrix" className="scroll-mt-6 space-y-4 border-t pt-6"><h2 className="text-lg font-semibold">Client information and processing errors</h2><p className="max-w-prose text-sm text-muted-foreground">Levels guide the response, but severity and client impact determine the outcome. Even a first-time mistake may lead to a higher occurrence value or stricter action.</p><ol className="divide-y">{clientErrorLevels.map(level => <li key={level.level} className="space-y-1 py-4"><h3 className="text-sm font-medium">Level {level.level}: {level.label}</h3><p className="text-sm text-muted-foreground">{level.action}</p></li>)}</ol></section>}
    <section id="how-counting-works" aria-labelledby="counting-heading" className="scroll-mt-6 space-y-4 border-t pt-6">
      <h2 id="counting-heading" className="text-lg font-semibold">How counting works</h2>
      <dl className="grid gap-4 text-sm md:grid-cols-3">
        <div><dt className="font-medium">Occurrence totals</dt><dd className="mt-1 leading-5 text-muted-foreground">Two half-occurrences make one. Only verified incidents count; related offenses from one event are not double-counted.</dd></div>
        <div><dt className="font-medium">Review</dt><dd className="mt-1 leading-5 text-muted-foreground">Pending queries do not count. Evidence and a documented decision are required; severity can affect consequences from the first incident.</dd></div>
        <div><dt className="font-medium">Disciplinary window</dt><dd className="mt-1 leading-5 text-muted-foreground">Steps run through 28 occurrences in a rolling six-month window. Suspensions add payroll days, not occurrences.</dd></div>
      </dl>
      <div className="space-y-2 rounded-md border p-4 text-sm">
        <h3 className="font-medium">Attendance deductions</h3>
        <ul className="list-disc space-y-1 pl-5 leading-5 text-muted-foreground">
          <li><span className="font-medium text-foreground">Lateness:</span> one day from the third unauthorized late day each month.</li>
          <li><span className="font-medium text-foreground">Clock records:</span> half a day per missing clock-in or clock-out, from its third occurrence.</li>
          <li><span className="font-medium text-foreground">To-do lists and reports:</span> tracked separately; warnings for the first two misses, half a day from the third.</li>
          <li>Report missing records promptly. HR checks valid exceptions and errors; HR reviews deductions, Compliance approves them, and payslips are sent before payment.</li>
        </ul>
      </div>
    </section>
    <section id="policy-grids" aria-labelledby="policy-grids-heading" className="scroll-mt-6 space-y-5 border-t pt-6">
      <div className="space-y-2">
        <h2 id="policy-grids-heading" className="text-lg font-semibold">Policy grid images</h2>
        <p className="max-w-prose text-sm leading-6 text-muted-foreground">Reference copies of the disciplinary, attendance and recurring-issues grids.</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {[
          { src: "/compliance-sanction-grid.jpeg", alt: "Employee disciplinary sanction grid with occurrence classifications and thresholds through 28 occurrences", title: "Employee disciplinary sanction grid" },
          { src: "/compliance-other-sanction-grid.jpeg", alt: "Other sanction grid for lateness, missed to-do lists, end-of-day reports and clock records", title: "Attendance, to-do lists and end-of-day reporting" },
          { src: "/compliance-recurring-issues.jpeg", alt: "Recurring issues monthly analysis and corrective action monitoring process", title: "Recurring issues monthly analysis" },
        ].map(grid => <figure key={grid.src} className="min-w-0 space-y-2 rounded-lg border p-3 sm:p-4">
          <figcaption className="text-sm font-medium">{grid.title}</figcaption>
          <a href={grid.src} target="_blank" rel="noreferrer" aria-label={`Open full-size image: ${grid.title}`} className="block overflow-hidden rounded-md bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Image src={grid.src} alt={grid.alt} width={1280} height={960} unoptimized className="h-auto max-h-[28rem] w-full object-contain" />
          </a>
          <p className="text-xs text-muted-foreground">Select to view full size</p>
        </figure>)}
      </div>
    </section>
  </div>;
}
