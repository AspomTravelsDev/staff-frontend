export interface ContentIdea {
  id: string;
  title: string;
  description: string;
}

export interface ContentAssignment {
  id: string;
  user_id: string;
  theme: string;
  brief: string;
  required_count: number;
  ideas: ContentIdea[];
  user?: { id: string; name: string };
  collection?: ContentCollection;
}

export interface ContentCollection {
  id: string;
  title: string;
  month: string;
  deadline: string;
  published_at: string | null;
  assignments: ContentAssignment[];
}

export interface ContentDraft {
  title: string;
  month: string;
  deadline: string;
  assignments: { user_id: string; theme: string; brief: string; required_count: number }[];
}

export interface ContentStaff { id: string; name: string; department: string | null }
