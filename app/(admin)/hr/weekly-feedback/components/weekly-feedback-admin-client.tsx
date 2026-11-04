"use client";

import { useMemo, useRef, useState } from "react";
import { format, parseISO, startOfWeek, subWeeks } from "date-fns";
import { toast } from "sonner";
import { toPng } from "html-to-image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Search,
  CalendarDays,
  Plus,
  X,
  Trash2,
  Download,
  Loader2,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  useCloseWeeklyFeedbackForm,
  useCreateWeeklyFeedbackQuestion,
  useDeleteWeeklyFeedbackQuestion,
  usePublishWeeklyFeedbackForm,
  useSaveWeeklyFeedbackDraft,
  useUpdateWeeklyFeedbackQuestion,
  useWeeklyFeedbackAnalytics,
  useWeeklyFeedbackQuestions,
} from "@/lib/api/hooks/use-weekly-feedback";
import {
  LIKERT_LABELS,
  type WeeklyFeedbackAnalyticsQuestionBreakdown,
  type WeeklyFeedbackQuestionBankItem,
  type WeeklyFeedbackQuestionType,
} from "@/types/weekly-feedback-types";

const WEEKLY_TYPES: WeeklyFeedbackQuestionType[] = [
  "single_choice",
  "multi_choice",
  "rating",
];

function buildRatingOptions(): string[] {
  return ["1", "2", "3", "4", "5"];
}

function getCurrentWeekStart() {
  return format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
}

type DistributionPoint = {
  key: string;
  label: string;
  value: number;
  percentage: number;
};

const CHART_COLORS = [
  "#2563eb",
  "#16a34a",
  "#dc2626",
  "#d97706",
  "#7c3aed",
  "#0891b2",
  "#db2777",
  "#4f46e5",
];

function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

function formatDelta(value: number): string {
  if (value === 0) return "0";
  return value > 0 ? `+${value}` : `${value}`;
}

