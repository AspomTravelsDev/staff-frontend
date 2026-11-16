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

export const OPEN_IDEA_CATEGORIES = [
  "Visa",
  "Flights",
  "Birth Services",
  "Study Abroad",
  "Packages/Hotels",
  "Customer FAQ/Story",
  "Office/BTS",
  "Other",
] as const;

export type OpenIdeaCategory = (typeof OPEN_IDEA_CATEGORIES)[number];

export const OPEN_IDEA_FORMATS = [
  "Reel / TikTok",
  "Carousel",
  "Graphic / Single Post",
  "Story",
  "Blog / Thread",
  "Other",
] as const;

export type OpenIdeaFormat = (typeof OPEN_IDEA_FORMATS)[number];

export interface OpenContentIdea {
  id: string;
  user_id?: string;
  title: string;
  category: OpenIdeaCategory | string;
  description: string;
  format?: OpenIdeaFormat | string | null;
  reference_url?: string | null;
  created_at?: string;
  updated_at?: string;
  user?: { id: string; name: string; department?: string | null };
}

export interface OpenContentIdeaInput {
  title: string;
  category: string;
  description: string;
  format?: string | null;
  reference_url?: string | null;
}
