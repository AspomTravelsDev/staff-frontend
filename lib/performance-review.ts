import type { ReviewSummary } from "./types/performance-review";
import type { AppraisalAnswer } from "./types/performance-appraisal";

export function formatPerformanceMonth(value: string): string {
  const [year, month] = value.split("-").map(Number);
  if (!year || !month || month < 1 || month > 12) return value;
  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" })
    .format(new Date(Date.UTC(year, month - 1, 1)));
}

export function formatPerformancePeriodLabel(
  type: "monthly_kpi" | "appraisal",
  month: string,
): string {
  const [year, monthNumber] = month.split("-").map(Number);
  if (type === "appraisal" && year && monthNumber === 6) return `Jan–Jun ${year}`;
  if (type === "appraisal" && year && monthNumber === 12) return `Jul–Dec ${year}`;
  return formatPerformanceMonth(month);
}

export function formatPerformanceDate(value: string): string {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function reviewStageLabel(
  review: Pick<ReviewSummary, "reviewer_route" | "type"> & {
    stage: ReviewSummary["stage"];
    is_assigned?: boolean;
    status?: ReviewSummary["status"];
  },
): string {
  if (review.is_assigned === false || !review.stage) {
    return review.status === "completed" ? "Completed appraisal result" : "Appraisal review";
  }
  const labels = { reviewer: review.reviewer_route === "compliance" ? "Compliance assessment" : "Supervisor assessment", supervisor: review.type === "appraisal" ? "Supervisor assessment" : "Supervisor review", hr: "HR review", compliance: review.type === "appraisal" ? "Compliance assessment" : "Compliance review", mp: review.type === "appraisal" ? "Management assessment" : "MP assessment" };
  return labels[review.stage];
}

export function reviewStatusLabel(review: ReviewSummary): string {
  if (review.status === "completed") return "Completed";
  if (review.assessment_status === "submitted") return "Review submitted";
  if (review.can_review) return review.assessment_status === "draft" ? "Draft saved" : "Ready for your review";
  const currentStage = review.current_stage ?? (review.stage === "mp" && review.status === "awaiting_reviewer" ? "reviewer" : null);
  if (currentStage && currentStage !== review.stage) {
    const currentLabel =
      currentStage === "reviewer"
        ? review.reviewer_route === "compliance"
          ? "Compliance"
          : "supervisor"
        : currentStage === "hr"
          ? "HR"
          : currentStage === "compliance"
            ? "Compliance"
            : currentStage === "mp"
              ? review.type === "appraisal"
                ? "management"
                : "MP"
              : currentStage;
    return `Waiting for ${currentLabel}`;
  }
  return "Submission closed";
}

export function previewReviewMean(answers: AppraisalAnswer[]): string | null {
  return answers.length && answers.every((answer) => answer.rating !== null)
    ? (answers.reduce((sum, answer) => sum + (answer.rating ?? 0), 0) / answers.length).toFixed(2) : null;
}

export interface AppraisalCycleWindowInfo {
  targetMonth: string;
  cycleLabel: string;
  earlyOpenMonthLabel: "May" | "November";
  canOpenNow: boolean;
  defaultDeadline: string;
}

export function getAppraisalCycleWindowInfo(now: Date = new Date()): AppraisalCycleWindowInfo {
  const year = now.getUTCFullYear();
  const monthNumber = now.getUTCMonth() + 1;
  const isFirstHalf = monthNumber <= 6;
  const targetMonth = `${year}-${isFirstHalf ? "06" : "12"}`;
  const cycleLabel = `${isFirstHalf ? "June" : "December"} ${year}`;
  const earlyOpenMonthLabel = isFirstHalf ? "May" : "November";
  const canOpenNow = monthNumber === 5 || monthNumber === 6 || monthNumber === 11 || monthNumber === 12;
  const defaultDeadline = `${year}-${isFirstHalf ? "06-30" : "12-31"}`;
  return { targetMonth, cycleLabel, earlyOpenMonthLabel, canOpenNow, defaultDeadline };
}

function formatUtcDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function defaultDeadlineForPeriod(
  type: "monthly_kpi" | "appraisal",
  month: string,
  now: Date = new Date(),
): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const endOfCurrentMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));

  if (!year || !monthNumber || monthNumber < 1 || monthNumber > 12) {
    return formatUtcDate(endOfCurrentMonth);
  }

  const candidate =
    type === "appraisal"
      ? new Date(Date.UTC(year, monthNumber, 0))
      : new Date(Date.UTC(year, monthNumber, 25));

  return formatUtcDate(candidate < todayUtc ? endOfCurrentMonth : candidate);
}

export function buildSelectablePeriodMonths(
  type: "monthly_kpi" | "appraisal",
  existingMonths: string[] = [],
  now: Date = new Date(),
): string[] {
  const year = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth() + 1;
  const candidates = new Set<string>();

  for (const month of existingMonths) {
    if (/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      candidates.add(month);
    }
  }

  if (type === "appraisal") {
    candidates.add(`${year}-06`);
    candidates.add(`${year}-12`);
    candidates.add(`${year + 1}-06`);
    candidates.add(`${year + 1}-12`);
    return Array.from(candidates).sort((a, b) => b.localeCompare(a));
  }

  for (let m = currentMonth; m <= 12; m += 1) {
    candidates.add(`${year}-${String(m).padStart(2, "0")}`);
  }
  for (let m = 1; m <= 6; m += 1) {
    candidates.add(`${year + 1}-${String(m).padStart(2, "0")}`);
  }

  return Array.from(candidates).sort((a, b) => b.localeCompare(a));
}
