"use server";

import { runAction } from "./run-action";
import { ExpectedActionError } from "./action-result";
import { api, type ApiResponse } from "./client";
import type {
  CaptionStateFilter,
  GraphicStatus,
  SocialMediaGraphic,
  SocialMediaGraphicsPageResponse,
} from "@/types/social-media-graphics";

async function unwrap<T>(result: ApiResponse<{ data: T }>): Promise<T> {
  if (!result.success) {
    throw new ExpectedActionError(result.error.error, result.error.code);
  }
  return result.data.data;
}

export async function getSocialMediaGraphics(params: {
  status: GraphicStatus;
  search?: string;
  category?: string;
  caption_state?: CaptionStateFilter;
  page?: number;
  per_page?: number;
}) {
  return runAction(async () => {
    const searchParams = new URLSearchParams();
    searchParams.set("status", params.status);
    if (params.search && params.search.trim() !== "") {
      searchParams.set("search", params.search.trim());
    }
    if (params.category && params.category !== "all") {
      searchParams.set("category", params.category);
    }
    if (params.caption_state && params.caption_state !== "all") {
      searchParams.set("caption_state", params.caption_state);
    }
    if (params.page) {
      searchParams.set("page", String(params.page));
    }
    if (params.per_page) {
      searchParams.set("per_page", String(params.per_page));
    }

    const result = await api.get<SocialMediaGraphicsPageResponse>(
      `/api/social-media/graphics?${searchParams.toString()}`
    );
    if (!result.success) {
      throw new ExpectedActionError(result.error.error, result.error.code);
    }
    return result.data;
  }, "getSocialMediaGraphics");
}

export async function getSocialMediaGraphic(id: string) {
  return runAction(async () => {
    return unwrap(
      await api.get<{ data: SocialMediaGraphic }>(
        `/api/social-media/graphics/${encodeURIComponent(id)}`
      )
    );
  }, "getSocialMediaGraphic");
}

export async function updateSocialMediaGraphic(
  id: string,
  payload: {
    title?: string;
    category?: string | null;
    caption?: string | null;
    posted_platforms?: string[];
    post_url?: string | null;
  }
) {
  return runAction(async () => {
    return unwrap(
      await api.patch<{ data: SocialMediaGraphic }>(
        `/api/social-media/graphics/${encodeURIComponent(id)}`,
        payload
      )
    );
  }, "updateSocialMediaGraphic");
}

export async function updateSocialMediaGraphicStatus(
  id: string,
  payload: {
    status: GraphicStatus;
    posted_platforms?: string[];
    post_url?: string | null;
  }
) {
  return runAction(async () => {
    return unwrap(
      await api.patch<{ data: SocialMediaGraphic }>(
        `/api/social-media/graphics/${encodeURIComponent(id)}/status`,
        payload
      )
    );
  }, "updateSocialMediaGraphicStatus");
}

export async function bulkUpdateSocialMediaGraphicStatus(payload: {
  ids: string[];
  status: GraphicStatus;
  posted_platforms?: string[];
}) {
  return runAction(async () => {
    return unwrap(
      await api.post<{ data: { updated_count: number; status: GraphicStatus } }>(
        "/api/social-media/graphics/bulk-status",
        payload
      )
    );
  }, "bulkUpdateSocialMediaGraphicStatus");
}

export async function deleteSocialMediaGraphic(id: string) {
  return runAction(async () => {
    return unwrap(
      await api.delete<{ data: { deleted: boolean; id: string } }>(
        `/api/social-media/graphics/${encodeURIComponent(id)}`
      )
    );
  }, "deleteSocialMediaGraphic");
}

export async function deleteSocialMediaGraphicItem(id: string, itemId: string) {
  return runAction(async () => {
    return unwrap(
      await api.delete<{ data: SocialMediaGraphic }>(
        `/api/social-media/graphics/${encodeURIComponent(id)}/items/${encodeURIComponent(itemId)}`
      )
    );
  }, "deleteSocialMediaGraphicItem");
}
