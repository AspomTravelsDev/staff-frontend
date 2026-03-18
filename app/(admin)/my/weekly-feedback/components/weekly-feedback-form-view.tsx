"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Clock3 } from "lucide-react";
import type {
  WeeklyFeedbackActivePayload,
  WeeklyFeedbackQuestion,
} from "@/types/weekly-feedback-types";
import {
  useSaveWeeklyFeedbackResponse,
  useWeeklyFeedbackActive,
} from "@/lib/api/hooks/use-weekly-feedback";

interface WeeklyFeedbackFormViewProps {
  initialData: WeeklyFeedbackActivePayload | null;
}

function defaultAnswerFor(question: WeeklyFeedbackQuestion) {
  if (question.type === "multi_choice") return [] as string[];
  if (question.type === "rating") return 0;
  return "";
}

function getRatingScale(question: WeeklyFeedbackQuestion): number[] {
  if (question.type !== "rating") return [];

  const parsed = (question.options ?? [])
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item) && item > 0)
    .sort((a, b) => a - b);

  if (parsed.length > 0) {
    return parsed;
  }

  return [1, 2, 3, 4, 5];
}

export function WeeklyFeedbackFormView({
  initialData,
}: WeeklyFeedbackFormViewProps) {
  const { data, isLoading } = useWeeklyFeedbackActive({ initialData });
  const saveResponse = useSaveWeeklyFeedbackResponse();

  const initialAnswers = useMemo(() => {
    const existing = data?.response?.answers ?? {};
    const questions = data?.form?.questions ?? [];

    return questions.reduce<Record<string, string | string[] | number>>(
      (acc, question, index) => {
        const key = String(index);
        acc[key] = existing[key] ?? defaultAnswerFor(question);
        return acc;
      },
      {},
    );
  }, [data?.form?.questions, data?.response?.answers]);

  const [answers, setAnswers] =
    useState<Record<string, string | string[] | number>>(initialAnswers);

  useEffect(() => {
    setAnswers(initialAnswers);
  }, [initialAnswers]);

  const updateAnswer = (key: string, value: string | string[] | number) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const isComplete = useMemo(() => {
    const questions = data?.form?.questions ?? [];
    if (questions.length === 0) return false;

    return questions.every((question, index) => {
      const value = answers[String(index)];
      if (question.type === "multi_choice")
        return Array.isArray(value) && value.length > 0;
      if (question.type === "rating")
        return typeof value === "number" && value > 0;
      return typeof value === "string" && value.trim().length > 0;
    });
  }, [answers, data?.form?.questions]);

  const answeredCount = useMemo(() => {
    const questions = data?.form?.questions ?? [];

    return questions.filter((question, index) => {
      const value = answers[String(index)];
      if (question.type === "multi_choice") {
        return Array.isArray(value) && value.length > 0;
      }
      if (question.type === "rating") {
        return typeof value === "number" && value > 0;
      }
      return typeof value === "string" && value.trim().length > 0;
    }).length;
  }, [answers, data?.form?.questions]);

  const totalQuestions = data?.form?.questions?.length ?? 0;
  const progressPercent =
    totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  const save = async (markComplete: boolean) => {
    if (!data?.form?.id) return;

    if (markComplete && !isComplete) {
      toast.error("Please answer all questions before submitting.");
      return;
    }

    const result = await saveResponse.mutateAsync({
      form_id: data.form.id,
      answers,
      is_completed: markComplete,
    });

    if (!result.success) {
      toast.error(result.error.error || "Failed to save questionnaire.");
      return;
    }

    toast.success(markComplete ? "Questionnaire submitted." : "Draft saved.");
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-4">Loading questionnaire...</CardContent>
      </Card>
    );
  }

  if (!data?.form) {
    return (
      <Alert>
        <AlertTitle>No questionnaire published</AlertTitle>
        <AlertDescription>
          HR has not published this week&apos;s questionnaire yet.
        </AlertDescription>
      </Alert>
    );
  }

  if (!data.submission_open) {
    return (
      <Alert>
        <AlertTitle>Questionnaire closed</AlertTitle>
        <AlertDescription>
          The submission window for this week has closed. If this blocks your
          report, please contact HR.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Your Progress</CardTitle>
          <CardDescription className="flex items-center gap-2">
            <Clock3 className="h-3.5 w-3.5" />
            {data.form.closes_at
              ? `Submission closes at ${new Date(data.form.closes_at).toLocaleString()}`
              : "Submission closes Friday at 9:00 PM"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>
              Answered {answeredCount} of {totalQuestions}
            </span>
            <Badge variant="outline">{progressPercent}%</Badge>
          </div>
          <div className="h-2 w-full rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-primary transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {data.response?.is_completed ? (
        <Alert>
          <AlertTitle>Completed</AlertTitle>
          <AlertDescription>
            You already submitted this week&apos;s questionnaire. You may still
            review your answers before the cutoff.
          </AlertDescription>
        </Alert>
      ) : null}

      {data.form.questions.map((question, index) => {
        const key = String(index);
        const answer = answers[key];
        const isAnswered =
          (question.type === "multi_choice" &&
            Array.isArray(answer) &&
            answer.length > 0) ||
          (question.type === "rating" &&
            typeof answer === "number" &&
            answer > 0) ||
          (question.type === "single_choice" &&
            typeof answer === "string" &&
            answer.trim().length > 0);

        return (
          <Card key={key}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base">
                    {index + 1}. {question.question}
                  </CardTitle>
                  <CardDescription className="mt-1 flex items-center gap-2">
                    <Badge variant="outline">
                      {question.type.replace("_", " ")}
                    </Badge>
                    {isAnswered ? (
                      <span className="inline-flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Answered
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Pending</span>
                    )}
                  </CardDescription>
                </div>
                <Badge variant="secondary">Required</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {question.type === "single_choice" ? (
                <RadioGroup
                  value={typeof answer === "string" ? answer : ""}
                  onValueChange={(value) => updateAnswer(key, value)}
                  className="gap-2"
                >
                  {(question.options ?? []).map((option) => (
                    <Label
                      key={option}
                      htmlFor={`${key}-${option}`}
                      className="flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer"
                    >
                      <RadioGroupItem value={option} id={`${key}-${option}`} />
                      {option}
                    </Label>
                  ))}
                </RadioGroup>
              ) : null}

              {question.type === "multi_choice" ? (
                <div className="space-y-2">
                  {(question.options ?? []).map((option) => {
                    const selected =
                      Array.isArray(answer) && answer.includes(option);
                    return (
                      <Label
                        key={option}
                        className="flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer"
                      >
                        <Checkbox
                          checked={selected}
                          onCheckedChange={(checked) => {
                            const current = Array.isArray(answer) ? answer : [];
                            if (checked === true) {
                              updateAnswer(key, [...current, option]);
                            } else {
                              updateAnswer(
                                key,
                                current.filter((entry) => entry !== option),
                              );
                            }
                          }}
                        />
                        {option}
                      </Label>
                    );
                  })}
                </div>
              ) : null}

              {question.type === "rating"
                ? (() => {
                    const ratingScale = getRatingScale(question);
                    const gridClass =
                      ratingScale.length <= 5
                        ? "grid-cols-5"
                        : ratingScale.length <= 10
                          ? "grid-cols-5 md:grid-cols-10"
                          : "grid-cols-5 md:grid-cols-10 lg:grid-cols-12";

                    return (
                      <RadioGroup
                        value={String(typeof answer === "number" ? answer : 0)}
                        onValueChange={(value) =>
                          updateAnswer(key, Number(value))
                        }
                        className={`grid ${gridClass} gap-2`}
                      >
                        {ratingScale.map((rating) => (
                          <Label
                            key={rating}
                            htmlFor={`${key}-rating-${rating}`}
                            className="flex items-center gap-2 border rounded-md p-2 cursor-pointer"
                          >
                            <RadioGroupItem
                              value={String(rating)}
                              id={`${key}-rating-${rating}`}
                            />
                            <span className="font-medium">{rating}</span>
                          </Label>
                        ))}
                      </RadioGroup>
                    );
                  })()
                : null}
            </CardContent>
          </Card>
        );
      })}

      <Separator />

      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2">
        <Button
          variant="outline"
          onClick={() => save(false)}
          disabled={saveResponse.isPending}
        >
          Save Draft
        </Button>
        <Button
          onClick={() => save(true)}
          disabled={saveResponse.isPending || !isComplete}
        >
          {isComplete
            ? "Submit Questionnaire"
            : "Answer all questions to submit"}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Need to finish your daily report? Return to{" "}
        <Link href="/my/tasks" className="underline">
          To-Do & Reports
        </Link>{" "}
        after submission.
      </p>
    </div>
  );
}
