"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Trash2,
  BookOpen,
  Users,
  TrendingUp,
  Search,
  Loader2,
  Calendar,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Pencil,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  createCheatsheetSourceAction,
  deleteCheatsheetItemAction,
  deleteCheatsheetQuestionAction,
  extractCheatsheetSourceAction,
  updateCheatsheetItemAction,
  updateCheatsheetQuestionAction,
  updateCheatsheetSourceAction,
  getAdminDepartmentAttemptsAction,
} from "../actions";
import { getCheatsheetQuizAttemptDetails } from "@/lib/api/cheatsheet";
import type {
  CheatsheetAnalytics,
  CheatsheetItemAdmin,
  CheatsheetQuestionAdmin,
  CheatsheetSource,
  CheatsheetQuizAttempt,
  CheatsheetQuizAttemptDetail,
  CheatsheetDepartmentPerformance,
} from "@/types/cheatsheet-types";
import { format } from "date-fns";

interface CheatsheetAdminClientProps {
  initialSources: CheatsheetSource[];
  initialItems: CheatsheetItemAdmin[];
  initialQuestions: CheatsheetQuestionAdmin[];
  analytics: CheatsheetAnalytics | null;
}

export function CheatsheetAdminClient({
  initialSources,
  initialItems,
  initialQuestions,
  analytics,
}: CheatsheetAdminClientProps) {
  const [sources, setSources] = useState<CheatsheetSource[]>(initialSources);
  const [items, setItems] = useState<CheatsheetItemAdmin[]>(initialItems);
  const [questions, setQuestions] =
    useState<CheatsheetQuestionAdmin[]>(initialQuestions);

  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [savingSource, setSavingSource] = useState(false);
  const [draftSources, setDraftSources] = useState<Record<string, string>>({});
  const [extractingSourceId, setExtractingSourceId] = useState<string | null>(
    null,
  );
  const [savingDraftId, setSavingDraftId] = useState<string | null>(null);

  // Analytics state
  const [selectedDept, setSelectedDept] = useState<CheatsheetDepartmentPerformance | null>(null);
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);
  const [deptAttempts, setDeptAttempts] = useState<CheatsheetQuizAttempt[]>([]);
  const [loadingDeptAttempts, setLoadingDeptAttempts] = useState(false);
  const [attemptDetails, setAttemptDetails] = useState<CheatsheetQuizAttemptDetail | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Editing states for Cheatsheet Items
  const [editingItem, setEditingItem] = useState<CheatsheetItemAdmin | null>(null);
  const [itemForm, setItemForm] = useState({
    title: "",
    category: "",
    content: "",
  });
  const [savingItem, setSavingItem] = useState(false);

  // Editing states for Quiz Questions
  const [editingQuestion, setEditingQuestion] = useState<CheatsheetQuestionAdmin | null>(null);
  const [questionForm, setQuestionForm] = useState({
    question: "",
    category: "",
    options: ["", "", "", ""],
    correct_option: "",
    explanation: "",
  });
  const [savingQuestion, setSavingQuestion] = useState(false);

  const filteredDepts = useMemo(() => {
    if (!analytics || !analytics.department_performance) return [];
    return analytics.department_performance.filter((dp) =>
      dp.department.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [analytics, searchQuery]);

  const handleSelectDept = async (dept: CheatsheetDepartmentPerformance) => {
    setSelectedDept(dept);
    setSelectedAttemptId(null);
    setAttemptDetails(null);
    setDeptAttempts([]);
    setLoadingDeptAttempts(true);

    const result = await getAdminDepartmentAttemptsAction(dept.department);
    setLoadingDeptAttempts(false);
    if (!result.success || !result.data) {
      toast.error(result.error || "Failed to load attempts history");
      return;
    }
    setDeptAttempts(result.data);
  };

  const handleInspectAttempt = async (attemptId: string) => {
    setSelectedAttemptId(attemptId);
    setLoadingDetails(true);
    setAttemptDetails(null);

    const result = await getCheatsheetQuizAttemptDetails(attemptId);
    setLoadingDetails(false);
    if (!result.success) {
      toast.error(result.error?.error || "Failed to load attempt details");
      return;
    }
    setAttemptDetails(result.data);
  };

  const activeItems = useMemo(
    () => items.filter((item) => item.is_active),
    [items],
  );

  const activeQuestions = useMemo(
    () => questions.filter((question) => question.is_active),
    [questions],
  );

  const handleCreateSource = async () => {
    if (!newContent.trim()) {
      toast.error("Source content is required.");
      return;
    }

    setSavingSource(true);
    const result = await createCheatsheetSourceAction({
      title: newTitle.trim() || null,
      content: newContent.trim(),
    });
    setSavingSource(false);

    if (!result.success || !result.data) {
      toast.error(result.error || "Failed to create source");
      return;
    }

    setSources((prev) => [result.data!, ...prev]);
    setNewTitle("");
    setNewContent("");
    toast.success("Source saved. You can extract now.");
  };

  const handleExtract = async (sourceId: string) => {
    setExtractingSourceId(sourceId);
    const result = await extractCheatsheetSourceAction(sourceId);
    setExtractingSourceId(null);
    if (!result.success) {
      toast.error(result.error || "Failed to extract");
      return;
    }

    toast.success("Extraction completed. Refresh for new items.");
  };

  const handleUpdateSource = async (
    sourceId: string,
    payload: Partial<CheatsheetSource>,
  ) => {
    const result = await updateCheatsheetSourceAction(sourceId, payload);
    if (!result.success || !result.data) {
      toast.error(result.error || "Failed to update source");
      return;
    }

    setSources((prev) =>
      prev.map((source) => (source.id === sourceId ? result.data! : source)),
    );
  };

  const handleDraftChange = (sourceId: string, value: string) => {
    setDraftSources((prev) => ({ ...prev, [sourceId]: value }));
  };

  const handleSaveDraft = async (source: CheatsheetSource) => {
    const nextContent = draftSources[source.id];
    if (typeof nextContent !== "string") {
      toast.info("No changes to save.");
      return;
    }

    setSavingDraftId(source.id);
    const result = await updateCheatsheetSourceAction(source.id, {
      content: nextContent,
    });
    setSavingDraftId(null);
    if (!result.success || !result.data) {
      toast.error(result.error || "Failed to update source");
      return;
    }

    setSources((prev) =>
      prev.map((item) => (item.id === source.id ? result.data! : item)),
    );
    setDraftSources((prev) => {
      const { [source.id]: _, ...rest } = prev;
      return rest;
    });
    toast.success("Source updated.");
  };

  const handleToggleItem = async (itemId: string, isActive: boolean) => {
    const result = await updateCheatsheetItemAction(itemId, {
      is_active: isActive,
    });
    if (!result.success || !result.data) {
      toast.error(result.error || "Failed to update item");
      return;
    }

    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? result.data! : item)),
    );
  };

  const handleToggleQuestion = async (
    questionId: string,
    isActive: boolean,
  ) => {
    const result = await updateCheatsheetQuestionAction(questionId, {
      is_active: isActive,
    });
    if (!result.success || !result.data) {
      toast.error(result.error || "Failed to update question");
      return;
    }

    setQuestions((prev) =>
      prev.map((question) =>
        question.id === questionId ? result.data! : question,
      ),
    );
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this cheatsheet item?")) {
      return;
    }
    const result = await deleteCheatsheetItemAction(itemId);
    if (!result.success) {
      toast.error(result.error || "Failed to delete item");
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== itemId));
    toast.success("Cheatsheet item deleted successfully.");
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm("Are you sure you want to delete this quiz question?")) {
      return;
    }
    const result = await deleteCheatsheetQuestionAction(questionId);
    if (!result.success) {
      toast.error(result.error || "Failed to delete question");
      return;
    }
    setQuestions((prev) => prev.filter((q) => q.id !== questionId));
    toast.success("Quiz question deleted successfully.");
  };

  const startEditItem = (item: CheatsheetItemAdmin) => {
    setEditingItem(item);
    setItemForm({
      title: item.title,
      category: item.category || "",
      content: item.content,
    });
  };

  const handleUpdateItemSubmit = async () => {
    if (!editingItem) return;
    if (!itemForm.title.trim() || !itemForm.content.trim()) {
      toast.error("Title and Content are required.");
      return;
    }
    
    setSavingItem(true);
    const result = await updateCheatsheetItemAction(editingItem.id, {
      title: itemForm.title.trim(),
      category: itemForm.category.trim() || null,
      content: itemForm.content.trim(),
    });
    setSavingItem(false);
    
    if (!result.success || !result.data) {
      toast.error(result.error || "Failed to update item");
      return;
    }
    
    setItems((prev) =>
      prev.map((item) => (item.id === editingItem.id ? result.data! : item))
    );
    setEditingItem(null);
    toast.success("Cheatsheet item updated successfully.");
  };

  const startEditQuestion = (q: CheatsheetQuestionAdmin) => {
    setEditingQuestion(q);
    setQuestionForm({
      question: q.question,
      category: q.category || "",
      options: [...q.options, "", "", "", ""].slice(0, 4).map(o => o || ""),
      correct_option: q.correct_option,
      explanation: q.explanation || "",
    });
  };

  const handleUpdateQuestionSubmit = async () => {
    if (!editingQuestion) return;
    if (!questionForm.question.trim()) {
      toast.error("Question text is required.");
      return;
    }
    
    const validOptions = questionForm.options.map(o => o.trim()).filter(Boolean);
    if (validOptions.length < 2) {
      toast.error("At least 2 options are required.");
      return;
    }
    
    if (!questionForm.correct_option.trim()) {
      toast.error("Correct option is required.");
      return;
    }
    
    if (!validOptions.includes(questionForm.correct_option.trim())) {
      toast.error("Correct option must match one of the options exactly.");
      return;
    }
    
    setSavingQuestion(true);
    const result = await updateCheatsheetQuestionAction(editingQuestion.id, {
      question: questionForm.question.trim(),
      category: questionForm.category.trim() || null,
      options: validOptions,
      correct_option: questionForm.correct_option.trim(),
      explanation: questionForm.explanation.trim() || null,
    });
    setSavingQuestion(false);
    
    if (!result.success || !result.data) {
      toast.error(result.error || "Failed to update question");
      return;
    }
    
    setQuestions((prev) =>
      prev.map((q) => (q.id === editingQuestion.id ? result.data! : q))
    );
    setEditingQuestion(null);
    toast.success("Quiz question updated successfully.");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cheatsheet Admin</h1>
        <p className="text-muted-foreground">
          Upload source content, run AI extraction, and manage quiz questions.
        </p>
      </div>

      <Tabs defaultValue="sources" className="space-y-4">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="sources">Sources</TabsTrigger>
          <TabsTrigger value="items">Cheatsheet Items</TabsTrigger>
          <TabsTrigger value="questions">Quiz Questions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="sources">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">New Source</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Optional title"
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
              />
              <Textarea
                placeholder="Paste the source content here..."
                className="min-h-45"
                value={newContent}
                onChange={(event) => setNewContent(event.target.value)}
              />
              <Button onClick={handleCreateSource} disabled={savingSource}>
                {savingSource ? "Saving..." : "Save Source"}
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {sources.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  No sources yet. Add one above to get started.
                </CardContent>
              </Card>
            ) : (
              sources.map((source) => (
                <Card key={source.id}>
                  <CardHeader className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle className="text-base">
                        {source.title || "Untitled Source"}
                      </CardTitle>
                      <Badge
                        variant="outline"
                        className="uppercase text-[10px]"
                      >
                        {source.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Updated{" "}
                      {format(new Date(source.updated_at), "MMM d, yyyy")}
                      {source.extracted_at
                        ? ` • Extracted ${format(new Date(source.extracted_at), "MMM d, yyyy")}`
                        : ""}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Textarea
                      value={draftSources[source.id] ?? source.content}
                      onChange={(event) =>
                        handleDraftChange(source.id, event.target.value)
                      }
                      className="min-h-35"
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleSaveDraft(source)}
                        disabled={savingDraftId === source.id}
                      >
                        {savingDraftId === source.id
                          ? "Saving..."
                          : "Save Changes"}
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => handleExtract(source.id)}
                        disabled={extractingSourceId === source.id}
                      >
                        {extractingSourceId === source.id
                          ? "Extracting..."
                          : "Extract with AI"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          handleUpdateSource(source.id, {
                            status:
                              source.status === "archived"
                                ? "draft"
                                : "archived",
                          })
                        }
                      >
                        {source.status === "archived" ? "Restore" : "Archive"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="items">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cheatsheet Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Badge variant="outline">Total {items.length}</Badge>
                <Badge variant="outline">Active {activeItems.length}</Badge>
              </div>
              <Separator />
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-2 rounded-lg border p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-sm">{item.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.category || "General"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground">Active</span>
                          <Switch
                            checked={item.is_active}
                            onCheckedChange={(checked) =>
                              handleToggleItem(item.id, checked)
                            }
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:bg-muted"
                          onClick={() => startEditItem(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {item.content}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questions">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quiz Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Badge variant="outline">Total {questions.length}</Badge>
                <Badge variant="outline">Active {activeQuestions.length}</Badge>
              </div>
              <Separator />
              <div className="space-y-3">
                {questions.map((question) => (
                  <div
                    key={question.id}
                    className="flex flex-col gap-2 rounded-lg border p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="space-y-1">
                        <p className="font-semibold text-sm">
                          {question.question}
                        </p>
                        {question.category && (
                          <Badge variant="outline" className="text-[10px] border-primary/30 text-primary font-semibold">
                            {question.category}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground">Active</span>
                          <Switch
                            checked={question.is_active}
                            onCheckedChange={(checked) =>
                              handleToggleQuestion(question.id, checked)
                            }
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:bg-muted"
                          onClick={() => startEditQuestion(question)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleDeleteQuestion(question.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {question.options.map((option) => (
                        <Badge
                          key={option}
                          variant={
                            option === question.correct_option
                              ? "default"
                              : "outline"
                          }
                        >
                          {option}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {analytics ? (
            <>
              {/* Summary Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-card border shadow-sm">
                  <CardContent className="pt-6 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Total Quiz Submissions</p>
                      <p className="text-3xl font-bold tracking-tight text-foreground">{analytics.total_responses}</p>
                    </div>
                    <div className="p-3 bg-primary/10 text-primary rounded-xl">
                      <BookOpen className="h-6 w-6" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border shadow-sm">
                  <CardContent className="pt-6 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Active Departments</p>
                      <p className="text-3xl font-bold tracking-tight text-foreground">
                        {analytics.department_performance?.filter((dp) => dp.attempts_count > 0).length ?? 0}
                      </p>
                    </div>
                    <div className="p-3 bg-primary/10 text-primary rounded-xl">
                      <Users className="h-6 w-6" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border shadow-sm">
                  <CardContent className="pt-6 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Global Average Score</p>
                      <p className="text-3xl font-bold tracking-tight text-foreground">{analytics.average_score}%</p>
                    </div>
                    <div className="p-3 bg-primary/10 text-primary rounded-xl">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Main Dashboard Section: Department Grid + Question Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Department Performance Table Column */}
                <Card className="lg:col-span-2 shadow-sm">
                  <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg font-bold">Department Performance</CardTitle>
                      <p className="text-xs text-muted-foreground">Track participation and grades by department.</p>
                    </div>
                    {/* Search & Filters */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="relative w-full sm:w-48">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search department..."
                          className="pl-9 h-9 text-xs"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto rounded-md border border-muted/60">
                      <table className="w-full text-sm border-collapse text-left">
                        <thead>
                          <tr className="border-b bg-muted/30 text-xs font-semibold text-muted-foreground uppercase">
                            <th className="p-3">Department</th>
                            <th className="p-3 text-center">Active Staff</th>
                            <th className="p-3 text-center">Quizzes</th>
                            <th className="p-3 text-center">Avg Score</th>
                            <th className="p-3 text-center">High Score</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {filteredDepts.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                No department records match the current filters.
                              </td>
                            </tr>
                          ) : (
                            filteredDepts.map((dp) => {
                              const scoreColorClass = (score: number | null) => {
                                if (score === null) return "bg-muted text-muted-foreground";
                                if (score >= 80) return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-200/50";
                                if (score >= 50) return "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-200/50";
                                return "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border-rose-200/50";
                              };

                              const initials = dp.department.substring(0, 2).toUpperCase();

                              return (
                                <tr
                                  key={dp.department}
                                  className="hover:bg-muted/20 transition-colors group cursor-pointer"
                                  onClick={() => handleSelectDept(dp)}
                                >
                                  <td className="p-3 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                      {initials}
                                    </div>
                                    <div>
                                      <p className="font-medium text-foreground truncate group-hover:text-primary transition-colors text-xs">
                                        {dp.department}
                                      </p>
                                    </div>
                                  </td>
                                  <td className="p-3 text-center text-xs font-semibold text-muted-foreground">
                                    {dp.staff_count}
                                  </td>
                                  <td className="p-3 text-center font-semibold text-xs">{dp.attempts_count}</td>
                                  <td className="p-3 text-center">
                                    {dp.average_score !== null ? (
                                      <Badge variant="outline" className={`${scoreColorClass(dp.average_score)} font-semibold text-[10px]`}>
                                        {dp.average_score}%
                                      </Badge>
                                    ) : (
                                      <span className="text-muted-foreground text-xs">-</span>
                                    )}
                                  </td>
                                  <td className="p-3 text-center">
                                    {dp.highest_score !== null ? (
                                      <span className="font-semibold text-xs text-muted-foreground">{dp.highest_score}%</span>
                                    ) : (
                                      <span className="text-muted-foreground text-xs">-</span>
                                    )}
                                  </td>
                                  <td className="p-3 text-right">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 text-xs font-semibold group-hover:bg-primary group-hover:text-primary-foreground"
                                    >
                                      View History
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Question Breakdown Column */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-bold">Focus Areas</CardTitle>
                    <p className="text-xs text-muted-foreground">Questions sorted by lowest correct rates.</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {analytics.question_breakdown && analytics.question_breakdown.length > 0 ? (
                      [...analytics.question_breakdown]
                        .sort((a, b) => (a.correct_count / a.response_count) - (b.correct_count / b.response_count))
                        .slice(0, 6)
                        .map((qb) => {
                          const percent = Math.round((qb.correct_count / qb.response_count) * 100);
                          const progressColor = percent >= 80 ? "bg-emerald-500" : percent >= 50 ? "bg-amber-500" : "bg-rose-500";

                          return (
                            <div key={qb.question_id} className="space-y-2 border-b pb-3 last:border-0 last:pb-0">
                              <div className="flex items-start justify-between gap-3 text-xs">
                                <span className="font-medium text-foreground line-clamp-2">{qb.question}</span>
                                <span className="shrink-0 text-muted-foreground font-semibold">
                                  {percent}%
                                </span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                <div className={`${progressColor} h-1.5 rounded-full`} style={{ width: `${percent}%` }} />
                              </div>
                              <p className="text-[10px] text-muted-foreground">
                                {qb.correct_count} of {qb.response_count} correct responses
                              </p>
                            </div>
                          );
                        })
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-6">
                        No breakdown data yet.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No analytics available yet.</p>
          )}
        </TabsContent>
      </Tabs>

      {/* Admin Department Attempts Sheet */}
      <Sheet open={selectedDept !== null} onOpenChange={(open) => {
        if (!open) {
          setSelectedDept(null);
          setSelectedAttemptId(null);
          setAttemptDetails(null);
        }
      }}>
        <SheetContent className="sm:max-w-md overflow-y-auto px-6 py-8">
          {selectedDept && (
            <>
              {selectedAttemptId === null ? (
                // View 1: List of Attempts for selected department
                <div className="space-y-6">
                  <SheetHeader>
                    <SheetTitle>{selectedDept.department} Department</SheetTitle>
                    <SheetDescription>
                      Average score:{" "}
                      <strong>{selectedDept.average_score !== null ? `${selectedDept.average_score}%` : "N/A"}</strong>
                    </SheetDescription>
                  </SheetHeader>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground">Quiz Attempts History</h3>

                    {loadingDeptAttempts ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">Loading history...</span>
                      </div>
                    ) : deptAttempts.length === 0 ? (
                      <div className="text-center py-10 text-sm text-muted-foreground border rounded-lg border-dashed">
                        No quiz attempts recorded.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {deptAttempts.map((attempt) => {
                          const percent = Math.round((attempt.score / attempt.total) * 100);
                          const badgeColorClass =
                            percent >= 80
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : percent >= 50
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-rose-50 text-rose-700 border-rose-200";

                          return (
                            <div
                              key={attempt.id}
                              className="flex items-center justify-between p-3 border rounded-lg hover:border-primary/50 transition-all cursor-pointer bg-card"
                              onClick={() => handleInspectAttempt(attempt.id)}
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="text-xs font-semibold text-foreground">
                                    {format(new Date(attempt.created_at), "MMM d, yyyy")}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">
                                    {format(new Date(attempt.created_at), "h:mm a")}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Raw Score: {attempt.score} / {attempt.total}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={`${badgeColorClass} font-semibold text-xs`}>
                                  {percent}%
                                </Badge>
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // View 2: Inspect a specific attempt details
                <div className="space-y-6">
                  <button
                    onClick={() => setSelectedAttemptId(null)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors mb-2"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to {selectedDept.department} attempts
                  </button>

                  <SheetHeader>
                    <SheetTitle>Quiz Attempt Details</SheetTitle>
                    <SheetDescription>
                      {attemptDetails?.attempt && (
                        <span>
                          Completed on {format(new Date(attemptDetails.attempt.created_at), "MMM d, yyyy 'at' h:mm a")}
                          <br />
                          Score:{" "}
                          <strong>
                            {attemptDetails.attempt.score} / {attemptDetails.attempt.total} (
                            {Math.round((attemptDetails.attempt.score / attemptDetails.attempt.total) * 100)}%)
                          </strong>
                        </span>
                      )}
                    </SheetDescription>
                  </SheetHeader>

                  {loadingDetails ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">Loading details...</span>
                    </div>
                  ) : (
                    <div className="space-y-6 my-2">
                      {attemptDetails?.questions.map((q, idx) => (
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
                                        User Choice
                                      </Badge>
                                    )}
                                    {isUserAnswer && q.is_correct && (
                                      <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-[9px] uppercase">
                                        User Choice
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
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Edit Cheatsheet Item Sheet */}
      <Sheet open={editingItem !== null} onOpenChange={(open) => {
        if (!open) setEditingItem(null);
      }}>
        <SheetContent className="sm:max-w-md overflow-y-auto px-6 py-8">
          <SheetHeader className="mb-6">
            <SheetTitle>Edit Cheatsheet Item</SheetTitle>
            <SheetDescription>
              Update the facts, title, or country category for this study item.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Title</label>
              <Input
                value={itemForm.title}
                onChange={(e) => setItemForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Item Title"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Country Category</label>
              <Input
                value={itemForm.category}
                onChange={(e) => setItemForm(prev => ({ ...prev, category: e.target.value }))}
                placeholder="e.g. UK, USA, Schengen, Brazil, Mexico"
              />
              <p className="text-[10px] text-muted-foreground">
                Tying each item to a country (like UK, USA, Schengen) is strictly required to prevent generic travel questions.
              </p>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Content</label>
              <Textarea
                value={itemForm.content}
                onChange={(e) => setItemForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Factual guideline content..."
                className="min-h-30"
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button onClick={handleUpdateItemSubmit} disabled={savingItem} className="flex-1">
                {savingItem ? "Saving..." : "Save Changes"}
              </Button>
              <Button variant="outline" onClick={() => setEditingItem(null)} disabled={savingItem}>
                Cancel
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Quiz Question Sheet */}
      <Sheet open={editingQuestion !== null} onOpenChange={(open) => {
        if (!open) setEditingQuestion(null);
      }}>
        <SheetContent className="sm:max-w-md overflow-y-auto px-6 py-8">
          <SheetHeader className="mb-6">
            <SheetTitle>Edit Quiz Question</SheetTitle>
            <SheetDescription>
              Update the question text, country category, multiple choice options, correct choice, and explanation.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Question Text</label>
              <Input
                value={questionForm.question}
                onChange={(e) => setQuestionForm(prev => ({ ...prev, question: e.target.value }))}
                placeholder="Question text"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Country Category</label>
              <Input
                value={questionForm.category}
                onChange={(e) => setQuestionForm(prev => ({ ...prev, category: e.target.value }))}
                placeholder="e.g. UK, USA, Schengen, Brazil, Mexico"
              />
              <p className="text-[10px] text-muted-foreground">
                Tying each question to a country (like UK, USA, Schengen) is strictly required to prevent generic travel questions.
              </p>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Options</label>
              {questionForm.options.map((option, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground w-4">{idx + 1}.</span>
                  <Input
                    value={option}
                    onChange={(e) => {
                      const nextOptions = [...questionForm.options];
                      nextOptions[idx] = e.target.value;
                      setQuestionForm(prev => ({ ...prev, options: nextOptions }));
                    }}
                    placeholder={`Option ${idx + 1}`}
                  />
                </div>
              ))}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Correct Answer</label>
              <select
                value={questionForm.correct_option}
                onChange={(e) => setQuestionForm(prev => ({ ...prev, correct_option: e.target.value }))}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select correct option...</option>
                {questionForm.options.map(o => o.trim()).filter(Boolean).map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Explanation</label>
              <Textarea
                value={questionForm.explanation}
                onChange={(e) => setQuestionForm(prev => ({ ...prev, explanation: e.target.value }))}
                placeholder="Why is this option correct?"
                className="min-h-20"
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button onClick={handleUpdateQuestionSubmit} disabled={savingQuestion} className="flex-1">
                {savingQuestion ? "Saving..." : "Save Changes"}
              </Button>
              <Button variant="outline" onClick={() => setEditingQuestion(null)} disabled={savingQuestion}>
                Cancel
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
