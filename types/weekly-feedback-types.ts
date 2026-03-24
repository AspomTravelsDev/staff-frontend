export type WeeklyFeedbackQuestionType = "single_choice" | "multi_choice" | "rating";

export const LIKERT_LABELS: Record<string, string> = {
  "1": "Strongly Disagree",
  "2": "Disagree",
  "3": "Neutral",
  "4": "Agree",
  "5": "Strongly Agree",
};

export interface WeeklyFeedbackQuestion {
    id: string | null;
    question: string;
    type: WeeklyFeedbackQuestionType;
    options: string[] | null;
    source: "bank" | "weekly";
}

export interface WeeklyFeedbackForm {
    id: string;
    week_start: string;
    status: "draft" | "published" | "closed";
    questions: WeeklyFeedbackQuestion[];
    published_at: string | null;
    closes_at: string | null;
}

export interface WeeklyFeedbackResponse {
    id: string;
    form_id: string;
    answers: Record<string, string | string[] | number>;
    is_completed: boolean;
    completed_at: string | null;
}

export interface WeeklyFeedbackActivePayload {
    form: WeeklyFeedbackForm;
    response: WeeklyFeedbackResponse | null;
    submission_open: boolean;
}

export interface WeeklyFeedbackLockStatus {
    is_locked: boolean;
    reason: string | null;
    active_form: {
        id: string;
        week_start: string;
        closes_at: string | null;
    } | null;
}

export interface WeeklyFeedbackQuestionBankItem {
    id: string;
    question: string;
    type: WeeklyFeedbackQuestionType;
    options: string[] | null;
    is_default: boolean;
    is_active: boolean;
    created_by: string | null;
    created_at: string;
    updated_at: string;
}

export interface WeeklyFeedbackAnalyticsQuestionBreakdown {
    question: string;
    type: WeeklyFeedbackQuestionType;
    response_count: number;
    average_rating?: number | null;
    distribution?: Record<string, number>;
}

export interface WeeklyFeedbackAnalyticsPayload {
    total_responses: number;
    completed_responses: number;
    question_breakdown: WeeklyFeedbackAnalyticsQuestionBreakdown[];
}
