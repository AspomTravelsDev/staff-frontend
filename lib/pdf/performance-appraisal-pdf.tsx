import {
  Document,
  Image as PdfImage,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from "@react-pdf/renderer";
import {
  formatPerformanceDate,
  formatPerformancePeriodLabel,
} from "@/lib/performance-review";
import {
  appraisalRatingScale,
  formatAppraisalTime,
} from "@/lib/performance-self-assessment";
import type {
  AppraisalAssessment,
  AppraisalType,
  PerformanceAppraisal,
} from "@/lib/types/performance-appraisal";
import type { PeriodCriterion, ReviewerRoute } from "@/lib/types/performance-period";
import type { PerformanceResultDetail } from "@/lib/types/performance-result";
import type { ReviewDetail } from "@/lib/types/performance-review";

export type AppraisalPdfSource =
  | ReviewDetail
  | PerformanceAppraisal
  | PerformanceResultDetail;

export interface NormalizedAppraisalPdfData {
  id: string;
  employee_name: string;
  employee_staff_id: string;
  department: string;
  is_supervisor: boolean;
  type: AppraisalType;
  month: string;
  period_label: string;
  submission_deadline: string | null;
  reviewer_route: ReviewerRoute;
  reviewer_name: string | null;
  hr_reviewer_name: string | null;
  compliance_reviewer_name: string | null;
  mp_reviewer_name: string;
  final_score: number | null;
  total_score: number | null;
  total_max_score: number | null;
  completed_at: string | null;
  criteria: PeriodCriterion[];
  assessments: AppraisalAssessment[];
}

const STAGE_ORDER: Record<AppraisalAssessment["stage"], number> = {
  self: 0,
  supervisor: 1,
  reviewer: 1,
  hr: 2,
  compliance: 3,
  mp: 4,
};

const APPRAISAL_BANDS = [
  { min: 4.5, label: "Exceptional (>90% achievement)" },
  { min: 4.0, label: "Exceeded Expectations (81–90% achievement)" },
  { min: 3.5, label: "Satisfactory (70–80% achievement)" },
  { min: 2.5, label: "Requires Improvement (50–69% achievement)" },
  { min: 0, label: "Unsatisfactory (<50% achievement)" },
];

const SCALE_LEGEND = [
  "1 · Unsatisfactory (<50%)",
  "2 · Requires improvement (50–69%)",
  "3 · Satisfactory (70–80%)",
  "4 · Exceeded expectations (81–90%)",
  "5 · Exceptional (>90%)",
];

const SECTION_COMMENT_LABELS: Record<string, string> = {
  job_achievements: "Job Achievements",
  initiatives_achieved: "Initiatives Achieved",
  improvement_areas: "Improvement Areas",
  recommendation: "Suggestion / Recommendation",
  justification: "Justification",
  management_comment: "Management Comment",
};

export function performanceBandForScore(
  score: number | null,
  type: AppraisalType,
): string {
  if (score === null || Number.isNaN(score)) return "Pending Final Score";
  if (type === "appraisal") {
    const band = APPRAISAL_BANDS.find((item) => score >= item.min);
    return band ? band.label : "Unsatisfactory (<50% achievement)";
  }
  const rounded = Math.min(5, Math.max(1, Math.round(score))) as 1 | 2 | 3 | 4 | 5;
  return (
    appraisalRatingScale.find((item) => item.value === rounded)?.label ??
    "Meets expectations"
  );
}

export function normalizeAppraisalForPdf(
  source: AppraisalPdfSource,
): NormalizedAppraisalPdfData {
  const rawAssessments: AppraisalAssessment[] = [];

  if ("assessments" in source && Array.isArray(source.assessments)) {
    rawAssessments.push(...source.assessments);
  }
  if ("self_assessment" in source && source.self_assessment) {
    rawAssessments.push(source.self_assessment);
  }
  if ("submitted_feedback" in source && Array.isArray(source.submitted_feedback)) {
    rawAssessments.push(...source.submitted_feedback);
  }
  if ("preceding_assessments" in source && Array.isArray(source.preceding_assessments)) {
    rawAssessments.push(...source.preceding_assessments);
  }
  if ("assessment" in source && source.assessment) {
    rawAssessments.push(source.assessment);
  }

  const byStage = new Map<string, AppraisalAssessment>();
  for (const assessment of rawAssessments) {
    if (!assessment) continue;
    const existing = byStage.get(assessment.stage);
    if (!existing || assessment.status === "submitted") {
      byStage.set(assessment.stage, assessment);
    }
  }

  const assessments = Array.from(byStage.values()).sort(
    (a, b) => (STAGE_ORDER[a.stage] ?? 9) - (STAGE_ORDER[b.stage] ?? 9),
  );

  const mpAssessment = assessments.find((a) => a.stage === "mp");
  const selfAssessment = assessments.find((a) => a.stage === "self");
  const scoreSource = source.type === "appraisal" ? mpAssessment : selfAssessment;

  const scoreRatings =
    scoreSource?.answers.flatMap((a) => (a.rating === null ? [] : [a.rating])) ??
    [];
  const computedTotal = scoreRatings.length
    ? scoreRatings.reduce((sum, r) => sum + r, 0)
    : null;
  const computedAvg = scoreRatings.length
    ? computedTotal! / scoreRatings.length
    : null;

  const parsedFinalScore =
    source.final_score !== null && source.final_score !== undefined
      ? Number(source.final_score)
      : computedAvg;

  const completedAt =
    ("completed_at" in source && source.completed_at) ||
    mpAssessment?.submitted_at ||
    null;

  return {
    id: source.id,
    employee_name: source.employee_name,
    employee_staff_id: source.employee_staff_id,
    department: source.department,
    is_supervisor: "is_supervisor" in source ? Boolean(source.is_supervisor) : false,
    type: source.type,
    month: source.month,
    period_label: formatPerformancePeriodLabel(source.type, source.month),
    submission_deadline:
      "submission_deadline" in source ? source.submission_deadline : null,
    reviewer_route: source.reviewer_route,
    reviewer_name: source.reviewer_name,
    hr_reviewer_name: source.hr_reviewer_name,
    compliance_reviewer_name: source.compliance_reviewer_name,
    mp_reviewer_name: source.mp_reviewer_name,
    final_score:
      parsedFinalScore !== null && !Number.isNaN(parsedFinalScore)
        ? parsedFinalScore
        : null,
    total_score:
      source.total_score ??
      (source.type === "appraisal" ? computedTotal : null),
    total_max_score:
      source.total_max_score ??
      (source.type === "appraisal" ? source.criteria.length * 5 : null),
    completed_at: completedAt,
    criteria: source.criteria,
    assessments,
  };
}

function stageTitle(
  stage: AppraisalAssessment["stage"],
  data: NormalizedAppraisalPdfData,
): string {
  if (stage === "self") return "Staff Self-Assessment";
  if (stage === "supervisor") return "Supervisor Assessment";
  if (stage === "hr") return "HR Review";
  if (stage === "compliance") return "Compliance Assessment";
  if (stage === "reviewer") {
    return data.reviewer_route === "compliance"
      ? "Compliance Assessment"
      : "Supervisor Assessment";
  }
  return data.type === "appraisal" ? "Management Final Review" : "MP Final Review";
}

function stageStats(assessment: AppraisalAssessment | undefined, maxCriteria: number) {
  const ratings =
    assessment?.answers.flatMap((a) => (a.rating === null ? [] : [a.rating])) ?? [];
  const total = ratings.reduce((sum, r) => sum + r, 0);
  const average = ratings.length ? total / ratings.length : null;
  return {
    ratedCount: ratings.length,
    total,
    maxPoints: maxCriteria * 5,
    average,
  };
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 88,
    paddingBottom: 50,
    paddingHorizontal: 36,
    fontFamily: "Helvetica",
    fontSize: 10.5,
    color: "#0f172a",
  },
  header: {
    position: "absolute",
    top: 22,
    left: 36,
    right: 36,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 2,
    borderBottomColor: "#15803d",
    paddingBottom: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 76,
    height: 34,
    objectFit: "contain",
    marginRight: 12,
  },
  companyName: {
    fontSize: 13.5,
    fontFamily: "Helvetica-Bold",
    color: "#15803d",
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  docTypeLabel: {
    fontSize: 9.5,
    color: "#475569",
  },
  headerRight: {
    alignItems: "flex-end",
  },
  statusPill: {
    backgroundColor: "#dcfce7",
    color: "#166534",
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    paddingVertical: 3.5,
    paddingHorizontal: 9,
    borderRadius: 4,
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  cycleSubtext: {
    fontSize: 9,
    color: "#64748b",
  },
  heroTitleBlock: {
    marginBottom: 12,
  },
  employeeTitle: {
    fontSize: 19,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    marginBottom: 4,
  },
  employeeSubline: {
    fontSize: 10.5,
    color: "#475569",
  },
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 6,
    padding: 12,
    marginBottom: 14,
  },
  metaCell: {
    width: "33.33%",
    paddingRight: 10,
    marginBottom: 8,
  },
  metaLabel: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 3,
  },
  metaValue: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  metaChainRow: {
    width: "100%",
    marginTop: 2,
    paddingTop: 6,
    borderTopWidth: 0.75,
    borderTopColor: "#e2e8f0",
  },
  scoreBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#86efac",
    borderRadius: 6,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  scoreBannerLeft: {
    flex: 1,
    paddingRight: 16,
  },
  scoreBannerEyebrow: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#15803d",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 5,
  },
  scoreBannerBand: {
    fontSize: 14.5,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    marginBottom: 4,
  },
  scoreBannerCaption: {
    fontSize: 9.5,
    color: "#475569",
  },
  scoreBannerRight: {
    alignItems: "flex-end",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: 145,
  },
  scorePrimary: {
    fontSize: 21,
    fontFamily: "Helvetica-Bold",
    color: "#15803d",
    marginBottom: 5,
  },
  scoreSecondary: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#166534",
  },
  stageCardsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  stageCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#ffffff",
  },
  stageCardTitle: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: "#475569",
    marginBottom: 6,
  },
  stageCardScore: {
    fontSize: 15.5,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    marginBottom: 5,
  },
  stageCardMeta: {
    fontSize: 9,
    color: "#64748b",
  },
  sectionHeading: {
    fontSize: 12.5,
    fontFamily: "Helvetica-Bold",
    color: "#166534",
    marginTop: 12,
    marginBottom: 7,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
  },
  legendBar: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    backgroundColor: "#f8fafc",
    borderWidth: 0.75,
    borderColor: "#cbd5e1",
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 9,
  },
  legendItem: {
    fontSize: 8.5,
    color: "#334155",
  },
  table: {
    borderWidth: 0.75,
    borderColor: "#cbd5e1",
    borderRadius: 5,
    marginBottom: 14,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderBottomWidth: 0.75,
    borderBottomColor: "#94a3b8",
    paddingVertical: 6.5,
    paddingHorizontal: 8,
    fontFamily: "Helvetica-Bold",
    fontSize: 9.5,
    color: "#0f172a",
  },
  kraGroupRow: {
    flexDirection: "row",
    backgroundColor: "#ecfdf5",
    borderBottomWidth: 0.5,
    borderBottomColor: "#a7f3d0",
    paddingVertical: 5.5,
    paddingHorizontal: 8,
    fontFamily: "Helvetica-Bold",
    fontSize: 9.5,
    color: "#065f46",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontSize: 9.5,
    alignItems: "flex-start",
  },
  tableRowAlt: {
    backgroundColor: "#fcfcfd",
  },
  colNum: { width: "6%", color: "#64748b" },
  colCriterion: { width: "52%", paddingRight: 8, lineHeight: 1.35 },
  colScore: { width: "14%", textAlign: "center", fontFamily: "Helvetica-Bold" },
  colKpiTarget: { width: "36%", paddingRight: 8, fontSize: 9, color: "#334155", lineHeight: 1.35 },
  colKpiScore: { width: "12%", textAlign: "center", fontFamily: "Helvetica-Bold" },
  kraColName: { width: "34%", fontFamily: "Helvetica-Bold" },
  kraColCount: { width: "14%", textAlign: "center" },
  kraColAvg: { width: "17.33%", textAlign: "center" },
  commentCard: {
    borderWidth: 0.75,
    borderColor: "#cbd5e1",
    borderRadius: 6,
    padding: 11,
    marginBottom: 9,
    backgroundColor: "#ffffff",
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 5,
    marginBottom: 7,
  },
  commentStageTitle: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    color: "#15803d",
  },
  commentTimestamp: {
    fontSize: 8.5,
    color: "#64748b",
  },
  commentSectionBlock: {
    marginBottom: 6,
  },
  commentSectionLabel: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: "#334155",
    marginBottom: 2,
  },
  commentSectionBody: {
    fontSize: 10,
    color: "#0f172a",
    lineHeight: 1.45,
  },
  signOffRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  signOffBox: {
    flex: 1,
    borderWidth: 0.75,
    borderColor: "#cbd5e1",
    borderRadius: 5,
    padding: 10,
    backgroundColor: "#f8fafc",
  },
  signOffRole: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 3,
  },
  signOffName: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    marginBottom: 3,
  },
  signOffDate: {
    fontSize: 8.5,
    color: "#15803d",
  },
  footer: {
    position: "absolute",
    bottom: 18,
    left: 36,
    right: 36,
    borderTopWidth: 0.5,
    borderTopColor: "#cbd5e1",
    paddingTop: 5,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8.5,
    color: "#64748b",
  },
});

