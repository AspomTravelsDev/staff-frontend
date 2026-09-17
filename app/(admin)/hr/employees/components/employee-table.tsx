"use client";

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
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  UserCheck,
  UserX,
  Edit,
  Phone,
  Loader2,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Employee } from "@/lib/api/employees";
import { updateUserStatusAction, deleteUserAction } from "../actions";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { useSort } from "@/lib/hooks/use-sort";
import { EditUserDialog } from "./edit-user-dialog";
import { DeactivateUserDialog } from "./deactivate-user-dialog";
import { formatLagosDate } from "@/lib/utils/attendance";
import {
  getRoleLabel,
  USER_EXIT_TYPE_LABELS,
  type RoleOption,
  type UserExitType,
} from "@/types/user-types";

interface EmployeeTableProps {
  employees: Employee[];
  roleOptions: RoleOption[];
  departments: string[];
  roleToDepartment: Record<string, string>;
}

export function EmployeeTable({
  employees,
  roleOptions,
  departments,
  roleToDepartment,
}: EmployeeTableProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deactivatingEmployee, setDeactivatingEmployee] =
    useState<Employee | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const sortOptions = useMemo(
    () => ({
      dateFields: ["joinDate"] as (keyof Employee)[],
    }),
    [],
  );

  const {
    sortedData: sorted,
    sortConfig,
    handleSort,
  } = useSort(employees, sortOptions);

  const renderSortIcon = (columnKey: keyof Employee) => {
    if (sortConfig?.key !== columnKey)
      return <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />;
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3" />
    );
  };

  const handleStatusToggle = async (employee: Employee) => {
    const newStatus = !employee.status || employee.status === "Inactive";
    setUpdatingId(employee.id);

    const result = await updateUserStatusAction(employee.id, newStatus);

    if (result.success) {
      toast.success(
        `${employee.firstName} ${employee.lastName} has been ${newStatus ? "activated" : "deactivated"}.`,
      );
    } else {
      toast.error(result.error || "Failed to update user status");
    }

    setUpdatingId(null);
  };

  const handleDelete = async () => {
    if (!employeeToDelete) return;

    setIsDeleting(true);
    const result = await deleteUserAction(employeeToDelete.id);

    if (result.success) {
      toast.success(
        `${employeeToDelete.firstName} ${employeeToDelete.lastName} has been permanently deleted.`,
      );
      setEmployeeToDelete(null);
    } else {
      toast.error(result.error || "Failed to delete user");
    }

    setIsDeleting(false);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              className="cursor-pointer hover:text-foreground transition-colors group"
              onClick={() => handleSort("staff_id")}
            >
              <div className="flex items-center">
                Staff ID {renderSortIcon("staff_id")}
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:text-foreground transition-colors group"
              onClick={() => handleSort("firstName")}
            >
              <div className="flex items-center">
                Name {renderSortIcon("firstName")}
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:text-foreground transition-colors group"
              onClick={() => handleSort("department")}
            >
              <div className="flex items-center">
                Department {renderSortIcon("department")}
              </div>
            </TableHead>
            <TableHead>Contact</TableHead>
            <TableHead
              className="cursor-pointer hover:text-foreground transition-colors group"
              onClick={() => handleSort("joinDate")}
            >
              <div className="flex items-center">
                Date Joined {renderSortIcon("joinDate")}
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:text-foreground transition-colors group"
              onClick={() => handleSort("status")}
            >
              <div className="flex items-center">
                Status {renderSortIcon("status")}
              </div>
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                No employees found.
              </TableCell>
            </TableRow>
          ) : (
            sorted.map((employee: Employee) => (
              <TableRow key={employee.id}>
                <TableCell className="font-mono text-xs font-medium">
                  {employee.staff_id}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {employee.firstName} {employee.lastName}
                      </span>
                      {employee.is_supervisor && (
                        <Badge variant="outline" className="text-xs">
                          Supervisor
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {employee.email}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm">
                      {employee.department || "—"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {getRoleLabel(employee.role, {
                        isSupervisor: employee.is_supervisor,
                      })}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <span className="text-xs">{employee.phone || "—"}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {employee.joinDate ? formatLagosDate(employee.joinDate) : "-"}
                </TableCell>
                <TableCell>
                  {employee.status === "Active" ? (
                    <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200 hover:bg-emerald-500/15">
                      Active
                    </Badge>
                  ) : (
                    <div className="flex flex-col gap-0.5 items-start">
                      <Badge
                        variant="secondary"
                        className="bg-muted text-muted-foreground border-border"
                      >
                        Inactive
                        {employee.exit_type && (
                          <span className="ml-1 text-[10px] font-semibold text-destructive uppercase tracking-wide">
                            ·{" "}
                            {USER_EXIT_TYPE_LABELS[
                              employee.exit_type as UserExitType
                            ] || employee.exit_type}
                          </span>
                        )}
                      </Badge>
                      {employee.exit_date && (
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {formatLagosDate(employee.exit_date)}
                        </span>
                      )}
                      {employee.exit_reason && (
                        <span
                          className="text-[11px] text-muted-foreground italic truncate max-w-[150px]"
                          title={employee.exit_reason}
                        >
                          &ldquo;{employee.exit_reason}&rdquo;
                        </span>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={updatingId === employee.id}
                      >
                        {updatingId === employee.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <MoreHorizontal className="h-4 w-4" />
                        )}
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => setEditingEmployee(employee)}
                      >
                        <Edit className="mr-2 h-4 w-4" /> Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {employee.status === "Active" ? (
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive focus:bg-destructive/10"
                          onClick={() => setDeactivatingEmployee(employee)}
                        >
                          <UserX className="mr-2 h-4 w-4" /> Make Inactive
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => handleStatusToggle(employee)}
                        >
                          <UserCheck className="mr-2 h-4 w-4" /> Make Active
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive focus:bg-destructive/10 focus:outline-none"
                        onClick={() => setEmployeeToDelete(employee)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Employee
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <EditUserDialog
        employee={editingEmployee}
        open={!!editingEmployee}
        onOpenChange={(open) => !open && setEditingEmployee(null)}
        roleOptions={roleOptions}
        departments={departments}
        roleToDepartment={roleToDepartment}
      />

      <DeactivateUserDialog
        employee={deactivatingEmployee}
        open={!!deactivatingEmployee}
        onOpenChange={(open) => !open && setDeactivatingEmployee(null)}
      />

      <AlertDialog
        open={!!employeeToDelete}
        onOpenChange={(open) =>
          !open && !isDeleting && setEmployeeToDelete(null)
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              <strong className="text-foreground">
                {employeeToDelete?.firstName} {employeeToDelete?.lastName}
              </strong>{" "}
              and erase all related data including clock&#x2011;ins and daily
              tasks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Employee"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
