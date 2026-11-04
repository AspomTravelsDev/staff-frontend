"use client";

import { useState } from "react";
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
    </nav>
    <div className="grid items-start gap-10 xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-12">
      <section id="occurrence-rules" aria-labelledby="rules-heading" className="min-w-0 scroll-mt-6">
        <div className="space-y-2">
          <h2 id="rules-heading" className="text-lg font-semibold">Find a rule</h2>
          <p className="text-sm text-muted-foreground">Check what counts and the base value for each incident.</p>
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
    {clientErrorLevels.length > 0 && <section id="client-error-matrix" className="scroll-mt-6 space-y-4 border-t pt-6"><h2 className="text-lg font-semibold">Client information and processing errors</h2><p className="max-w-prose text-sm text-muted-foreground">Correct the error, document the circumstances and assess client impact. An accidental mistake does not automatically become misconduct.</p><ol className="divide-y">{clientErrorLevels.map(level => <li key={level.level} className="space-y-1 py-4"><h3 className="text-sm font-medium">Level {level.level}: {level.label}</h3><p className="text-sm text-muted-foreground">{level.action}</p></li>)}</ol></section>}
    <section id="how-counting-works" aria-labelledby="counting-heading" className="scroll-mt-6 space-y-4 border-t pt-6">
      <h2 id="counting-heading" className="text-lg font-semibold">How counting works</h2>
      <dl className="grid gap-6 text-sm md:grid-cols-3">
        <div><dt className="font-medium">Two halves make one</dt><dd className="mt-2 leading-6 text-muted-foreground">Two incidents worth 0.5 each add up to 1 occurrence. Incident counts and occurrence totals can be different.</dd></div>
        <div><dt className="font-medium">Only confirmed incidents count</dt><dd className="mt-2 leading-6 text-muted-foreground">A pending query does not add to your total. Evidence and a recorded reviewer decision are required before an occurrence is confirmed.</dd></div>
        <div><dt className="font-medium">One charge per incident</dt><dd className="mt-2 leading-6 text-muted-foreground">Related offenses should not be charged twice for the same event. Impact-based changes must be explained in the reviewer decision.</dd></div>
      </dl>
      <p className="max-w-prose text-xs leading-5 text-muted-foreground">Every 8 accumulated confirmed occurrences converts to 1 payroll deduction day; unused points carry forward. A suspension adds its working days to payroll and adds no occurrences. The rolling six-month total above is used for disciplinary recommendations.</p>
    </section>
  </div>;
}
