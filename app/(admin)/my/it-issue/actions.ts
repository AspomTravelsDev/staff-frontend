"use server";

import {
    createItIssue as _createItIssue,
    deleteItIssue as _deleteItIssue,
    type CreateItIssuePayload,
} from "@/lib/api/it-issues";

export async function createItIssueAction(payload: CreateItIssuePayload) {
    return _createItIssue(payload);
}

export async function deleteItIssueAction(id: string) {
    return _deleteItIssue(id);
}
