"use server";

import { api } from "./client";
import { ExpectedActionError } from "./action-result";
import { runAction } from "./run-action";
import type {
  AdminTrainingVideo,
  AdminTrainingVideosResponse,
  MyTrainingVideosResponse,
  StaffTrainingProgressResponse,
  TrainingVideoInput,
  TrainingVideoLookupResult,
  TrainingVideoProgress,
} from "@/lib/types/training-video";

export async function getMyTrainingVideos() {
  return runAction(async () => {
    const result = await api.get<{ data: MyTrainingVideosResponse }>("/api/my/training-videos");
    if (!result.success) throw new ExpectedActionError(result.error.error, result.error.code);
    return result.data.data;
  }, "getMyTrainingVideos");
}

export async function recordTrainingVideoProgress(
  videoId: string,
  payload: { watched_seconds: number; duration_seconds?: number | null; completed?: boolean },
) {
  return runAction(async () => {
    const result = await api.post<{ data: TrainingVideoProgress & { video_id: string } }>(
      `/api/my/training-videos/${encodeURIComponent(videoId)}/progress`,
      payload,
    );
    if (!result.success) throw new ExpectedActionError(result.error.error, result.error.code);
    return result.data.data;
  }, "recordTrainingVideoProgress");
}

export async function listAdminTrainingVideos() {
  return runAction(async () => {
    const result = await api.get<{ data: AdminTrainingVideosResponse }>("/api/admin/training-videos");
    if (!result.success) throw new ExpectedActionError(result.error.error, result.error.code);
    return result.data.data;
  }, "listAdminTrainingVideos");
}

export async function lookupYoutubeVideoMetadata(youtubeUrl: string) {
  return runAction(async () => {
    const result = await api.post<{ data: TrainingVideoLookupResult }>(
      "/api/admin/training-videos/lookup",
      { youtube_url: youtubeUrl },
    );
    if (!result.success) throw new ExpectedActionError(result.error.error, result.error.code);
    return result.data.data;
  }, "lookupYoutubeVideoMetadata");
}

export async function saveTrainingVideo(id: string | null, data: TrainingVideoInput) {
  return runAction(async () => {
    const result = id
      ? await api.patch<{ data: AdminTrainingVideo }>(
          `/api/admin/training-videos/${encodeURIComponent(id)}`,
          data,
        )
      : await api.post<{ data: AdminTrainingVideo }>("/api/admin/training-videos", data);
    if (!result.success) throw new ExpectedActionError(result.error.error, result.error.code);
    return result.data.data;
  }, "saveTrainingVideo");
}

export async function deleteTrainingVideo(id: string) {
  return runAction(async () => {
    const result = await api.delete<{ message: string }>(
      `/api/admin/training-videos/${encodeURIComponent(id)}`,
    );
    if (!result.success) throw new ExpectedActionError(result.error.error, result.error.code);
    return result.data;
  }, "deleteTrainingVideo");
}

export async function getStaffTrainingProgress() {
  return runAction(async () => {
    const result = await api.get<{ data: StaffTrainingProgressResponse }>(
      "/api/admin/training-videos/progress",
    );
    if (!result.success) throw new ExpectedActionError(result.error.error, result.error.code);
    return result.data.data;
  }, "getStaffTrainingProgress");
}
