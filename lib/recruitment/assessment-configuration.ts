import type {
  AssessmentBank,
  AssessmentConfiguration,
  AssessmentDefinition,
  AssessmentSection,
} from "@/lib/types/applicant-assessment";

export function suggestedAssessmentTrack(department: string): string {
  const names: Record<string, string> = {
    hr: "hr",
    "hr/admin": "hr",
    "human resources": "hr",
    administration: "hr",
    "office operations": "operations",
    "office-operations": "operations",
    "office operations/admin": "operations",
    "office assistants": "operations",
    "sales & social media": "sales",
    "social media": "sales",
    sales: "sales",
    visa: "visa",
    accounts: "accounts",
    account: "accounts",
    it: "it",
    "it & web": "it",
    compliance: "compliance",
  };
  return (
    names[
      department
        .toLowerCase()
        .replace(/\s+department$/i, "")
        .trim()
    ] ?? ""
  );
}
export function defaultAssessmentConfiguration(
  bank: AssessmentBank,
  track: string,
): AssessmentConfiguration {
  const selection = bank.tracks.find((item) => item.id === track)?.recommended;
  return {
    track,
    practical: true,
    custom_questions: [],
    question_ids: selection
      ? [
          ...bank.questions
            .filter((q) => q.section === "general")
            .map((q) => q.id),
          ...selection.talent,
          ...selection.role,
          ...bank.questions
            .filter((q) => q.track === track && q.section === "practical")
            .slice(0, 1)
            .map((q) => q.id),
        ]
      : [],
  };
}
export function configurationFromDefinition(
  definition: AssessmentDefinition,
  bank: AssessmentBank,
  locked: boolean,
): AssessmentConfiguration {
  if (!locked && bank.version && bank.version !== definition.bank_version) {
    return {...defaultAssessmentConfiguration(bank, definition.track.id), custom_questions: definition.questions.filter(q => q.custom).map(q => ({id:q.id,text:q.text,competency:q.competency!}))};
  }
  const selected = definition.questions
    .filter((q) => q.scored && !q.custom)
    .map((q) => q.id);
  return {
    custom_questions: definition.questions
      .filter((q) => q.custom)
      .map((q) => ({ id: q.id, text: q.text, competency: q.competency! })),
    track: definition.track.id,
    practical: !!definition.weights.practical,
    question_ids: locked
      ? selected
      : [
          ...new Set([
            ...bank.questions
              .filter((q) => q.section === "general")
              .map((q) => q.id),
            ...selected,
          ]),
        ],
  };
}
export function assessmentConfigurationIssues(
  bank: AssessmentBank,
  config: AssessmentConfiguration,
): string[] {
  if (!bank.tracks.some((track) => track.id === config.track))
    return ["Choose an assessment track."];
  const chosen = bank.questions.filter(
    (q) =>
      config.question_ids.includes(q.id) &&
      q.scored &&
      (!q.track || q.track === config.track),
  );
  const sections: AssessmentSection[] = config.practical
    ? ["general", "talent", "role", "practical"]
    : ["general", "talent", "role"];
  const issues: string[] = [];
  const custom = config.custom_questions ?? [];
  if (
    custom.length > 20 ||
    new Set(custom.map((q) => q.id)).size !== custom.length ||
    custom.some(
      (q) =>
        !/^custom-[a-zA-Z0-9-]{1,60}$/.test(q.id) ||
        !q.text.trim() ||
        q.text.length > 2000 ||
        !bank.competencies[q.competency],
    )
  )
    issues.push(
      "Complete each custom question and choose its competency (maximum 20).",
    );
  if (sections.some((section) => !chosen.some((q) => q.section === section)))
    issues.push("Select questions in every assessment section.");
  const coverage = new Set(
    chosen.filter((q) => q.section === "talent").map((q) => q.competency),
  );
  const missing = [
    "reasoning",
    "initiative",
    "identification",
    "solution",
  ].filter((key) => !coverage.has(key));
  if (missing.length)
    issues.push(
      `Include talent questions for ${missing.map((key) => bank.competencies[key]).join(", ")}.`,
    );
  if (
    new Set(config.question_ids).size !== config.question_ids.length ||
    chosen.length !== config.question_ids.length ||
    config.question_ids.length + custom.length > 80
  )
    issues.push("Select valid, unique questions for this track.");
  if (
    bank.questions.some(
      (q) => q.section === "general" && !config.question_ids.includes(q.id),
    )
  )
    issues.push("All general questions are required.");
  return issues;
}
