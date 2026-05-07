"use client";

import { useState } from "react";
import { Plus, X, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { addBatchComplianceOccurrences } from "@/lib/api/compliance";
import { type Employee } from "@/lib/api/employees";
import { toast } from "sonner";

interface AddOccurrenceDialogProps {
  employees: Employee[];
  departments: string[];
}

export function AddOccurrenceDialog({
  employees,
  departments,
}: AddOccurrenceDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    type: "",
    date: "",
    severity: "",
    description: "",
  });

  const handleAddUser = (userId: string) => {
    if (userId && !selectedUserIds.includes(userId)) {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUserIds(selectedUserIds.filter((id) => id !== userId));
  };

  const handleAddDepartment = (dept: string) => {
    const deptUserIds = employees
      .filter((e) => e.department === dept)
      .map((e) => e.id);
    
    const newIds = Array.from(new Set([...selectedUserIds, ...deptUserIds]));
    setSelectedUserIds(newIds);
    toast.info(`Added ${deptUserIds.length} staff members from ${dept}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUserIds.length === 0) {
      toast.error("Please select at least one employee");
      return;
    }

    setLoading(true);

    try {
      await addBatchComplianceOccurrences({
        user_ids: selectedUserIds,
        type: formData.type,
        occurrence_date: `${formData.date} 12:00:00`,
        severity: formData.severity as any,
        description: formData.description,
      });

      toast.success(`Compliance queries sent to ${selectedUserIds.length} staff members`);
      setOpen(false);
      setFormData({
        type: "",
        date: "",
        severity: "",
        description: "",
      });
      setSelectedUserIds([]);
      // Refresh the page or trigger a re-fetch
      window.location.reload();
    } catch (error) {
      console.error("Failed to add occurrence", error);
      toast.error("Failed to add compliance occurrence");
    } finally {
      setLoading(false);
    }
  };

  const selectedEmployees = employees.filter((e) => selectedUserIds.includes(e.id));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Occurrence
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
          <DialogHeader>
            <DialogTitle>Add Compliance Occurrence</DialogTitle>
            <DialogDescription>
              Record a new compliance issue. You can select multiple staff members or an entire department.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4 overflow-y-auto pr-2">
            {/* Staff Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Target Staff ({selectedUserIds.length})</Label>
                <div className="flex gap-2">
                  {/* Select by Department */}
                  <Select onValueChange={handleAddDepartment}>
                    <SelectTrigger className="w-[180px] h-8 text-xs">
                      <Users className="mr-2 h-3 w-3" />
                      <SelectValue placeholder="Add by Dept" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Add Individual */}
                  <Select onValueChange={handleAddUser}>
                    <SelectTrigger className="w-[180px] h-8 text-xs">
                      <Plus className="mr-2 h-3 w-3" />
                      <SelectValue placeholder="Add Individual" />
                    </SelectTrigger>
                    <SelectContent>
                      <ScrollArea className="h-60">
                        {employees
                          .filter((e) => !selectedUserIds.includes(e.id))
                          .map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.firstName} {user.lastName} ({user.department})
                            </SelectItem>
                          ))}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Selected List */}
              <div className="min-h-[60px] p-2 border rounded-md bg-muted/20 flex flex-wrap gap-2 max-h-[120px] overflow-y-auto">
                {selectedEmployees.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic p-1">No staff selected yet.</p>
                ) : (
                  selectedEmployees.map((emp) => (
                    <Badge key={emp.id} variant="secondary" className="pl-2 pr-1 py-1 gap-1">
                      <span className="text-[10px]">{emp.firstName} {emp.lastName}</span>
                      <button 
                        type="button"
                        onClick={() => handleRemoveUser(emp.id)}
                        className="hover:bg-muted-foreground/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right text-sm">
                Type
              </Label>
              <Select
                value={formData.type}
                onValueChange={(val) => setFormData({ ...formData, type: val })}
                required
              >
                <SelectTrigger className="w-full col-span-3">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Lateness">Lateness</SelectItem>
                  <SelectItem value="Unauthorized Absence">Unauthorized Absence</SelectItem>
                  <SelectItem value="Extended Breaks">Extended Breaks</SelectItem>
                  <SelectItem value="Misconduct">Misconduct</SelectItem>
                  <SelectItem value="Insubordination">Insubordination</SelectItem>
                  <SelectItem value="Unprofessional Conduct">Unprofessional Conduct</SelectItem>
                  <SelectItem value="Workplace Harassment">Workplace Harassment</SelectItem>
                  <SelectItem value="Policy Violation">Policy Violation</SelectItem>
                  <SelectItem value="Information Security Breach">Information Security Breach</SelectItem>
                  <SelectItem value="Confidentiality Breach">Confidentiality Breach</SelectItem>
                  <SelectItem value="Procedural Error">Procedural Error</SelectItem>
                  <SelectItem value="Negligence">Negligence</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right text-sm">
                Date
              </Label>
              <Input
                id="date"
                type="date"
                className="col-span-3"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="severity" className="text-right text-sm">
                Severity
              </Label>
              <Select
                value={formData.severity}
                onValueChange={(val) =>
                  setFormData({ ...formData, severity: val })
                }
                required
              >
                <SelectTrigger className="w-full col-span-3">
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right text-sm">
                Description
              </Label>
              <Textarea
                id="description"
                className="col-span-3"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
              />
            </div>
          </div>
          <DialogFooter className="mt-auto pt-2 border-t">
            <Button 
              variant="ghost" 
              type="button" 
              onClick={() => setSelectedUserIds([])}
              disabled={selectedUserIds.length === 0 || loading}
              className="text-xs mr-auto"
            >
              Clear Selection
            </Button>
            <Button type="submit" disabled={loading || selectedUserIds.length === 0}>
              {loading ? "Adding..." : `Send to ${selectedUserIds.length} Staff`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
