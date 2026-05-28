"use server";

import { revalidatePath } from "next/cache";
import { submitCheatsheetQuiz } from "@/lib/api/cheatsheet";

export type CheatsheetQuizFormState = {
    error?: string;
    score?: number;
    total?: number;
};

export async function submitCheatsheetQuizAction(
    _prevState: CheatsheetQuizFormState | null,
    formData: FormData,
): Promise<CheatsheetQuizFormState> {
    const rawQuestionIds = formData.get("question_ids");
    const questionIds = rawQuestionIds
        ? (JSON.parse(String(rawQuestionIds)) as string[])
        : [];

    if (questionIds.length === 0) {
        return { error: "No quiz questions available." };
    }

    const answers: Record<string, string> = {};
    questionIds.forEach((id) => {
        const value = formData.get(`answer_${id}`);
        if (typeof value === "string" && value.trim().length > 0) {
            answers[id] = value;
        }
    });

    const result = await submitCheatsheetQuiz({
        question_ids: questionIds,
        answers,
        is_completed: true,
    });

    if (!result.success) {
        return { error: result.error.error };
    }

    revalidatePath("/my/cheatsheet-quiz");

    return {
        score: result.data.score,
        total: result.data.total,
    };
}
