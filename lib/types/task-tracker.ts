export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'submitted' | 'changes_requested';
export type TaskRecurrence = 'daily' | 'weekly' | 'monthly';

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
  assigned_at?: string | null;
  title: string;
  description: string | null;
  due_date: string | null;
  recurrence?: TaskRecurrence | null;
  priority: TaskPriority;
  status: TaskStatus;
  custom_status?: string | null;
  completed_at: string | null;
  original_due_date?: string | null;
  submitted_at?: string | null;
  submission_due_date?: string | null;
  submission_note?: string | null;
  submission_url?: string | null;
  attachments?: { id: string; name: string; size: number; download_url: string }[] | null;
  submission_attachments?: { id: string; name: string; size: number; download_url: string }[] | null;
  review_feedback?: string | null;
  can_manage?: boolean;
  can_submit?: boolean;
  can_review?: boolean;
  can_reassign?: boolean;
  reassignments_count?: number;
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
  can_comment?: boolean;
  user?: Colleague;
  assigned_by?: Colleague;
  created_at: string;
  updated_at: string;
}

export interface TaskTrackerComment {
  id: number;
  task_tracker_item_id: string;
  user_id: string;
  body: string;
  created_at: string;
  user?: Pick<Colleague, "id" | "name" | "image_url">;
}

export interface TaskTrackerStats {
  attention?: number;
  total: number;
  pending: number;
  due_soon: number;
  overdue: number;
  completed: number;
  submitted?: number;
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
  submitted?: number;
}

export interface CreateTaskTrackerPayload {
  title: string;
  description?: string | null;
  due_date?: string | null;
  recurrence?: TaskRecurrence | null;
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
  recurrence?: TaskRecurrence | null;
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
