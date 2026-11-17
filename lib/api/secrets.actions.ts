"use server";

import { runAction } from "./run-action";
import { ExpectedActionError, type ActionResult } from "./action-result";
import { api } from "./client";
import type {
  SecureSecretMetadata,
  RevealedSecretData,
  CreateSecretInput,
} from "@/types/secret";

export async function createSecret(
  input: CreateSecretInput
): Promise<ActionResult<{ secret: SecureSecretMetadata; share_url: string }>> {
  return runAction(async () => {
    const result = await api.post<{
      message: string;
      data: SecureSecretMetadata;
      share_url: string;
    }>("/api/secrets", input);

    if (!result.success) {
      throw new ExpectedActionError(
        result.error.error || "Failed to create secure credential drop",
        result.error.code
      );
    }

    return { secret: result.data.data, share_url: result.data.share_url };
  }, "createSecret");
}

export async function getSecretMetadata(
  id: string,
  isPublic = false
): Promise<ActionResult<SecureSecretMetadata>> {
  return runAction(async () => {
    const endpoint = isPublic
      ? `/api/public-secrets/${id}`
      : `/api/secrets/${id}`;

    const result = await api.get<{ data: SecureSecretMetadata }>(endpoint);

    if (!result.success) {
      throw new ExpectedActionError(
        result.error.error || "Failed to load credential information",
        result.error.code
      );
    }

    return result.data.data;
  }, "getSecretMetadata");
}

export async function revealSecret(
  id: string,
  pin?: string,
  isPublic = false
): Promise<ActionResult<RevealedSecretData>> {
  return runAction(async () => {
    const endpoint = isPublic
      ? `/api/public-secrets/${id}/reveal`
      : `/api/secrets/${id}/reveal`;

    const result = await api.post<{
      message: string;
      data: RevealedSecretData;
    }>(endpoint, pin ? { pin } : {});

    if (!result.success) {
      throw new ExpectedActionError(
        result.error.error || "Failed to reveal secret",
        result.error.code
      );
    }

    return result.data.data;
  }, "revealSecret");
}

export async function revokeSecret(
  id: string
): Promise<ActionResult<SecureSecretMetadata>> {
  return runAction(async () => {
    const result = await api.delete<{
      message: string;
      data: SecureSecretMetadata;
    }>(`/api/secrets/${id}`);

    if (!result.success) {
      throw new ExpectedActionError(
        result.error.error || "Failed to revoke secret",
        result.error.code
      );
    }

    return result.data.data;
  }, "revokeSecret");
}

export async function getSecretAuditLogs(
  page = 1
): Promise<
  ActionResult<{
    data: SecureSecretMetadata[];
    meta: { current_page: number; has_more_pages: boolean; total: number };
  }>
> {
  return runAction(async () => {
    const result = await api.get<{
      data: SecureSecretMetadata[];
      meta: { current_page: number; has_more_pages: boolean; total: number };
    }>(`/api/admin/secrets?page=${page}`);

    if (!result.success) {
      throw new ExpectedActionError(
        result.error.error || "Failed to load secret audit logs",
        result.error.code
      );
    }

    return result.data;
  }, "getSecretAuditLogs");
}
