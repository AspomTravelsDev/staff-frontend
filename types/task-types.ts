export interface TaskItem {
    text: string;
    completed: boolean;
    completed_at: string | null; // ISO datetime
    created_at?: string; // ISO datetime
}

export interface DailyTaskRecord {
    id: string;
    user_id: string;
    date: string; // YYYY-MM-DD
    tasks: TaskItem[];
    completed_tasks: TaskItem[];
    ongoing_tasks: TaskItem[];
    total_tasks: number;
    completed_count: number;
    ongoing_count: number;
    report_submitted: boolean;
    report_submitted_at: string | null; // ISO datetime
    first_saved_at: string | null; // ISO datetime
    created_at: string;
    updated_at: string;
    user?: { // For HR view
        id: string;
        name: string;
        email: string;
        staff_id: string;
        image_url: string | null;
    };
}

export interface TaskFilters {
    date?: string;
    start_date?: string;
    end_date?: string;
}

export interface AllTaskFilters extends TaskFilters {
    user_id?: string;
    report_submitted?: boolean;
}

export interface CreateTaskRequest {
    tasks: TaskItem[];
}
