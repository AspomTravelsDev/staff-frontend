export function isSuspensionOutcome(outcome: string) {
  return outcome.toLowerCase().includes("suspension");
}

export function defaultSuspensionDays(outcome: string) {
  return ({ "One-day Suspension": "1", "Three-day Suspension": "3", "One-week Suspension": "5", "Two-week Suspension": "10" } as Record<string, string>)[outcome] ?? "";
}

export function complianceOutcomeAmounts(outcome: string, points: number, suspensionDays: number) {
  if (outcome === "Resolved (No Action)") return { points: 0, deductionDays: 0 };
  if (!isSuspensionOutcome(outcome)) return { points, deductionDays: 0 };
  const fixedDays = outcome === "One-day Suspension" ? 1 : outcome === "Three-day Suspension" ? 3 : suspensionDays;
  return { points: 0, deductionDays: fixedDays };
}
