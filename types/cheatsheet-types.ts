export interface CheatsheetItem {
    id: string;
    source_id: string;
    title: string;
    content: string;
    category: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CheatsheetQuizQuestion {
    id: string;
    question: string;
    options: string[];
}

export interface CheatsheetQuizPayload {
    questions: CheatsheetQuizQuestion[];
    count: number;
}

export interface CheatsheetQuizSubmitResponse {
    response: {
        id: string;
        user_id: string;
        question_ids: string[];
        answers: Record<string, string>;
        score: number;
        total: number;
        is_completed: boolean;
        completed_at: string | null;
        created_at: string;
        updated_at: string;
    };
    score: number;
    total: number;
}

export interface CheatsheetSource {
    id: string;
    title: string | null;
    content: string;
    status: "draft" | "active" | "archived";
    extracted_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface CheatsheetItemAdmin {
    id: string;
    source_id: string;
    title: string;
    content: string;
    category: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CheatsheetQuestionAdmin {
    id: string;
    source_id: string;
    question: string;
    options: string[];
    correct_option: string;
    explanation: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CheatsheetAnalyticsQuestionBreakdown {
    question_id: string;
    question: string;
    response_count: number;
    correct_count: number;
}

export interface CheatsheetDepartmentPerformance {
    department: string;
    staff_count: number;
    attempts_count: number;
    average_score: number | null;
    highest_score: number | null;
    last_active: string | null;
}

export interface CheatsheetAnalytics {
    total_responses: number;
    average_score: number;
    question_breakdown: CheatsheetAnalyticsQuestionBreakdown[];
    department_performance: CheatsheetDepartmentPerformance[];
}

export interface CheatsheetQuizAttempt {
    id: string;
    user_id: string;
    question_ids: string[];
    answers: Record<string, string>;
    score: number;
    total: number;
    is_completed: boolean;
    completed_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface CheatsheetQuizAttemptDetailQuestion {
    id: string;
    question: string;
    options: string[];
    correct_option: string;
    explanation: string | null;
    category: string | null;
    user_answer: string | null;
    is_correct: boolean;
}

export interface CheatsheetQuizAttemptDetail {
    attempt: CheatsheetQuizAttempt;
    questions: CheatsheetQuizAttemptDetailQuestion[];
}
