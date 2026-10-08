"use server";

import { runAction } from "./run-action";
import { ExpectedActionError } from "./action-result";

import { api, type ApiResponse } from "./client";
import type { ContentCollection, ContentAssignment, ContentDraft, ContentIdea, ContentStaff } from "@/types/content-collections";

async function unwrap<T>(result: ApiResponse<{ data: T }>): Promise<T> {
  if (!result.success) throw new ExpectedActionError(result.error.error, result.error.code);
  return result.data.data;
}

export async function getContentCollections() {
    return runAction(async () => {
      return unwrap(await api.get<{ data: ContentCollection[] }>("/api/social-media/content-collections"));
    }, "getContentCollections");
}

export async function getContentStaff() {
    return runAction(async () => {
      return unwrap(await api.get<{ data: ContentStaff[] }>("/api/social-media/content-collections/staff"));
    }, "getContentStaff");
}

export async function saveContentCollection(draft: ContentDraft, id?: string) {
    return runAction(async () => {
      return unwrap(id
        ? await api.patch<{ data: ContentCollection }>(`/api/social-media/content-collections/${id}`, draft)
        : await api.post<{ data: ContentCollection }>("/api/social-media/content-collections", draft));
    }, "saveContentCollection");
}

export async function publishContentCollection(id: string) {
    return runAction(async () => {
      return unwrap(await api.post<{ data: ContentCollection }>(`/api/social-media/content-collections/${id}/publish`));
    }, "publishContentCollection");
}

export async function changeContentDeadline(id: string, deadline: string) {
    return runAction(async () => {
      return unwrap(await api.patch<{ data: ContentCollection }>(`/api/social-media/content-collections/${id}`, { deadline }));
    }, "changeContentDeadline");
}

export async function addContentAssignment(id: string, assignment: ContentDraft['assignments'][number]) {
    return runAction(async () => {
      return unwrap(await api.post<{ data: ContentCollection }>(`/api/social-media/content-collections/${id}/assignments`, assignment));
    }, "addContentAssignment");
}

export async function updateContentAssignment(id: string, assignmentId: string, changes: { brief: string; required_count: number }) {
    return runAction(async () => {
      return unwrap(await api.patch<{ data: ContentCollection }>(`/api/social-media/content-collections/${id}/assignments/${assignmentId}`, changes));
    }, "updateContentAssignment");
}

export async function getMyContentAssignments() {
    return runAction(async () => {
      return unwrap(await api.get<{ data: ContentAssignment[] }>("/api/my/content-ideas"));
    }, "getMyContentAssignments");
}

export async function saveContentIdea(assignmentId: string, idea: { title: string; description: string }, id?: string) {
    return runAction(async () => {
      return unwrap(id
        ? await api.patch<{ data: ContentIdea }>(`/api/content-assignments/${assignmentId}/ideas/${id}`, idea)
        : await api.post<{ data: ContentIdea }>(`/api/content-assignments/${assignmentId}/ideas`, idea));
    }, "saveContentIdea");
}
