import type {
  ApplicantAssessment,
  AssessmentActionResult,
  AssessmentDraft,
} from "@/lib/types/applicant-assessment";

export function assessmentDraft(
  assessment: ApplicantAssessment,
): AssessmentDraft {
  const answers = new Map(
    assessment.answers.map((answer) => [answer.question_id, answer]),
  );
  return {
    answers: assessment.plan_snapshot.questions
      .filter((q) => q.scored)
      .map((q) => ({
        question_id: q.id,
        score: answers.get(q.id)?.score ?? null,
        notes: answers.get(q.id)?.notes ?? "",
      })),
    practical_marks: Object.fromEntries(
      Object.entries(assessment.practical_marks ?? {}).map(([id, value]) => [
        id,
        value == null ? null : Number(value),
      ]),
    ),
    unscored_responses: Object.fromEntries(
      Object.entries(assessment.unscored_responses).map(([id, value]) => [
        id,
        value ?? "",
      ]),
    ),
    interviewer_name: assessment.interviewer.name,
    interview_date: assessment.interview_date.slice(0, 10),
    strengths: assessment.strengths ?? "",
    concerns: assessment.concerns ?? "",
    recommendation: assessment.recommendation ?? "",
    rationale: assessment.rationale ?? "",
    hiring_review: {
      reviewer_designation: assessment.hiring_review?.reviewer_designation ?? "",
      availability_to_resume: assessment.hiring_review?.availability_to_resume ?? "",
      salary_expectation: assessment.hiring_review?.salary_expectation ?? null,
      recommended_salary: assessment.hiring_review?.recommended_salary ?? null,
      nysc_status: assessment.hiring_review?.nysc_status ?? "",
      accommodation: assessment.hiring_review?.accommodation ?? "",
    },
  };
}

/** Serialize saves and retain edits made during a request. A rejected write stops
 * the queue; explicit retry is necessary, especially for stale revisions. */
export class AssessmentSaveQueue {
  private version = 0;
  private savedVersion = 0;
  private running: Promise<boolean> | null = null;
  error: { message: string; code: string } | null = null;
  constructor(
    public draft: AssessmentDraft,
    public revision: number,
    private save: (
      draft: AssessmentDraft,
      revision: number,
    ) => Promise<AssessmentActionResult<ApplicantAssessment>>,
    private onSaved: (assessment: ApplicantAssessment) => void,
    private onChange: () => void,
    initiallyDirty = false,
  ) {
    if (initiallyDirty) this.version = 1;
  }
  get dirty() {
    return this.version !== this.savedVersion;
  }
  get saving() {
    return this.running !== null;
  }
  update(draft: AssessmentDraft) {
    this.draft = draft;
    this.version++;
    this.onChange();
  }
  flush(): Promise<boolean> {
    if (this.running) return this.running;
    if (this.error) return Promise.resolve(false);
    if (!this.dirty) return Promise.resolve(true);
    this.running = this.drain().finally(() => {
      this.running = null;
      this.onChange();
    });
    this.onChange();
    return this.running;
  }
  retry() {
    this.error = null;
    return this.flush();
  }
  private async drain(): Promise<boolean> {
    while (this.dirty) {
      const version = this.version;
      try {
        const result = await this.save(this.draft, this.revision);
        if (!result.success) {
          this.error = { message: result.error, code: result.errorCode };
          this.onChange();
          return false;
        }
        this.revision = result.data.revision;
        this.savedVersion = version;
        this.onSaved(result.data);
      } catch {
        this.error = {
          message:
            "The assessment could not be saved. Your edits are still on this page. Retry when the connection is available.",
          code: "NETWORK_ERROR",
        };
        this.onChange();
        return false;
      }
    }
    return true;
  }
}
