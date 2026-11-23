"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  Edit2,
  Eye,
  FileEdit,
  LayoutGrid,
  List as ListIcon,
  Loader2,
  MoreHorizontal,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  deleteITGuide,
  updateITGuide,
  type ITGuideItem,
} from "@/lib/api/it-guides";
import { formatLagosDate } from "@/lib/utils/attendance";
import { estimateReadingTimeMinutes } from "@/app/(admin)/my/it/components/it-guide-content";

interface ITDeskManagerProps {
  initialGuides: ITGuideItem[];
}

export function ITDeskManager({ initialGuides }: ITDeskManagerProps) {
  const router = useRouter();
  const [guides, setGuides] = useState<ITGuideItem[]>(initialGuides);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [deleteTarget, setDeleteTarget] = useState<ITGuideItem | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const g of guides) {
      if (g.category) set.add(g.category);
    }
    return Array.from(set).sort();
  }, [guides]);

  const filteredGuides = useMemo(() => {
    const q = search.trim().toLowerCase();
    return guides.filter((g) => {
      if (statusFilter !== "all" && g.status !== statusFilter) return false;
      if (categoryFilter !== "all" && (g.category || "General") !== categoryFilter) {
        return false;
      }
      if (!q) return true;
      const haystack = `${g.title} ${g.excerpt ?? ""} ${g.category ?? ""} ${g.author_name}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [guides, search, statusFilter, categoryFilter]);

  const handleToggleStatus = async (guide: ITGuideItem) => {
    const nextStatus = guide.status === "published" ? "draft" : "published";
    setBusyId(guide.id);
    try {
      const updated = await updateITGuide(guide.id, { status: nextStatus });
      setGuides((prev) => prev.map((g) => (g.id === guide.id ? updated : g)));
      toast.success(
        nextStatus === "published"
          ? `"${guide.title}" is now published.`
          : `"${guide.title}" moved to drafts.`,
      );
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update guide status",
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    try {
      await deleteITGuide(deleteTarget.id);
      setGuides((prev) => prev.filter((g) => g.id !== deleteTarget.id));
      toast.success(`"${deleteTarget.title}" deleted.`);
      setDeleteTarget(null);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete guide",
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-card border rounded-xl p-5 shadow-xs">
          <p className="text-sm font-medium text-muted-foreground mb-1">
            Total Guides
          </p>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold tabular-nums">{guides.length}</span>
            <Badge variant="secondary" className="mb-1">
              All
            </Badge>
          </div>
        </div>
        <div className="bg-card border rounded-xl p-5 shadow-xs">
          <p className="text-sm font-medium text-muted-foreground mb-1">
            Published
          </p>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold tabular-nums">
              {guides.filter((g) => g.status === "published").length}
            </span>
            <CheckCircle2 className="h-5 w-5 text-green-500 mb-1" />
          </div>
        </div>
        <div className="bg-card border rounded-xl p-5 shadow-xs">
          <p className="text-sm font-medium text-muted-foreground mb-1">
            Drafts
          </p>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold tabular-nums">
              {guides.filter((g) => g.status === "draft").length}
            </span>
            <FileEdit className="h-5 w-5 text-amber-500 mb-1" />
          </div>
        </div>
        <div className="bg-card border rounded-xl p-5 shadow-xs">
          <p className="text-sm font-medium text-muted-foreground mb-1">
            Categories
          </p>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold tabular-nums">
              {categories.length}
            </span>
            <Badge variant="outline" className="mb-1">
              Active
            </Badge>
          </div>
        </div>
      </div>

      <div className="bg-card border rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b bg-muted/20 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-60 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, category, or author..."
                className="pl-9 bg-background"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(v: "all" | "published" | "draft") =>
                setStatusFilter(v)
              }
            >
              <SelectTrigger className="w-36 bg-background">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-44 bg-background">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-end gap-1 border rounded-lg p-1 bg-background self-end lg:self-auto">
            <Button
              type="button"
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("list")}
              title="Table view"
            >
              <ListIcon className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("grid")}
              title="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {filteredGuides.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground px-4">
            <p className="font-medium text-foreground">No matching guides found</p>
            <p className="text-sm mt-1">
              {guides.length === 0
                ? "Create your first IT guide to get started."
                : "Try adjusting your search or filter selections."}
            </p>
          </div>
        ) : viewMode === "list" ? (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Read Time</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGuides.map((guide) => {
                const isBusy = busyId === guide.id;
                const readMin = estimateReadingTimeMinutes(guide.content);
                return (
                  <TableRow key={guide.id} className="group">
                    <TableCell className="font-medium max-w-md">
                      <Link
                        href={`/admin/it-desk/${guide.id}/edit`}
                        className="hover:text-primary transition-colors block truncate"
                      >
                        {guide.title}
                      </Link>
                      {guide.excerpt && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5 font-normal">
                          {guide.excerpt}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">
                        {guide.category || "General"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {readMin} min
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {guide.author_name}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          guide.status === "published" ? "default" : "secondary"
                        }
                        className={
                          guide.status === "published"
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : ""
                        }
                      >
                        {guide.status === "published" ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatLagosDate(guide.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          asChild
                          title="Preview guide"
                        >
                          <Link href={`/my/it/${guide.slug}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          asChild
                          title="Edit guide"
                        >
                          <Link href={`/admin/it-desk/${guide.id}/edit`}>
                            <Edit2 className="h-4 w-4" />
                          </Link>
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              disabled={isBusy}
                            >
                              {isBusy ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MoreHorizontal className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => void handleToggleStatus(guide)}
                            >
                              {guide.status === "published" ? (
                                <>
                                  <FileEdit className="mr-2 h-4 w-4" />
                                  Move to Draft
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                                  Publish Guide
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteTarget(guide)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Guide
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredGuides.map((guide) => {
              const readMin = estimateReadingTimeMinutes(guide.content);
              return (
                <div
                  key={guide.id}
                  className="rounded-xl border bg-background p-5 flex flex-col justify-between gap-4 shadow-2xs hover:border-primary/40 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <Badge variant="outline" className="text-xs font-normal">
                        {guide.category || "General"}
                      </Badge>
                      <Badge
                        variant={
                          guide.status === "published" ? "default" : "secondary"
                        }
                        className={
                          guide.status === "published"
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : ""
                        }
                      >
                        {guide.status === "published" ? "Published" : "Draft"}
                      </Badge>
                    </div>
                    <Link
                      href={`/admin/it-desk/${guide.id}/edit`}
                      className="font-semibold text-base hover:text-primary transition-colors line-clamp-2"
                    >
                      {guide.title}
                    </Link>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5">
                      {guide.excerpt || "No excerpt provided."}
                    </p>
                  </div>
                  <div className="pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {guide.author_name} • {readMin} min
                    </span>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                        <Link href={`/my/it/${guide.slug}`} title="View">
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                        <Link href={`/admin/it-desk/${guide.id}/edit`} title="Edit">
                          <Edit2 className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(guide)}
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete IT Guide?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">
                &quot;{deleteTarget?.title}&quot;
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busyId !== null}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleDeleteConfirm();
              }}
              disabled={busyId !== null}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {busyId ? "Deleting…" : "Delete Guide"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
