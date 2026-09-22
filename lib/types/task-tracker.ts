export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface Colleague {
  id: string;
  name: string;
  email: string;
  department?: string | null;
  image_url?: string | null;
}

export interface TaskTrackerItem {
  id: string;
  user_id: string;
  assigned_by_user_id?: string | null;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  completed_at: string | null;
  remind_before_hours: number;
  enable_email_reminder: boolean;
  enable_push_reminder: boolean;
  reminder_sent_at: string | null;
  overdue_reminder_sent_at: string | null;
  sent_reminders?: string[] | null;
  extension_status?: "pending" | "approved" | "rejected" | null;
  extension_requested_due_date?: string | null;
  extension_reason?: string | null;
  extension_feedback?: string | null;
  extension_requested_at?: string | null;
  extension_decided_at?: string | null;
  was_completed_on_time?: boolean | null;
  is_overdue: boolean;
  human_due: string | null;
  is_delegated?: boolean;
  user?: Colleague;
  assigned_by?: Colleague;
  created_at: string;
  updated_at: string;
}

export interface TaskTrackerStats {
  total: number;
  pending: number;
  due_soon: number;
  overdue: number;
  completed: number;
  assigned_by_me_count?: number;
  assigned_to_me_count?: number;
}

export interface TaskTrackerDashboardStats {
  total_pending: number;
  overdue: number;
  due_soon: number;
}

export interface CompanyDelegatedTaskStats {
  total: number;
  pending: number;
  due_soon: number;
  overdue: number;
  pending_extensions: number;
  completed: number;
}

export interface CreateTaskTrackerPayload {
  title: string;
  description?: string | null;
  due_date?: string | null;
  priority?: TaskPriority;
  remind_before_hours?: number;
  enable_email_reminder?: boolean;
  enable_push_reminder?: boolean;
  assigned_to_user_id?: string | null;
}

export interface UpdateTaskTrackerPayload {
  title?: string;
  description?: string | null;
  due_date?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  remind_before_hours?: number;
  enable_email_reminder?: boolean;
  enable_push_reminder?: boolean;
}

export interface RequestTaskExtensionPayload {
  requested_due_date: string;
  reason: string;
}

export interface ApproveTaskExtensionPayload {
  approved_due_date?: string;
  feedback?: string;
}

export interface RejectTaskExtensionPayload {
  feedback?: string;
}
