"use client";

import { useMemo, useState, useTransition, useActionState, useEffect } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Trophy,
  TrendingUp,
  Calendar,
  CheckCircle2,
  XCircle,
  Award,
  BookOpen,
  ArrowLeft,
  Loader2,
  Info,
} from "lucide-react";
import type {
  CheatsheetQuizPayload,
  CheatsheetQuizAttempt,
  CheatsheetQuizAttemptDetail,
} from "@/types/cheatsheet-types";
import { getCheatsheetQuizAttemptDetails } from "@/lib/api/cheatsheet";
import { submitCheatsheetQuizAction, type CheatsheetQuizFormState } from "../actions";

interface CheatsheetQuizClientProps {
  quiz: CheatsheetQuizPayload | null;
  initialAttempts: CheatsheetQuizAttempt[];
}

export function CheatsheetQuizClient({
  quiz,
  initialAttempts,
}: CheatsheetQuizClientProps) {
  const [view, setView] = useState<"dashboard" | "quiz">("dashboard");
  const [attempts, setAttempts] = useState<CheatsheetQuizAttempt[]>(initialAttempts);
  
  const [state, formAction, isPending] = useActionState<
    CheatsheetQuizFormState | null,
    FormData
  >(async (prevState, formData) => {
    const result = await submitCheatsheetQuizAction(prevState, formData);
    if (!result.error && typeof result.score === "number") {
      setView("dashboard");
      setAnswers({});
      toast.success(`Quiz completed! You scored ${result.score} out of ${result.total}.`);
    }
    return result;
  }, null);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizStage, setQuizStage] = useState<"taking" | "review">("taking");

  useEffect(() => {
    setAttempts(initialAttempts);
  }, [initialAttempts]);
  
  // Details Modal State
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);
  const [details, setDetails] = useState<CheatsheetQuizAttemptDetail | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const totalQuestions = quiz?.questions?.length ?? 0;
  const answeredCount = useMemo(
    () => Object.values(answers).filter((value) => value.length > 0).length,
    [answers],
  );

  // Statistics
  const totalAttempts = attempts.length;
  const latestAttempt = attempts[0] || null;

  const averageScorePercent = useMemo(() => {
    if (attempts.length === 0) return 0;
    const sum = attempts.reduce((acc, curr) => acc + (curr.score / curr.total), 0);
    return Math.round((sum / attempts.length) * 100);
  }, [attempts]);

  const highestScorePercent = useMemo(() => {
    if (attempts.length === 0) return 0;
    const max = Math.max(...attempts.map((a) => a.score / a.total));
    return Math.round(max * 100);
  }, [attempts]);

  const latestScorePercent = useMemo(() => {
    if (!latestAttempt) return 0;
    return Math.round((latestAttempt.score / latestAttempt.total) * 100);
  }, [latestAttempt]);

  // Chart Data: ordered chronologically (oldest to newest)
  const chartData = useMemo(() => {
    return attempts
      .slice()
      .reverse()
      .map((attempt) => ({
        date: format(new Date(attempt.created_at), "MMM d"),
        score: Math.round((attempt.score / attempt.total) * 100),
      }));
  }, [attempts]);

  // Load Attempt Details
  const handleViewDetails = async (attemptId: string) => {
    setSelectedAttemptId(attemptId);
    setIsDetailsOpen(true);
    setIsLoadingDetails(true);
    setDetails(null);

    try {
      const res = await getCheatsheetQuizAttemptDetails(attemptId);
      if (res.success && res.data) {
        setDetails(res.data);
      } else {
        toast.error("Failed to load attempt details.");
        setIsDetailsOpen(false);
      }
    } catch (error) {
      toast.error("An error occurred loading attempt details.");
      setIsDetailsOpen(false);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  if (view === "quiz") {
    if (!quiz || totalQuestions === 0) {
      return (
        <Alert>
          <AlertTitle>No quiz available</AlertTitle>
          <AlertDescription>
            Ask IT to extract the latest cheatsheet content first.
          </AlertDescription>
        </Alert>
      );
    }

    const currentQuestion = quiz.questions[currentQuestionIndex];

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setView("dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Button>
        </div>

        <form action={formAction} className="space-y-4">
          <input
            type="hidden"
            name="question_ids"
            value={JSON.stringify(quiz.questions.map((question) => question.id))}
          />
          {quiz.questions.map((q) => (
            <input
              key={q.id}
              type="hidden"
              name={`answer_${q.id}`}
              value={answers[q.id] ?? ""}
            />
          ))}

          {state?.error ? (
            <Alert variant="destructive">
              <AlertTitle>Submission failed</AlertTitle>
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}

          {quizStage === "taking" && currentQuestion ? (
            <Card className="border-primary/20 shadow-md">
              <CardHeader className="pb-3 border-b bg-muted/20">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Question {currentQuestionIndex + 1} of {totalQuestions}
                  </span>
                  <Badge variant="outline" className="border-primary/50 text-primary">
                    {answeredCount} Answered
                  </Badge>
                </div>
                {/* Progress Bar */}
                <div className="w-full bg-muted rounded-full h-2 mt-3 overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all duration-300 ease-in-out"
                    style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
                  />
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <h2 className="text-lg font-bold text-foreground leading-snug">
                  {currentQuestion.question}
                </h2>

                <RadioGroup
                  value={answers[currentQuestion.id] ?? ""}
                  onValueChange={(value) =>
                    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }))
                  }
                  className="gap-3"
                >
                  {currentQuestion.options.map((option) => {
                    const isSelected = answers[currentQuestion.id] === option;
                    return (
                      <Label
                        key={option}
                        htmlFor={`${currentQuestion.id}-${option}`}
                        className={`flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? "border-primary bg-primary/5 shadow-sm text-primary font-medium"
                            : "border-muted bg-card hover:bg-muted/30"
                        }`}
                      >
                        <RadioGroupItem
                          id={`${currentQuestion.id}-${option}`}
                          value={option}
                          className="border-primary text-primary"
                        />
                        <span className="text-sm">{option}</span>
                      </Label>
                    );
                  })}
                </RadioGroup>
              </CardContent>

              {/* Stepper Navigation Footer */}
              <div className="flex items-center justify-between border-t p-4 bg-muted/10">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentQuestionIndex === 0}
                >
                  Previous
                </Button>

                {/* Progress dots */}
                <div className="hidden sm:flex items-center gap-1.5">
                  {quiz.questions.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentQuestionIndex(idx)}
                      className={`h-2.5 w-2.5 rounded-full transition-all ${
                        idx === currentQuestionIndex
                          ? "bg-primary ring-2 ring-primary/30 scale-125"
                          : answers[quiz.questions[idx].id]
                          ? "bg-primary/60"
                          : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                      }`}
                    />
                  ))}
                </div>

                {currentQuestionIndex < totalQuestions - 1 ? (
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    className="bg-primary text-white"
                    onClick={() => setQuizStage("review")}
                  >
                    Review Answers
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            <Card className="border-primary/20 shadow-md">
              <CardHeader className="pb-3 border-b bg-muted/20">
                <CardTitle className="text-base font-bold">Review Your Answers</CardTitle>
                <CardDescription>
                  Ensure you've answered all questions before submitting. Click any question to change your choice.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="divide-y max-h-[360px] overflow-y-auto pr-2">
                  {quiz.questions.map((q, idx) => {
                    const answered = answers[q.id];
                    return (
                      <div
                        key={q.id}
                        onClick={() => {
                          setCurrentQuestionIndex(idx);
                          setQuizStage("taking");
                        }}
                        className="py-3 flex items-start justify-between gap-4 cursor-pointer hover:bg-muted/20 px-2 rounded-md transition-colors"
                      >
                        <div className="space-y-1">
                          <p className="font-semibold text-sm">
                            {idx + 1}. {q.question}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {answered ? `Selected: ${answered}` : "Not answered"}
                          </p>
                        </div>
                        <Badge variant={answered ? "default" : "destructive"} className="shrink-0 text-[10px]">
                          {answered ? "Answered" : "Missing"}
                        </Badge>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center gap-3 pt-4 border-t">
                  <Button type="submit" disabled={isPending} className="flex-1">
                    {isPending ? "Submitting Quiz..." : "Submit Quiz"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setCurrentQuestionIndex(0);
                      setQuizStage("taking");
                    }}
                  >
                    Back to taking
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </form>
      </div>
    );
  }

  // Dashboard / Progress View
  return (
    <div className="space-y-6">
      {state?.error ? (
        <Alert variant="destructive">
          <AlertTitle>Submission failed</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      {typeof state?.score === "number" && typeof state?.total === "number" ? (
        <Alert className="border-emerald-500 bg-emerald-500/10 text-emerald-800">
          <AlertTitle className="font-bold flex items-center gap-2">
            <Award className="h-5 w-5 text-emerald-600" /> Quiz Completed!
          </AlertTitle>
          <AlertDescription>
            You scored {state.score} out of {state.total} ({Math.round((state.score / state.total) * 100)}%). Your stats and charts have been updated.
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Total Attempts
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="text-2xl font-bold text-primary">{totalAttempts}</span>
            <BookOpen className="h-6 w-6 text-muted-foreground opacity-50" />
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Average Score
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="text-2xl font-bold text-primary">{averageScorePercent}%</span>
            <TrendingUp className="h-6 w-6 text-muted-foreground opacity-50" />
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Highest Score
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="text-2xl font-bold text-primary">{highestScorePercent}%</span>
            <Trophy className="h-6 w-6 text-muted-foreground opacity-50" />
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Latest Score
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="text-2xl font-bold text-primary">{latestAttempt ? `${latestAttempt.score}/${latestAttempt.total}` : "N/A"}</span>
            <Calendar className="h-6 w-6 text-muted-foreground opacity-50" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Trend Chart */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Score Trend</CardTitle>
            <CardDescription>
              Your performance percentage over the last attempts.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[200px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => [`${value}%`, "Score"]} />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="var(--color-primary, oklch(0.65 0.18 132))"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No attempt data available yet. Complete a quiz to see trends.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Call to action & Quiz source info */}
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Start Daily Quiz</CardTitle>
            <CardDescription>
              Challenge yourself with 10 random travel product and compliance questions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            <div className="rounded-lg bg-muted/50 p-3 text-xs space-y-2 border-l-4 border-primary">
              <p className="font-semibold flex items-center gap-1">
                <Info className="h-3.5 w-3.5 text-primary" /> Daily Learning Objective
              </p>
              <p className="text-muted-foreground leading-normal">
                Quizzes are extracted directly from the corporate visa regulations, IT guidelines, and compliance manuals to help you maintain accurate advisory logs.
              </p>
            </div>
          </CardContent>
          <CardContent className="pt-0">
            <Button
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => {
                setCurrentQuestionIndex(0);
                setQuizStage("taking");
                setView("quiz");
              }}
            >
              Start Quiz
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Previous Attempts List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Attempts History</CardTitle>
          <CardDescription>
            A log of your previous quiz sessions and performance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {attempts.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              You haven't completed any quizzes yet. Click "Start Quiz" above to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground font-semibold">
                    <th className="py-3 px-4">Date Completed</th>
                    <th className="py-3 px-4">Score</th>
                    <th className="py-3 px-4">Percentage</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {attempts.map((attempt) => (
                    <tr key={attempt.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-medium">
                        {format(new Date(attempt.created_at), "MMM d, yyyy 'at' h:mm a")}
                      </td>
                      <td className="py-3 px-4">
                        {attempt.score} / {attempt.total}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={attempt.score / attempt.total >= 0.7 ? "default" : "secondary"}>
                          {Math.round((attempt.score / attempt.total) * 100)}%
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(attempt.id)}
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attempt Details Sheet */}
      <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <SheetContent className="sm:max-w-md overflow-y-auto px-6 py-8">
          <SheetHeader>
            <SheetTitle>Quiz Attempt Details</SheetTitle>
            <SheetDescription>
              {details?.attempt && (
                <span>
                  Completed on {format(new Date(details.attempt.created_at), "MMM d, yyyy 'at' h:mm a")} • Score:{" "}
                  <strong>
                    {details.attempt.score} / {details.attempt.total} (
                    {Math.round((details.attempt.score / details.attempt.total) * 100)}%)
                  </strong>
                </span>
              )}
            </SheetDescription>
          </SheetHeader>

          {isLoadingDetails ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Loading details...</span>
            </div>
          ) : (
            <div className="space-y-6 my-2">
              {details?.questions.map((q, idx) => (
                <div key={q.id} className="border-b pb-4 last:border-0 last:pb-0 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <span className="font-semibold text-sm">
                      {idx + 1}. {q.question}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      {q.category && (
                        <Badge variant="outline" className="text-[10px]">
                          {q.category}
                        </Badge>
                      )}
                      {q.is_correct ? (
                        <span className="text-emerald-600 flex items-center gap-1 text-xs font-semibold">
                          <CheckCircle2 className="h-4 w-4" /> Correct
                        </span>
                      ) : (
                        <span className="text-rose-600 flex items-center gap-1 text-xs font-semibold">
                          <XCircle className="h-4 w-4" /> Incorrect
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-2 text-sm pl-2">
                    {q.options.map((opt) => {
                      const isUserAnswer = q.user_answer === opt;
                      const isCorrectAnswer = q.correct_option === opt;

                      let optClass = "border px-3 py-2 rounded-md";
                      if (isCorrectAnswer) {
                        optClass += " bg-emerald-50 border-emerald-500 text-emerald-800 font-medium dark:bg-emerald-950/20 dark:text-emerald-400";
                      } else if (isUserAnswer && !q.is_correct) {
                        optClass += " bg-rose-50 border-rose-500 text-rose-800 font-medium dark:bg-rose-950/20 dark:text-rose-400";
                      } else {
                        optClass += " border-muted bg-card text-muted-foreground";
                      }

                      return (
                        <div key={opt} className={optClass}>
                          <div className="flex items-center justify-between">
                            <span>{opt}</span>
                            {isCorrectAnswer && (
                              <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-[9px] uppercase">
                                Correct Answer
                              </Badge>
                            )}
                            {isUserAnswer && !q.is_correct && (
                              <Badge className="bg-rose-600 hover:bg-rose-600 text-white text-[9px] uppercase">
                                Your Choice
                              </Badge>
                            )}
                            {isUserAnswer && q.is_correct && (
                              <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-[9px] uppercase">
                                Your Choice
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {q.explanation && (
                    <div className="bg-muted/50 p-2 text-xs rounded mt-2 border-l-2 border-primary text-muted-foreground">
                      <strong>Explanation:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
