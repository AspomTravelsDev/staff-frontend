import { getCheatsheetQuiz, getCheatsheetQuizAttempts } from "@/lib/api/cheatsheet";

export async function fetchCheatsheetQuiz(count = 10) {
    const result = await getCheatsheetQuiz(count);
    if (!result.success) return null;
    return result.data;
}

export async function fetchCheatsheetQuizAttempts() {
    const result = await getCheatsheetQuizAttempts();
    if (!result.success) return [];
    return result.data;
}
