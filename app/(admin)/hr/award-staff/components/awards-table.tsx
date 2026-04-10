"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { Award } from "@/lib/api/awards";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  Calendar as CalendarIcon,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useDeleteAward, useUpdateAward } from "@/lib/api/hooks/use-awards";

interface AwardsTableProps {
  awards: Award[];
}

export function AwardsTable({ awards }: AwardsTableProps) {
  const router = useRouter();
  const updateAward = useUpdateAward();
  const deleteAward = useDeleteAward();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedAward, setSelectedAward] = useState<Award | null>(null);
  const [editMonth, setEditMonth] = useState<Date | undefined>(undefined);
  const [editDescription, setEditDescription] = useState("");

  const isSaving = updateAward.isPending;
  const isDeleting = deleteAward.isPending;

  const selectedAwardLabel = useMemo(() => {
    if (!selectedAward) return "this award";
    return selectedAward.user?.name || selectedAward.award_name;
  }, [selectedAward]);

  const openEditDialog = (award: Award) => {
    setSelectedAward(award);
    setEditDescription(award.description || "");
    setEditMonth(new Date(`${award.month}-01T00:00:00`));
    setEditOpen(true);
  };

  const openDeleteDialog = (award: Award) => {
    setSelectedAward(award);
    setDeleteOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedAward || !editMonth) {
      toast.error("Please select a valid month");
      return;
    }

    try {
      await updateAward.mutateAsync({
        awardId: selectedAward.id,
        data: {
          month: format(editMonth, "yyyy-MM-01"),
          description: editDescription.trim() || undefined,
        },
      });
      toast.success("Award updated successfully");
      setEditOpen(false);
      setSelectedAward(null);
      router.refresh();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update award",
      );
    }
  };

  const handleDelete = async () => {
    if (!selectedAward) return;

    try {
      await deleteAward.mutateAsync(selectedAward.id);
      toast.success("Award deleted successfully");
      setDeleteOpen(false);
      setSelectedAward(null);
      router.refresh();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete award",
      );
    }
  };

  return (
    <>
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Award Type</TableHead>
              <TableHead>Date Awarded</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Awarded By</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {awards.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No awards found.
                </TableCell>
              </TableRow>
            ) : (
              awards.map((award) => (
                <TableRow key={award.id}>
                  <TableCell className="font-medium">
                    {award.user ? award.user.name : "Unknown User"}
                  </TableCell>
                  <TableCell>{award.user?.department || "N/A"}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                    >
                      {award.award_name}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(award.awarded_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell
                    className="max-w-75 truncate"
                    title={award.description || ""}
                  >
                    {award.description || "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {award.awarded_by.name}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Edit award"
                        onClick={() => openEditDialog(award)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Delete award"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => openDeleteDialog(award)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setSelectedAward(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Award</DialogTitle>
            <DialogDescription>
              Update the award month and reason for {selectedAwardLabel}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Award Month</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !editMonth && "text-muted-foreground",
                    )}
                  >
                    {editMonth
                      ? format(editMonth, "MMMM yyyy")
                      : "Pick a month"}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={editMonth}
                    onSelect={setEditMonth}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="award-description">Description / Note</Label>
              <Textarea
                id="award-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Why this employee received the award"
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleUpdate} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setSelectedAward(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Award?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the award record for{" "}
              {selectedAwardLabel}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
