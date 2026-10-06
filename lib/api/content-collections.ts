"use server";

import { api, type ApiResponse } from "./client";
import type { ContentCollection, ContentAssignment, ContentDraft, ContentIdea, ContentStaff } from "@/types/content-collections";

async function unwrap<T>(result: ApiResponse<{ data: T }>): Promise<T> {
  if (!result.success) throw new Error(result.error.error);
  return result.data.data;
}

export async function getContentCollections() {
  return unwrap(await api.get<{ data: ContentCollection[] }>("/api/social-media/content-collections"));
}

export async function getContentStaff() {
  return unwrap(await api.get<{ data: ContentStaff[] }>("/api/social-media/content-collections/staff"));
}

export async function saveContentCollection(draft: ContentDraft, id?: string) {
  return unwrap(id
    ? await api.patch<{ data: ContentCollection }>(`/api/social-media/content-collections/${id}`, draft)
    : await api.post<{ data: ContentCollection }>("/api/social-media/content-collections", draft));
}

export async function publishContentCollection(id: string) {
  return unwrap(await api.post<{ data: ContentCollection }>(`/api/social-media/content-collections/${id}/publish`));
}

export async function changeContentDeadline(id: string, deadline: string) {
  return unwrap(await api.patch<{ data: ContentCollection }>(`/api/social-media/content-collections/${id}`, { deadline }));
}

export async function addContentAssignment(id: string, assignment: ContentDraft['assignments'][number]) {
  return unwrap(await api.post<{ data: ContentCollection }>(`/api/social-media/content-collections/${id}/assignments`, assignment));
}

export async function updateContentAssignment(id: string, assignmentId: string, changes: { brief: string; required_count: number }) {
  return unwrap(await api.patch<{ data: ContentCollection }>(`/api/social-media/content-collections/${id}/assignments/${assignmentId}`, changes));
}

export async function getMyContentAssignments() {
  return unwrap(await api.get<{ data: ContentAssignment[] }>("/api/my/content-ideas"));
}

export async function saveContentIdea(assignmentId: string, idea: { title: string; description: string }, id?: string) {
  return unwrap(id
    ? await api.patch<{ data: ContentIdea }>(`/api/content-assignments/${assignmentId}/ideas/${id}`, idea)
    : await api.post<{ data: ContentIdea }>(`/api/content-assignments/${assignmentId}/ideas`, idea));
}
