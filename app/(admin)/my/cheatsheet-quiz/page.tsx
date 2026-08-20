import { CheatsheetQuizClient } from "./components/cheatsheet-quiz-client";
import { fetchCheatsheetQuiz, fetchCheatsheetQuizAttempts } from "./queries";

export const metadata = {
  title: "Cheatsheet Quiz | Aspom Portal",
  description: "Test your travel product knowledge with a quick daily quiz.",
};

export default async function CheatsheetQuizPage() {
  const [quiz, attempts] = await Promise.all([
    fetchCheatsheetQuiz(10),
    fetchCheatsheetQuizAttempts(),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Daily Product Quiz</h1>
        <p className="text-muted-foreground">
          Sharpen your travel product knowledge, track your performance, and take daily quizzes.
        </p>
      </div>

      <CheatsheetQuizClient quiz={quiz} initialAttempts={attempts} />
    </div>
  );
}
