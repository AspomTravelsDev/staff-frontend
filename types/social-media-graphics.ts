export const GRAPHIC_STATUSES = ["fresh", "posted", "archived"] as const;

export type GraphicStatus = (typeof GRAPHIC_STATUSES)[number];

export const GRAPHIC_STATUS_LABELS: Record<GraphicStatus, string> = {
  fresh: "Fresh",
  posted: "Posted",
  archived: "Archived",
};

export const GRAPHIC_CATEGORIES = [
  "Visa",
  "Flights",
  "Birth Services",
  "Study Abroad",
  "Packages/Hotels",
  "Promo / Offer",
  "Office/BTS",
  "Other",
] as const;

export const GRAPHIC_PLATFORMS = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "facebook", label: "Facebook" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "x", label: "X" },
  { value: "whatsapp", label: "WhatsApp" },
] as const;

export type GraphicPlatform = (typeof GRAPHIC_PLATFORMS)[number]["value"];

export type CaptionStateFilter = "all" | "missing_caption" | "with_caption";

export interface GraphicUserRef {
  id: string;
  name: string;
}

export interface SocialMediaGraphicItem {
  id: string;
  position: number;
  original_name: string;
  mime_type: string;
  file_size: number;
  thumb_size: number | null;
  preview_size: number | null;
  width: number | null;
  height: number | null;
  etag: string;
}

export interface SocialMediaGraphic {
  id: string;
  title: string;
  category: string | null;
  caption: string | null;
  status: GraphicStatus;
  posted_platforms: string[];
  post_url: string | null;
  uploaded_by_id: string | null;
  uploaded_by: GraphicUserRef | null;
  caption_updated_by: GraphicUserRef | null;
  caption_updated_at: string | null;
  posted_by: GraphicUserRef | null;
  posted_at: string | null;
  archived_by: GraphicUserRef | null;
  archived_at: string | null;
  status_updated_by: GraphicUserRef | null;
  status_updated_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  can_delete: boolean;
  items: SocialMediaGraphicItem[];
}

export interface SocialMediaGraphicsCounts {
  fresh: number;
  posted: number;
  archived: number;
  fresh_missing_caption: number;
  fresh_with_caption: number;
}

export interface SocialMediaGraphicsPageResponse {
  data: SocialMediaGraphic[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    has_more: boolean;
  };
  counts: SocialMediaGraphicsCounts;
}

export function getGraphicMediaUrl(
  itemId: string,
  variant: "thumb" | "preview" | "original",
  versionTag?: string
): string {
  const base = `/api/social-media/graphics/items/${encodeURIComponent(itemId)}/${variant}`;
  return versionTag ? `${base}?v=${encodeURIComponent(versionTag)}` : base;
}

export function getGraphicZipUrl(graphicId: string): string {
  return `/api/social-media/graphics/${encodeURIComponent(graphicId)}/download-zip`;
}