function sanitizeFilename(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function getTooltipPercentage(payload: unknown): number {
  if (!payload || typeof payload !== "object") {
    return 0;
  }

  const direct = payload as { percentage?: unknown };
  if (typeof direct.percentage === "number") {
    return direct.percentage;
  }

  const nested = payload as { payload?: { percentage?: unknown } };
  if (typeof nested.payload?.percentage === "number") {
    return nested.payload.percentage;
  }

  return 0;
}

function formatTooltipValue(
  value: unknown,
  payload: unknown,
): [string, string] {
  const count = toNumber(value);
  const percentage = getTooltipPercentage(payload);
  return [`${count} (${formatPercent(percentage)})`, "Responses"];
}

function getDenominator(
  item: WeeklyFeedbackAnalyticsQuestionBreakdown,
  completedResponses: number,
): number {
  if (item.type === "multi_choice") {
    return completedResponses;
  }

  return item.response_count;
}

function buildDistributionPoints(
  item: WeeklyFeedbackAnalyticsQuestionBreakdown,
  completedResponses: number,
): DistributionPoint[] {
  const entries = Object.entries(item.distribution ?? {});

  if (entries.length === 0) {
    return [];
  }

  const denominator = Math.max(getDenominator(item, completedResponses), 1);
  const points = entries.map(([key, value]) => ({
    key,
    label: item.type === "rating" ? (LIKERT_LABELS[key] ?? key) : key,
    value,
    percentage: (value / denominator) * 100,
  }));

  if (item.type === "rating") {
    return points.sort((a, b) => Number(a.key) - Number(b.key));
  }

  return points.sort((a, b) => b.value - a.value);
}

export function WeeklyFeedbackAdminClient() {
  const [weekStart, setWeekStart] = useState(getCurrentWeekStart());
  const [questionSearch, setQuestionSearch] = useState("");
  const [newQuestion, setNewQuestion] = useState("");
  const [newType, setNewType] =
    useState<WeeklyFeedbackQuestionType>("single_choice");
  const [newOptionItems, setNewOptionItems] = useState<string[]>([
    "Option 1",
    "Option 2",
  ]);

  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(
    null,
  );
  const [editQuestionText, setEditQuestionText] = useState("");
  const [editType, setEditType] =
    useState<WeeklyFeedbackQuestionType>("single_choice");
  const [editOptionItems, setEditOptionItems] = useState<string[]>([]);

  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);
  const [exportingChartId, setExportingChartId] = useState<string | null>(null);
  const [isExportingAllCharts, setIsExportingAllCharts] = useState(false);
  const chartRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const previousWeekStart = useMemo(() => {
    const selectedWeek = parseISO(weekStart);
    if (Number.isNaN(selectedWeek.getTime())) {
      return weekStart;
    }

    return format(subWeeks(selectedWeek, 1), "yyyy-MM-dd");
  }, [weekStart]);

  const { data: questions = [], isLoading: isLoadingQuestions } =
    useWeeklyFeedbackQuestions();
  const { data: analytics, isLoading: isLoadingAnalytics } =
    useWeeklyFeedbackAnalytics(weekStart);
  const { data: previousWeekAnalytics, isLoading: isLoadingPreviousAnalytics } =
    useWeeklyFeedbackAnalytics(previousWeekStart);

  const createQuestion = useCreateWeeklyFeedbackQuestion();
  const deleteQuestion = useDeleteWeeklyFeedbackQuestion();
  const updateQuestion = useUpdateWeeklyFeedbackQuestion();
  const saveDraft = useSaveWeeklyFeedbackDraft();
  const publishForm = usePublishWeeklyFeedbackForm();
  const closeForm = useCloseWeeklyFeedbackForm();

  const selectedCount = selectedQuestionIds.length;

  const currentTotalResponses = analytics?.total_responses ?? 0;
  const currentCompletedResponses = analytics?.completed_responses ?? 0;
  const currentCompletionRate =
    currentTotalResponses > 0
      ? (currentCompletedResponses / currentTotalResponses) * 100
      : 0;
  const currentPendingResponses = Math.max(
    currentTotalResponses - currentCompletedResponses,
    0,
  );

  const previousTotalResponses = previousWeekAnalytics?.total_responses ?? 0;
  const previousCompletedResponses =
    previousWeekAnalytics?.completed_responses ?? 0;
  const previousCompletionRate =
    previousTotalResponses > 0
      ? (previousCompletedResponses / previousTotalResponses) * 100
      : 0;

  const responsesDelta = currentTotalResponses - previousTotalResponses;
  const completionRateDelta = currentCompletionRate - previousCompletionRate;

  const filteredQuestions = useMemo(() => {
    const term = questionSearch.trim().toLowerCase();
    if (!term) return questions;

    return questions.filter((question) => {
      return (
        question.question.toLowerCase().includes(term) ||
        question.type.toLowerCase().includes(term)
      );
    });
  }, [questions, questionSearch]);

  const additionalQuestionPreview = useMemo(() => {
    const options =
      newType === "rating"
        ? buildRatingOptions()
        : newOptionItems.map((item) => item.trim()).filter(Boolean);

    return {
      question: newQuestion.trim(),
      type: newType,
      options,
    };
  }, [newQuestion, newType, newOptionItems]);

  const toggleQuestionSelection = (id: string, checked: boolean) => {
    setSelectedQuestionIds((prev) => {
      if (checked) {
        if (prev.includes(id)) return prev;
        return [...prev, id];
      }
      return prev.filter((item) => item !== id);
    });
  };

  const moveQuestionUp = (index: number) => {
    if (index === 0) return;
    setSelectedQuestionIds((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  };

  const moveQuestionDown = (index: number) => {
    if (index === selectedQuestionIds.length - 1) return;
    setSelectedQuestionIds((prev) => {
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  };

  const onCreateQuestion = async () => {
    const trimmed = newQuestion.trim();
    if (!trimmed) {
      toast.error("Question text is required.");
      return;
    }

    const options = additionalQuestionPreview.options;

    if (newType !== "rating" && options.length === 0) {
      toast.error("Options are required for single or multi-choice questions.");
      return;
    }

    const result = await createQuestion.mutateAsync({
      question: trimmed,
      type: newType,
      options,
      is_default: true,
      is_active: true,
    });

    if (!result.success) {
      toast.error(result.error.error || "Failed to create question.");
      return;
    }

    toast.success("Question created.");
    setNewQuestion("");
    setNewOptionItems(["Option 1", "Option 2"]);
  };

  const addNewOption = () => {
    setNewOptionItems((prev) => [...prev, `Option ${prev.length + 1}`]);
  };

  const updateNewOption = (index: number, value: string) => {
    setNewOptionItems((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const removeNewOption = (index: number) => {
    if (newOptionItems.length <= 2) {
      toast.error("You need at least two options.");
      return;
    }
    setNewOptionItems((prev) => prev.filter((_, i) => i !== index));
  };

  const onDeleteQuestion = async (id: string) => {
    const result = await deleteQuestion.mutateAsync(id);
    if (!result.success) {
      toast.error(result.error.error || "Failed to delete question.");
      return;
    }

    toast.success("Question deleted.");
    setSelectedQuestionIds((prev) => prev.filter((item) => item !== id));
  };

  const onSaveDraft = async () => {
    const additionalQuestions = additionalQuestionPreview.question
      ? [
          {
            question: additionalQuestionPreview.question,
            type: additionalQuestionPreview.type,
            options: additionalQuestionPreview.options,
          },
        ]
      : [];

    const result = await saveDraft.mutateAsync({
      week_start: weekStart,
      question_bank_ids:
        selectedQuestionIds.length > 0 ? selectedQuestionIds : undefined,
      additional_questions:
        additionalQuestions.length > 0 ? additionalQuestions : undefined,
    });

    if (!result.success) {
      toast.error(result.error.error || "Failed to save draft.");
      return;
    }

    toast.success("Draft saved.");
  };

  const onPublish = async () => {
    const additionalQuestions = additionalQuestionPreview.question
      ? [
          {
            question: additionalQuestionPreview.question,
            type: additionalQuestionPreview.type,
            options: additionalQuestionPreview.options,
          },
        ]
      : [];

    const draftResult = await saveDraft.mutateAsync({
      week_start: weekStart,
      question_bank_ids:
        selectedQuestionIds.length > 0 ? selectedQuestionIds : undefined,
      additional_questions:
        additionalQuestions.length > 0 ? additionalQuestions : undefined,
    });

    if (!draftResult.success) {
      toast.error(
        draftResult.error.error ||
          "Failed to save latest selections before publish.",
      );
      return;
    }

    const result = await publishForm.mutateAsync({ week_start: weekStart });
    if (!result.success) {
      toast.error(result.error.error || "Failed to publish form.");
      return;
    }

    toast.success("Weekly questionnaire saved and published.");
  };

  const onClose = async () => {
    const result = await closeForm.mutateAsync({ week_start: weekStart });
    if (!result.success) {
      toast.error(result.error.error || "Failed to close form.");
      return;
    }

    toast.success("Weekly questionnaire closed.");
  };

  const onStartEdit = (question: WeeklyFeedbackQuestionBankItem) => {
    setEditingQuestionId(question.id);
    setEditQuestionText(question.question);
    setEditType(question.type);

    if (question.type === "rating") {
      setEditOptionItems([]);
      return;
    }

    const initialOptions = question.options ?? [];
    if (initialOptions.length === 0) {
      setEditOptionItems(["Option 1", "Option 2"]);
    } else {
      setEditOptionItems(initialOptions);
    }
  };

  const onCancelEdit = () => {
    setEditingQuestionId(null);
    setEditQuestionText("");
    setEditType("single_choice");
    setEditOptionItems([]);
  };

  const addEditOption = () => {
    setEditOptionItems((prev) => [...prev, `Option ${prev.length + 1}`]);
  };

  const updateEditOption = (index: number, value: string) => {
    setEditOptionItems((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const removeEditOption = (index: number) => {
    if (editOptionItems.length <= 2) {
      toast.error("You need at least two options.");
      return;
    }
    setEditOptionItems((prev) => prev.filter((_, i) => i !== index));
  };

  const onSaveEdit = async () => {
    if (!editingQuestionId) return;

    const trimmedQuestion = editQuestionText.trim();
    if (!trimmedQuestion) {
      toast.error("Question text is required.");
      return;
    }

    const nextOptions =
      editType === "rating"
        ? buildRatingOptions()
        : editOptionItems.map((item) => item.trim()).filter(Boolean);

    if (editType !== "rating" && nextOptions.length < 2) {
      toast.error("At least two options are required for choice questions.");
      return;
    }

    const result = await updateQuestion.mutateAsync({
      id: editingQuestionId,
      payload: {
        question: trimmedQuestion,
        type: editType,
        options: nextOptions,
      },
    });

    if (!result.success) {
      toast.error(result.error.error || "Failed to update question.");
      return;
    }

    toast.success("Question updated.");
    onCancelEdit();
  };

  const downloadChartAsPng = async (
    chartNode: HTMLDivElement,
    question: string,
    questionNumber: number,
  ) => {
    const dataUrl = await toPng(chartNode, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "#ffffff",
    });

    const link = document.createElement("a");
    const safeQuestion = sanitizeFilename(question) || "question";
    link.download = `weekly-feedback-${weekStart}-q${questionNumber}-${safeQuestion}.png`;
    link.href = dataUrl;
    link.click();
  };

  const exportChartImage = async (
    chartId: string,
    question: string,
    questionNumber: number,
  ) => {
    const chartNode = chartRefs.current[chartId];

    if (!chartNode) {
      toast.error("Chart not found for export.");
      return;
    }

    setExportingChartId(chartId);

    try {
      await new Promise((resolve) => setTimeout(resolve, 80));

      await downloadChartAsPng(chartNode, question, questionNumber);

      toast.success("Chart exported as PNG.");
    } catch (error) {
      console.error("Chart export failed", error);
      toast.error("Failed to export chart image.");
    } finally {
      setExportingChartId(null);
    }
  };

  const exportAllChartImages = async (
    questionItems: WeeklyFeedbackAnalyticsQuestionBreakdown[],
  ) => {
    setIsExportingAllCharts(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 100));

      let exportedCount = 0;

      for (let index = 0; index < questionItems.length; index += 1) {
        const item = questionItems[index];
        const chartId = `chart-${index}`;
        const chartNode = chartRefs.current[chartId];

        if (!chartNode) {
          continue;
        }

        await downloadChartAsPng(chartNode, item.question, index + 1);
        exportedCount += 1;

        await new Promise((resolve) => setTimeout(resolve, 120));
      }

      if (exportedCount === 0) {
        toast.error("No chart images available to export.");
        return;
      }

      toast.success(`Exported ${exportedCount} chart PNG file(s).`);
    } catch (error) {
      console.error("Export all charts failed", error);
      toast.error("Failed to export all chart images.");
    } finally {
      setIsExportingAllCharts(false);
    }
  };

  return (
    <Tabs defaultValue="manage" className="w-full">
      <TabsList>
        <TabsTrigger value="manage">Manage</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
      </TabsList>

      <TabsContent value="manage" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {/* LEFT PANEL: QUESTION BANK */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Question Bank</CardTitle>
                <CardDescription>
                  Browse and manage reusable questions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={questionSearch}
                    onChange={(event) => setQuestionSearch(event.target.value)}
                    placeholder="Search by text or type..."
                    className="pl-9"
                  />
                </div>

                {isLoadingQuestions ? (
                  <p className="text-sm text-muted-foreground">
                    Loading questions...
                  </p>
                ) : filteredQuestions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No questions found.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-125 overflow-y-auto pr-2">
                    {filteredQuestions.map((question) => {
                      const isSelected = selectedQuestionIds.includes(
                        question.id,
                      );
                      return (
                        <div
                          key={question.id}
                          className={`border rounded-md p-3 transition-colors ${
                            isSelected
                              ? "border-primary/50 bg-primary/5"
                              : "hover:bg-muted/40"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1 truncate">
                              <p
                                className="font-medium text-sm line-clamp-2"
                                title={question.question}
                              >
                                {question.question}
                              </p>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className="text-[10px] uppercase"
                                >
                                  {question.type.replace("_", " ")}
                                </Badge>
                                {question.is_default ? (
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px] uppercase"
                                  >
                                    Default
                                  </Badge>
                                ) : null}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2 shrink-0">
                              <Button
                                size="sm"
                                variant={isSelected ? "secondary" : "default"}
                                onClick={() =>
                                  toggleQuestionSelection(
                                    question.id,
                                    !isSelected,
                                  )
                                }
                              >
                                {isSelected ? "Added" : "Add"}
                              </Button>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs"
                                  onClick={() =>
                                    editingQuestionId === question.id
                                      ? onCancelEdit()
                                      : onStartEdit(question)
                                  }
                                  disabled={updateQuestion.isPending}
                                >
                                  {editingQuestionId === question.id
                                    ? "Close"
                                    : "Edit"}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                                  onClick={() =>
                                    setQuestionToDelete(question.id)
                                  }
                                  disabled={deleteQuestion.isPending}
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </div>

                          {editingQuestionId === question.id ? (
                            <div className="mt-3 rounded-md border bg-muted/30 p-3 space-y-3">
                              <div className="grid gap-2">
                                <Label htmlFor={`edit-question-${question.id}`}>
                                  Question
                                </Label>
                                <Input
                                  id={`edit-question-${question.id}`}
                                  value={editQuestionText}
                                  onChange={(event) =>
                                    setEditQuestionText(event.target.value)
                                  }
                                />
                              </div>

                              <div className="grid gap-2 max-w-xs">
                                <Label htmlFor={`edit-type-${question.id}`}>
                                  Type
                                </Label>
                                <Select
                                  value={editType}
                                  onValueChange={(value) => {
                                    const nextType =
                                      value as WeeklyFeedbackQuestionType;
                                    setEditType(nextType);
                                  }}
                                >
                                  <SelectTrigger
                                    id={`edit-type-${question.id}`}
                                    className="w-full"
                                  >
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {WEEKLY_TYPES.map((type) => (
                                      <SelectItem key={type} value={type}>
                                        {type.replace("_", " ")}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {editType !== "rating" ? (
                                <div className="space-y-3 pt-2">
                                  <Label>Options</Label>
                                  {editOptionItems.map((opt, i) => (
                                    <div
                                      className="flex items-center gap-2"
                                      key={`edit-opt-${i}`}
                                    >
                                      <Input
                                        value={opt}
                                        onChange={(e) =>
                                          updateEditOption(i, e.target.value)
                                        }
                                        placeholder={`Option ${i + 1}`}
                                      />
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-destructive hover:text-destructive shrink-0"
                                        onClick={() => removeEditOption(i)}
                                        title="Remove option"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ))}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={addEditOption}
                                    className="w-full mt-2"
                                  >
                                    <Plus className="mr-2 h-4 w-4" /> Add Option
                                  </Button>
                                </div>
                              ) : (
                                <div className="mt-4 rounded-md border p-4 bg-muted/10 space-y-3">
                                  <Label className="block">
                                    Rating Scale (Fixed 5-Point Likert)
                                  </Label>
                                  <div className="flex flex-col gap-2">
                                    {Object.entries(LIKERT_LABELS).map(
                                      ([val, label]) => (
                                        <div
                                          key={val}
                                          className="flex items-center gap-3"
                                        >
                                          <Badge
                                            variant="outline"
                                            className="w-8 justify-center shrink-0"
                                          >
                                            {val}
                                          </Badge>
                                          <span className="text-sm font-medium">
                                            {label}
                                          </span>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </div>
                              )}

                              <div className="flex items-center gap-2">
                                <Button
                                  onClick={onSaveEdit}
                                  disabled={updateQuestion.isPending}
                                >
                                  Save Changes
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={onCancelEdit}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* CREATE QUESTION ACCORDION / CARD */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  Create New Question
                </CardTitle>
                <CardDescription>
                  Add a new reusable question to the bank.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="question">Question Text</Label>
                  <Input
                    id="question"
                    value={newQuestion}
                    onChange={(event) => setNewQuestion(event.target.value)}
                    placeholder="How would you rate team collaboration this week?"
                  />
                </div>

                <div className="grid gap-2 max-w-xs">
                  <Label htmlFor="question-type">Type</Label>
                  <Select
                    value={newType}
                    onValueChange={(value) => {
                      setNewType(value as WeeklyFeedbackQuestionType);
                    }}
                  >
                    <SelectTrigger id="question-type" className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {WEEKLY_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {newType !== "rating" ? (
                  <div className="space-y-3 pt-2">
                    <Label>Options</Label>
                    {newOptionItems.map((opt, i) => (
                      <div
                        className="flex items-center gap-2"
                        key={`new-opt-${i}`}
                      >
                        <Input
                          value={opt}
                          onChange={(e) => updateNewOption(i, e.target.value)}
                          placeholder={`Option ${i + 1}`}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive shrink-0"
                          onClick={() => removeNewOption(i)}
                          title="Remove option"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addNewOption}
                      className="w-full mt-2"
                    >
                      <Plus className="mr-2 h-4 w-4" /> Add Option
                    </Button>
                  </div>
                ) : (
                  <div className="mt-4 rounded-md border p-4 bg-muted/10 space-y-3">
                    <Label className="block">
                      Rating Scale (Fixed 5-Point Likert)
                    </Label>
                    <div className="flex flex-col gap-2">
                      {Object.entries(LIKERT_LABELS).map(([val, label]) => (
                        <div key={val} className="flex items-center gap-3">
                          <Badge
                            variant="outline"
                            className="w-8 justify-center shrink-0"
                          >
                            {val}
                          </Badge>
                          <span className="text-sm font-medium">{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={onCreateQuestion}
                  disabled={createQuestion.isPending}
                  className="w-full md:w-auto"
                >
                  Create Question
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT PANEL: THIS WEEK'S FORM */}
          <div className="space-y-4 md:sticky md:top-4">
            <Card className="border-primary/20 shadow-sm">
              <CardHeader className="bg-primary/5 pb-4 border-b">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl">
                      This Week&apos;s Form
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Compose the questions and publish.
                    </CardDescription>
                  </div>
                  <Badge variant="default" className="text-sm">
                    {selectedCount} Questions
                  </Badge>
                </div>

                <div className="mt-4 grid gap-2">
                  <Label
                    htmlFor="week-start"
                    className="font-semibold flex items-center gap-2"
                  >
                    <CalendarDays className="h-4 w-4" />
                    Target Week (Monday)
                  </Label>
                  <Input
                    id="week-start"
                    type="date"
                    value={weekStart}
                    onChange={(event) => setWeekStart(event.target.value)}
                    className="max-w-50"
                  />
                </div>
              </CardHeader>

              <CardContent className="pt-4 space-y-4">
                {selectedQuestionIds.length === 0 ? (
                  <div className="py-8 text-center border-2 border-dashed rounded-lg bg-muted/20">
                    <p className="text-muted-foreground">
                      No questions selected.
                      <br />
                      Click &quot;Add&quot; on a question from the bank to
                      include it.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedQuestionIds.map((id, index) => {
                      const question = questions.find((q) => q.id === id);
                      if (!question) return null;

                      return (
                        <div
                          key={id}
                          className="flex items-center gap-3 p-3 bg-card border rounded-lg shadow-sm"
                        >
                          <div className="flex flex-col gap-1 items-center shrink-0">
                            <button
                              type="button"
                              className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
                              disabled={index === 0}
                              onClick={() => moveQuestionUp(index)}
                              title="Move up"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="18 15 12 9 6 15"></polyline>
                              </svg>
                            </button>
                            <span className="text-xs font-semibold text-muted-foreground w-4 text-center">
                              {index + 1}
                            </span>
                            <button
                              type="button"
                              className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
                              disabled={
                                index === selectedQuestionIds.length - 1
                              }
                              onClick={() => moveQuestionDown(index)}
                              title="Move down"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="6 9 12 15 18 9"></polyline>
                              </svg>
                            </button>
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm line-clamp-2">
                              {question.question}
                            </p>
                            <span className="text-xs text-muted-foreground uppercase mt-1 inline-block">
                              {question.type.replace("_", " ")}
                            </span>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => toggleQuestionSelection(id, false)}
                            title="Remove from form"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <Separator />

                <div className="grid gap-3">
                  <div className="flex gap-3">
                    <Button
                      className="flex-1"
                      variant="outline"
                      onClick={onSaveDraft}
                      disabled={saveDraft.isPending}
                    >
                      Save Draft
                    </Button>
                    <Button
                      className="flex-1 shadow-md bg-green-600 hover:bg-green-700"
                      onClick={onPublish}
                      disabled={
                        publishForm.isPending ||
                        saveDraft.isPending ||
                        selectedCount === 0
                      }
                    >
                      Publish to Staff
                    </Button>
                  </div>
                  <Button
                    variant="link"
                    className="text-destructive w-full"
                    onClick={onClose}
                    disabled={closeForm.isPending}
                  >
                    Close Form Manually
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="analytics" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Analytics Dashboard</CardTitle>
            <CardDescription>
              Visual insights by question type with completion KPIs for the
              selected week.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-2 max-w-xs">
              <Label htmlFor="analytics-week-start">Week Start (Monday)</Label>
              <Input
                id="analytics-week-start"
                type="date"
                value={weekStart}
                onChange={(event) => setWeekStart(event.target.value)}
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  exportAllChartImages(analytics?.question_breakdown ?? [])
                }
                disabled={
                  isExportingAllCharts ||
                  (analytics?.question_breakdown ?? []).length === 0
                }
              >
                {isExportingAllCharts ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                {isExportingAllCharts ? "Exporting All..." : "Export All PNG"}
              </Button>
            </div>

            {isLoadingAnalytics || isLoadingPreviousAnalytics ? (
              <p className="text-sm text-muted-foreground">
                Loading analytics...
              </p>
            ) : (
              <>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Total Responses</CardDescription>
                      <CardTitle className="text-2xl">
                        {currentTotalResponses}
                      </CardTitle>
                    </CardHeader>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Completed Responses</CardDescription>
                      <CardTitle className="text-2xl">
                        {currentCompletedResponses}
                      </CardTitle>
                    </CardHeader>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Completion Rate</CardDescription>
                      <CardTitle className="text-2xl">
                        {formatPercent(currentCompletionRate)}
                      </CardTitle>
                    </CardHeader>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Pending Responses</CardDescription>
                      <CardTitle className="text-2xl">
                        {currentPendingResponses}
                      </CardTitle>
                    </CardHeader>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Week-over-Week</CardDescription>
                      <CardTitle className="text-sm leading-relaxed">
                        Responses: {formatDelta(responsesDelta)}
                        <br />
                        Completion:{" "}
                        {formatDelta(Math.round(completionRateDelta))}%
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        Compared with week of {previousWeekStart}
                      </p>
                    </CardHeader>
                  </Card>
                </div>

                {(analytics?.question_breakdown ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No analytics yet for this week.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {analytics?.question_breakdown.map((item, index) => {
                      const chartId = `chart-${index}`;
                      const points = buildDistributionPoints(
                        item,
                        analytics?.completed_responses ?? 0,
                      );
                      const useDonut =
                        item.type === "single_choice" && points.length <= 6;

                      return (
                        <Card key={`${item.question}-${index}`}>
                          <CardHeader className="pb-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <CardTitle className="text-base">
                                {index + 1}. {item.question}
                              </CardTitle>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline">
                                  {item.type.replace("_", " ")} · Responses:{" "}
                                  {item.response_count}
                                </Badge>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8"
                                  onClick={() =>
                                    exportChartImage(
                                      chartId,
                                      item.question,
                                      index + 1,
                                    )
                                  }
                                  disabled={
                                    points.length === 0 ||
                                    exportingChartId === chartId
                                  }
                                >
                                  {exportingChartId === chartId ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <Download className="mr-2 h-4 w-4" />
                                  )}
                                  {exportingChartId === chartId
                                    ? "Exporting..."
                                    : "Export PNG"}
                                </Button>
                              </div>
                            </div>
                            {typeof item.average_rating === "number" ? (
                              <CardDescription>
                                Average rating: {item.average_rating.toFixed(2)}
                              </CardDescription>
                            ) : null}
                          </CardHeader>

                          <CardContent className="space-y-3">
                            {points.length === 0 ? (
                              <p className="text-sm text-muted-foreground">
                                No distribution data available.
                              </p>
                            ) : (
                              <div
                                ref={(node) => {
                                  chartRefs.current[chartId] = node;
                                }}
                                className="rounded-md border bg-white p-3"
                              >
                                <div className="mb-3 space-y-1 border-b pb-3">
                                  <p className="text-sm font-semibold text-slate-900">
                                    {index + 1}. {item.question}
                                  </p>
                                  <p className="text-xs text-slate-600">
                                    Week: {weekStart} · Type:{" "}
                                    {item.type.replace("_", " ")} · Responses:{" "}
                                    {item.response_count}
                                  </p>
                                  {typeof item.average_rating === "number" ? (
                                    <p className="text-xs text-slate-600">
                                      Average rating:{" "}
                                      {item.average_rating.toFixed(2)}
                                    </p>
                                  ) : null}
                                </div>

                                {item.type === "rating" ? (
                                  <div className="h-72 w-full">
                                    <ResponsiveContainer
                                      width="100%"
                                      height="100%"
                                    >
                                      <BarChart data={points}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                          dataKey="label"
                                          interval={0}
                                          tick={{ fontSize: 11 }}
                                          angle={-20}
                                          textAnchor="end"
                                          height={72}
                                        />
                                        <YAxis allowDecimals={false} />
                                        <Tooltip
                                          formatter={(value, _name, item) =>
                                            formatTooltipValue(
                                              value,
                                              (
                                                item as
                                                  | { payload?: unknown }
                                                  | undefined
                                              )?.payload,
                                            )
                                          }
                                          labelFormatter={(label) =>
                                            `Rating: ${String(label)}`
                                          }
                                        />
                                        <Bar
                                          dataKey="value"
                                          fill="#2563eb"
                                          radius={[6, 6, 0, 0]}
                                        />
                                      </BarChart>
                                    </ResponsiveContainer>
                                  </div>
                                ) : useDonut ? (
                                  <div className="h-80 w-full">
                                    <ResponsiveContainer
                                      width="100%"
                                      height="100%"
                                    >
                                      <PieChart>
                                        <Pie
                                          data={points}
                                          dataKey="value"
                                          nameKey="label"
                                          cx="50%"
                                          cy="50%"
                                          outerRadius={100}
                                          label={({ percent }) =>
                                            `${Math.round(
                                              (percent ?? 0) * 100,
                                            )}%`
                                          }
                                        >
                                          {points.map((point, pointIndex) => (
                                            <Cell
                                              key={`${point.key}-${pointIndex}`}
                                              fill={
                                                CHART_COLORS[
                                                  pointIndex %
                                                    CHART_COLORS.length
                                                ]
                                              }
                                            />
                                          ))}
                                        </Pie>
                                        <Tooltip
                                          formatter={(value, _name, item) =>
                                            formatTooltipValue(
                                              value,
                                              (
                                                item as
                                                  | { payload?: unknown }
                                                  | undefined
                                              )?.payload,
                                            )
                                          }
                                        />
                                        <Legend />
                                      </PieChart>
                                    </ResponsiveContainer>
                                  </div>
                                ) : (
                                  <div className="h-80 w-full">
                                    <ResponsiveContainer
                                      width="100%"
                                      height="100%"
                                    >
                                      <BarChart data={points} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                          type="number"
                                          allowDecimals={false}
                                        />
                                        <YAxis
                                          type="category"
                                          dataKey="label"
                                          width={170}
                                        />
                                        <Tooltip
                                          formatter={(value, _name, item) =>
                                            formatTooltipValue(
                                              value,
                                              (
                                                item as
                                                  | { payload?: unknown }
                                                  | undefined
                                              )?.payload,
                                            )
                                          }
                                        />
                                        <Bar
                                          dataKey="value"
                                          fill="#16a34a"
                                          radius={[0, 6, 6, 0]}
                                        />
                                      </BarChart>
                                    </ResponsiveContainer>
                                  </div>
                                )}
                              </div>
                            )}

                            {item.distribution ? (
                              <p className="text-xs text-muted-foreground">
                                Distribution:{" "}
                                {Object.entries(item.distribution)
                                  .map(([key, value]) => {
                                    const label =
                                      item.type === "rating"
                                        ? (LIKERT_LABELS[key] ?? key)
                                        : key;
                                    return `${label}: ${value}`;
                                  })
                                  .join(" | ")}
                              </p>
                            ) : null}

                            {item.type === "multi_choice" ? (
                              <p className="text-xs text-muted-foreground">
                                Note: Multi-choice totals can exceed completed
                                responses because staff may select multiple
                                options.
                              </p>
                            ) : null}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <AlertDialog
        open={!!questionToDelete}
        onOpenChange={(open) => !open && setQuestionToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              question from the question bank. It will also be removed from any
              draft forms.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteQuestion.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (questionToDelete) {
                  onDeleteQuestion(questionToDelete);
                  setQuestionToDelete(null);
                }
              }}
              disabled={deleteQuestion.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteQuestion.isPending ? "Deleting..." : "Delete Question"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Tabs>
  );
}
