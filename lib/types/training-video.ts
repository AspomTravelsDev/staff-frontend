export interface TrainingVideoProgress {
  watched_seconds: number;
  duration_seconds: number | null;
  completion_percent: number;
  completed_at: string | null;
  last_watched_at: string | null;
}

export interface StaffTrainingVideo {
  id: string;
  title: string;
  description: string | null;
  module: string;
  youtube_url: string;
  youtube_video_id: string;
  thumbnail_url: string;
  duration_seconds: number | null;
  departments: string[];
  is_required: boolean;
  sort_order: number;
  related_guide_url: string | null;
  progress: TrainingVideoProgress;
}

export interface MyTrainingVideosResponse {
  items: StaffTrainingVideo[];
  summary: {
    total: number;
    completed: number;
    required_total: number;
    required_completed: number;
    remaining_seconds: number;
  };
  modules: string[];
  user_departments: string[];
}

export interface AdminTrainingVideo {
  id: string;
  title: string;
  description: string | null;
  module: string;
  youtube_url: string;
  youtube_video_id: string;
  thumbnail_url: string;
  duration_seconds: number | null;
  departments: string[];
  is_required: boolean;
  is_published: boolean;
  sort_order: number;
  related_guide_url: string | null;
  creator_name: string | null;
  completed_count: number;
  target_staff_count: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface AdminTrainingVideosResponse {
  items: AdminTrainingVideo[];
  departments: string[];
  modules: string[];
}

export interface TrainingVideoInput {
  title: string;
  description?: string | null;
  module: string;
  youtube_url: string;
  duration_seconds?: number | null;
  departments: string[];
  is_required: boolean;
  is_published: boolean;
  sort_order?: number;
  related_guide_url?: string | null;
}

export interface TrainingVideoLookupResult {
  youtube_video_id: string;
  title: string | null;
  author_name: string | null;
  thumbnail_url: string;
}

export interface StaffTrainingProgressRow {
  user_id: string;
  name: string;
  staff_id: string | null;
  department: string | null;
  departments: string[];
  assigned_total: number;
  assigned_completed: number;
  required_total: number;
  required_completed: number;
  completion_percent: number;
  last_watched_at: string | null;
}

export interface StaffTrainingProgressResponse {
  items: StaffTrainingProgressRow[];
  departments: string[];
}