export function PerformanceAppraisalPdfDocument({
  data,
  logoSource,
}: {
  data: NormalizedAppraisalPdfData;
  logoSource?: string;
}) {
  const isStructured = data.type === "appraisal";
  const selfAssessment = data.assessments.find((a) => a.stage === "self");
  const intermediateAssessment = data.assessments.find(
    (a) =>
      a.stage === "supervisor" ||
      a.stage === "compliance" ||
      a.stage === "reviewer",
  );
  const mpAssessment = data.assessments.find((a) => a.stage === "mp");

  const intermediateColLabel =
    data.reviewer_route === "compliance" ||
    intermediateAssessment?.stage === "compliance"
      ? "Compliance"
      : "Supervisor";
  const showIntermediateCol =
    isStructured &&
    (data.reviewer_route !== "direct_mp" || Boolean(intermediateAssessment));

  const selfStats = stageStats(selfAssessment, data.criteria.length);
  const intermediateStats = stageStats(
    intermediateAssessment,
    data.criteria.length,
  );
  const mpStats = stageStats(mpAssessment, data.criteria.length);

  // Build Key Result Area groups for Bi-Yearly Appraisals
  const kraGroups: {
    area: string;
    items: { criterion: PeriodCriterion; index: number }[];
    selfAvg: number | null;
    intermediateAvg: number | null;
    mpAvg: number | null;
  }[] = [];

  if (isStructured) {
    const groupMap = new Map<
      string,
      { criterion: PeriodCriterion; index: number }[]
    >();
    data.criteria.forEach((criterion, idx) => {
      const area = criterion.key_result_area || "General Performance";
      const list = groupMap.get(area) ?? [];
      list.push({ criterion, index: idx + 1 });
      groupMap.set(area, list);
    });

    for (const [area, items] of groupMap.entries()) {
      const avgFor = (assessment: AppraisalAssessment | undefined) => {
        if (!assessment) return null;
        const ratings = items
          .map(
            ({ criterion }) =>
              assessment.answers.find((a) => a.criterion_id === criterion.id)
                ?.rating ?? null,
          )
          .filter((r): r is NonNullable<typeof r> => r !== null);
        return ratings.length
          ? ratings.reduce((s, r) => s + r, 0) / ratings.length
          : null;
      };
      kraGroups.push({
        area,
        items,
        selfAvg: avgFor(selfAssessment),
        intermediateAvg: avgFor(intermediateAssessment),
        mpAvg: avgFor(mpAssessment),
      });
    }
  }

  const reviewChainLabel = (
    isStructured
      ? [
          data.employee_name,
          data.reviewer_route === "direct_mp"
            ? null
            : data.reviewer_route === "compliance"
              ? (data.compliance_reviewer_name ?? data.reviewer_name)
              : data.reviewer_name,
          data.mp_reviewer_name,
        ]
      : [
          data.employee_name,
          data.reviewer_name,
          data.hr_reviewer_name,
          data.compliance_reviewer_name,
          data.mp_reviewer_name,
        ]
  )
    .filter(Boolean)
    .join("  ->  ");

  const percentage =
    data.total_score !== null &&
    data.total_max_score !== null &&
    data.total_max_score > 0
      ? Math.round((data.total_score / data.total_max_score) * 100)
      : data.final_score !== null
        ? Math.round((data.final_score / 5) * 100)
        : null;

  return (
    <Document
      title={`${isStructured ? "Bi-Yearly Appraisal" : "Monthly KPI Appraisal"} - ${data.employee_name} (${data.period_label})`}
      author="Aspom Travels HR"
    >
      <Page size="A4" style={styles.page} wrap>
        {/* Fixed Header */}
        <View style={styles.header} fixed>
          <View style={styles.headerLeft}>
            {logoSource ? <PdfImage src={logoSource} style={styles.logo} /> : null}
            <View>
              <Text style={styles.companyName}>ASPOM TRAVELS</Text>
              <Text style={styles.docTypeLabel}>
                {isStructured
                  ? "Bi-Yearly Performance Appraisal Report"
                  : "Monthly KPI Performance Appraisal Report"}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.statusPill}>COMPLETED RECORD</Text>
            <Text style={styles.cycleSubtext}>
              Cycle: {data.period_label} · Staff ID: {data.employee_staff_id}
            </Text>
          </View>
        </View>

        {/* Employee Heading */}
        <View style={styles.heroTitleBlock} wrap={false}>
          <Text style={styles.employeeTitle}>{data.employee_name}</Text>
          <Text style={styles.employeeSubline}>
            {data.department} Department
            {data.is_supervisor ? " · Department Supervisor" : ""} ·{" "}
            {isStructured ? "Bi-Yearly Appraisal" : "Monthly KPI Review"} (
            {data.period_label})
          </Text>
        </View>

        {/* Metadata Card */}
        <View style={styles.metaGrid} wrap={false}>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Staff Name & ID</Text>
            <Text style={styles.metaValue}>
              {data.employee_name} ({data.employee_staff_id})
            </Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Department</Text>
            <Text style={styles.metaValue}>{data.department}</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Appraisal Period</Text>
            <Text style={styles.metaValue}>{data.period_label}</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Submission Deadline</Text>
            <Text style={styles.metaValue}>
              {data.submission_deadline
                ? formatPerformanceDate(data.submission_deadline)
                : "—"}
            </Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Date Completed</Text>
            <Text style={styles.metaValue}>
              {data.completed_at ? formatAppraisalTime(data.completed_at) : "Completed"}
            </Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Final Approver (MP)</Text>
            <Text style={styles.metaValue}>{data.mp_reviewer_name || "Management"}</Text>
          </View>
          <View style={styles.metaChainRow}>
            <Text style={styles.metaLabel}>Approval Chain</Text>
            <Text style={[styles.metaValue, { fontSize: 10 }]}>
              {reviewChainLabel}
            </Text>
          </View>
        </View>

        {/* Executive Score Summary Banner */}
        <View style={styles.scoreBanner} wrap={false}>
          <View style={styles.scoreBannerLeft}>
            <Text style={styles.scoreBannerEyebrow}>
              Official Final Outcome{" "}
              {isStructured ? "(Management Assessment)" : "(Verified KPI Score)"}
            </Text>
            <Text style={styles.scoreBannerBand}>
              {performanceBandForScore(data.final_score, data.type)}
            </Text>
            <Text style={styles.scoreBannerCaption}>
              Evaluated across {data.criteria.length}{" "}
              {isStructured
                ? "standard performance indicators in 10 Key Result Areas."
                : "assigned departmental KPIs."}
            </Text>
          </View>
          <View style={styles.scoreBannerRight}>
            <Text style={styles.scorePrimary}>
              {data.final_score !== null
                ? `${data.final_score.toFixed(2)} / 5.00`
                : "—"}
            </Text>
            {isStructured &&
              data.total_score !== null &&
              data.total_max_score !== null && (
                <Text style={styles.scoreSecondary}>
                  Total: {data.total_score} / {data.total_max_score} pts
                  {percentage !== null ? ` (${percentage}%)` : ""}
                </Text>
              )}
          </View>
        </View>

        {/* Stage Comparison Cards */}
        {isStructured && (
          <View style={styles.stageCardsRow} wrap={false}>
            <View style={styles.stageCard}>
              <Text style={styles.stageCardTitle}>Staff Self-Assessment</Text>
              <Text style={styles.stageCardScore}>
                {selfStats.average !== null
                  ? `${selfStats.average.toFixed(2)} / 5`
                  : "—"}
              </Text>
              <Text style={styles.stageCardMeta}>
                {selfStats.total} / {selfStats.maxPoints} pts · {data.employee_name}
              </Text>
            </View>
            {showIntermediateCol && (
              <View style={styles.stageCard}>
                <Text style={styles.stageCardTitle}>
                  {intermediateColLabel} Review
                </Text>
                <Text style={styles.stageCardScore}>
                  {intermediateStats.average !== null
                    ? `${intermediateStats.average.toFixed(2)} / 5`
                    : "—"}
                </Text>
                <Text style={styles.stageCardMeta}>
                  {intermediateStats.total} / {intermediateStats.maxPoints} pts ·{" "}
                  {intermediateAssessment?.assessor_name ||
                    (intermediateColLabel === "Compliance"
                      ? data.compliance_reviewer_name
                      : data.reviewer_name) ||
                    intermediateColLabel}
                </Text>
              </View>
            )}
            <View
              style={[
                styles.stageCard,
                { borderColor: "#86efac", backgroundColor: "#f0fdf4" },
              ]}
            >
              <Text style={[styles.stageCardTitle, { color: "#166534" }]}>
                Management Final Score
              </Text>
              <Text style={[styles.stageCardScore, { color: "#15803d" }]}>
                {mpStats.average !== null
                  ? `${mpStats.average.toFixed(2)} / 5`
                  : data.final_score !== null
                    ? `${data.final_score.toFixed(2)} / 5`
                    : "—"}
              </Text>
              <Text style={styles.stageCardMeta}>
                {data.total_score ?? mpStats.total} /{" "}
                {data.total_max_score ?? mpStats.maxPoints} pts ·{" "}
                {mpAssessment?.assessor_name || data.mp_reviewer_name}
              </Text>
            </View>
          </View>
        )}

        {/* Key Result Area Executive Breakdown (Bi-Yearly Appraisal) */}
        {isStructured && kraGroups.length > 0 && (
          <View wrap={false}>
            <Text style={styles.sectionHeading}>
              Summary by Key Result Area (10 Core Areas)
            </Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.kraColName}>Key Result Area</Text>
                <Text style={styles.kraColCount}>Indicators</Text>
                <Text style={styles.kraColAvg}>Staff Avg</Text>
                {showIntermediateCol && (
                  <Text style={styles.kraColAvg}>{intermediateColLabel} Avg</Text>
                )}
                <Text style={styles.kraColAvg}>Management Avg</Text>
              </View>
              {kraGroups.map((group, idx) => (
                <View
                  key={group.area}
                  style={[
                    styles.tableRow,
                    idx % 2 === 1 ? styles.tableRowAlt : {},
                  ]}
                >
                  <Text style={styles.kraColName}>{group.area}</Text>
                  <Text style={styles.kraColCount}>{group.items.length}</Text>
                  <Text style={styles.kraColAvg}>
                    {group.selfAvg !== null ? `${group.selfAvg.toFixed(2)} / 5` : "—"}
                  </Text>
                  {showIntermediateCol && (
                    <Text style={styles.kraColAvg}>
                      {group.intermediateAvg !== null
                        ? `${group.intermediateAvg.toFixed(2)} / 5`
                        : "—"}
                    </Text>
                  )}
                  <Text
                    style={[
                      styles.kraColAvg,
                      { fontFamily: "Helvetica-Bold", color: "#15803d" },
                    ]}
                  >
                    {group.mpAvg !== null ? `${group.mpAvg.toFixed(2)} / 5` : "—"}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Qualitative Comments & Reflections */}
        <Text style={styles.sectionHeading} minPresenceAhead={60}>
          Qualitative Reflections, Reviewer Feedback & Recommendations
        </Text>
        {data.assessments.map((assessment) => {
          const sections = Object.entries(assessment.section_comments ?? {}).filter(
            ([, val]) => Boolean(val && val.trim()),
          );
          const hasOverallComment = Boolean(
            assessment.comment && assessment.comment.trim(),
          );
          if (!sections.length && !hasOverallComment) return null;

          return (
            <View
              key={assessment.id}
              style={styles.commentCard}
              wrap={false}
            >
              <View style={styles.commentHeader}>
                <Text style={styles.commentStageTitle}>
                  {stageTitle(assessment.stage, data)} ·{" "}
                  {assessment.assessor_name ||
                    (assessment.stage === "self"
                      ? data.employee_name
                      : assessment.stage === "mp"
                        ? data.mp_reviewer_name
                        : "Reviewer")}
                </Text>
                <Text style={styles.commentTimestamp}>
                  {assessment.submitted_at
                    ? `Submitted ${formatAppraisalTime(assessment.submitted_at)}`
                    : ""}
                </Text>
              </View>
              {sections.map(([key, text]) => (
                <View key={key} style={styles.commentSectionBlock}>
                  <Text style={styles.commentSectionLabel}>
                    {SECTION_COMMENT_LABELS[key] ?? key}:
                  </Text>
                  <Text style={styles.commentSectionBody}>{text}</Text>
                </View>
              ))}
              {hasOverallComment && (
                <View style={styles.commentSectionBlock}>
                  <Text style={styles.commentSectionLabel}>Overall Comment:</Text>
                  <Text style={styles.commentSectionBody}>
                    {assessment.comment}
                  </Text>
                </View>
              )}
            </View>
          );
        })}

        {/* Detailed Criterion-by-Criterion Table */}
        <Text style={styles.sectionHeading} minPresenceAhead={80}>
          {isStructured
            ? `Detailed Indicator Ratings (${data.criteria.length} Criteria)`
            : `Assigned KPI Ratings (${data.criteria.length} KPIs)`}
        </Text>
        <View style={styles.legendBar} wrap={false}>
          {SCALE_LEGEND.map((item) => (
            <Text key={item} style={styles.legendItem}>
              {item}
            </Text>
          ))}
        </View>

        {isStructured ? (
          <View style={styles.table}>
            <View style={styles.tableHeader} fixed>
              <Text style={styles.colNum}>#</Text>
              <Text
                style={[
                  styles.colCriterion,
                  !showIntermediateCol ? { width: "66%" } : {},
                ]}
              >
                Key Result Area / Performance Indicator
              </Text>
              <Text style={styles.colScore}>Staff</Text>
              {showIntermediateCol && (
                <Text style={styles.colScore}>{intermediateColLabel}</Text>
              )}
              <Text style={styles.colScore}>Management</Text>
            </View>

            {kraGroups.map((group) => (
              <View key={group.area}>
                <View style={styles.kraGroupRow} wrap={false}>
                  <Text>
                    {group.area} ({group.items.length} indicators)
                  </Text>
                </View>
                {group.items.map(({ criterion, index }, rowIdx) => {
                  const selfRating = selfAssessment?.answers.find(
                    (a) => a.criterion_id === criterion.id,
                  )?.rating;
                  const interRating = intermediateAssessment?.answers.find(
                    (a) => a.criterion_id === criterion.id,
                  )?.rating;
                  const mpRating = mpAssessment?.answers.find(
                    (a) => a.criterion_id === criterion.id,
                  )?.rating;

                  return (
                    <View
                      key={criterion.id}
                      style={[
                        styles.tableRow,
                        rowIdx % 2 === 1 ? styles.tableRowAlt : {},
                      ]}
                      wrap={false}
                    >
                      <Text style={styles.colNum}>
                        {String(index).padStart(2, "0")}
                      </Text>
                      <Text
                        style={[
                          styles.colCriterion,
                          !showIntermediateCol ? { width: "66%" } : {},
                        ]}
                      >
                        {criterion.name}
                      </Text>
                      <Text style={styles.colScore}>
                        {selfRating !== null && selfRating !== undefined
                          ? `${selfRating} / 5`
                          : "—"}
                      </Text>
                      {showIntermediateCol && (
                        <Text style={styles.colScore}>
                          {interRating !== null && interRating !== undefined
                            ? `${interRating} / 5`
                            : "—"}
                        </Text>
                      )}
                      <Text style={[styles.colScore, { color: "#15803d" }]}>
                        {mpRating !== null && mpRating !== undefined
                          ? `${mpRating} / 5`
                          : "—"}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.table}>
            <View style={styles.tableHeader} fixed>
              <Text style={styles.colNum}>#</Text>
              <Text style={styles.colCriterion}>KPI & Staff Evidence</Text>
              <Text style={styles.colKpiTarget}>Target / Expectation</Text>
              <Text style={styles.colKpiScore}>Rating</Text>
            </View>
            {data.criteria.map((criterion, idx) => {
              const answer = selfAssessment?.answers.find(
                (a) => a.criterion_id === criterion.id,
              );
              return (
                <View
                  key={criterion.id}
                  style={[
                    styles.tableRow,
                    idx % 2 === 1 ? styles.tableRowAlt : {},
                  ]}
                  wrap={false}
                >
                  <Text style={styles.colNum}>
                    {String(idx + 1).padStart(2, "0")}
                  </Text>
                  <View style={styles.colCriterion}>
                    <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 2 }}>
                      {criterion.name}
                    </Text>
                    {criterion.description ? (
                      <Text style={{ fontSize: 8.5, color: "#475569", marginTop: 1 }}>
                        {criterion.description}
                      </Text>
                    ) : null}
                    {answer?.comment ? (
                      <Text style={{ fontSize: 9, color: "#0f172a", marginTop: 3 }}>
                        Evidence: {answer.comment}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={styles.colKpiTarget}>
                    {criterion.expectation}
                  </Text>
                  <Text style={[styles.colKpiScore, { color: "#15803d" }]}>
                    {answer?.rating !== null && answer?.rating !== undefined
                      ? `${answer.rating} / 5`
                      : "—"}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Digital Verification Sign-Off Block */}
        <View wrap={false}>
          <Text style={styles.sectionHeading}>
            Digital Submission & Approval Trail
          </Text>
          <View style={styles.signOffRow}>
            {data.assessments.map((assessment) => (
              <View key={assessment.id} style={styles.signOffBox}>
                <Text style={styles.signOffRole}>
                  {stageTitle(assessment.stage, data)}
                </Text>
                <Text style={styles.signOffName}>
                  {assessment.assessor_name ||
                    (assessment.stage === "self"
                      ? data.employee_name
                      : assessment.stage === "mp"
                        ? data.mp_reviewer_name
                        : "Assigned Reviewer")}
                </Text>
                <Text style={styles.signOffDate}>
                  {assessment.submitted_at
                    ? `Verified · ${formatAppraisalTime(assessment.submitted_at)}`
                    : "Submitted"}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Fixed Footer */}
        <View style={styles.footer} fixed>
          <Text>
            Aspom Travels · Confidential HR Performance Appraisal Record ·{" "}
            {data.employee_name} ({data.employee_staff_id})
          </Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}

export function buildAppraisalPdfFilename(
  data: Pick<
    NormalizedAppraisalPdfData,
    "employee_name" | "employee_staff_id" | "type" | "month"
  >,
): string {
  const safeName = data.employee_name
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const safeStaffId = (data.employee_staff_id || "Staff")
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "_");
  const prefix = data.type === "appraisal" ? "BiYearly_Appraisal" : "Monthly_KPI";
  return `${prefix}_${safeName}_${safeStaffId}_${data.month}.pdf`;
}

export async function generateAppraisalPdfBlob(
  source: AppraisalPdfSource,
  logoSource?: string,
): Promise<{ blob: Blob; filename: string }> {
  const normalized = normalizeAppraisalForPdf(source);
  const resolvedLogo =
    logoSource ??
    (typeof window !== "undefined"
      ? `${window.location.origin}/aspom-logo.png`
      : "/aspom-logo.png");
  const blob = await pdf(
    <PerformanceAppraisalPdfDocument
      data={normalized}
      logoSource={resolvedLogo}
    />,
  ).toBlob();
  return {
    blob,
    filename: buildAppraisalPdfFilename(normalized),
  };
}
