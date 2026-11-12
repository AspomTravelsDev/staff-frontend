"use server";

import { cache } from "react";
import { getRolesMetadata } from "@/lib/auth/api";
import { getAuthToken } from "@/lib/auth/session";
import {
    getFallbackRolesMetadataContract,
    type RolesMetadataContract,
} from "@/types/user-types";

export const getRolesMetadataContract = cache(async (): Promise<RolesMetadataContract> => {
    const token = await getAuthToken();
    const result = await getRolesMetadata(token ?? undefined);

    if (!result.success) {
        return getFallbackRolesMetadataContract();
    }

    const payload = result.data.data;

    if (!payload || !Array.isArray(payload.roles)) {
        return getFallbackRolesMetadataContract();
    }

    const normalizedVersion =
        typeof payload.version === "number" ? payload.version : 1;

    if (normalizedVersion !== 1) {
        return getFallbackRolesMetadataContract();
    }

    const normalizedDepartments = Array.from(
        new Set(
            (payload.departments ?? [])
                .map((department) => (department ?? "").trim())
                .filter((department) => department.length > 0)
        )
    );

    return {
        version: normalizedVersion,
        roles: payload.roles,
        role_to_department: payload.role_to_department ?? {},
        departments:
            normalizedDepartments.length > 0
                ? normalizedDepartments
                : getFallbackRolesMetadataContract().departments,
    };
});
