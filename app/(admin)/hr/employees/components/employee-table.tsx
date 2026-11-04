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
  ShieldAlert,
  Eye,
  BriefcaseBusiness,
  History,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Employee } from "@/lib/api/employees";
import { updateUserStatusAction, deleteUserAction, retryEmailRestrictionAction } from "../actions";
import { notifyEmailRestriction } from "@/components/company-email-notice";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { useSort } from "@/lib/hooks/use-sort";
import { EditUserDialog } from "./edit-user-dialog";
import { DeactivateUserDialog } from "./deactivate-user-dialog";
import { EmployeeContractDialog } from "./employee-contract-dialog";
import { EmployeeDetailsSheet } from "./employee-details-sheet";
import { exportToCSV, type ExportColumn } from "@/lib/utils/export";
import { InitiateFullClearanceDialog } from "@/app/(admin)/admin/inventory/components/initiate-full-clearance-dialog";
import { formatLagosDate } from "@/lib/utils/attendance";
import { formatEmployeeDuration } from "@/lib/utils/employee-duration";
import {
  getRoleLabel,
  USER_EXIT_TYPE_LABELS,
  type RoleOption,
  type UserExitType,
} from "@/types/user-types";

interface EmployeeTableProps {
  blacklist?: boolean;
  employees: Employee[];
  roleOptions: RoleOption[];
  departments: string[];
  roleToDepartment: Record<string, string>;
}

interface ContractHistoryExportRow {
  staff_id: string;
  employee_name: string;
  email: string;
  department: string;
  contract_type: string;
  start_date: string;
  end_date: string;
  change_reason: string;
  changed_by: string;
}

const contractTypeLabels: Record<string, string> = {
  full_time: "Full staff",
  part_time: "Part time",
  contract: "Contract",
  nysc: "NYSC",
  intern: "Intern",
};

const contractHistoryExportColumns: ExportColumn<ContractHistoryExportRow>[] = [
  { header: "Staff ID", key: "staff_id" },
  { header: "Employee Name", key: "employee_name" },
  { header: "Email", key: "email" },
  { header: "Department", key: "department" },
  { header: "Contract Type", key: "contract_type" },
  { header: "Start Date", key: "start_date" },
  { header: "End Date", key: "end_date" },
  { header: "Change Reason", key: "change_reason" },
  { header: "Recorded By", key: "changed_by" },
];

export function EmployeeTable({
  employees,
  roleOptions,
  departments,
  roleToDepartment,
  blacklist = false,
}: EmployeeTableProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deactivatingEmployee, setDeactivatingEmployee] =
    useState<Employee | null>(null);
  const [clearanceEmployee, setClearanceEmployee] = useState<Employee | null>(
    null,
  );
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [contractEmployee, setContractEmployee] = useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);

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

  const openEmployee = (employee: Employee) => setViewingEmployee(employee);
  const handleRowKeyDown = (event: React.KeyboardEvent<HTMLTableRowElement>, employee: Employee) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openEmployee(employee);
    }
  };

  const handleStatusToggle = async (employee: Employee) => {
    const newStatus = !employee.status || employee.status === "Inactive";
    setUpdatingId(employee.id);

    const result = await updateUserStatusAction(employee.id, newStatus);

    if (result.success) {
      notifyEmailRestriction(result.emailRestriction);
      toast.success(
        `${employee.firstName} ${employee.lastName} has been ${newStatus ? "activated" : "deactivated"}.`,
      );
    } else {
      toast.error(result.error || "Failed to update user status");
    }

    setUpdatingId(null);
  };

  const exportContractHistory = (employee: Employee) => {
    const employeeName = `${employee.firstName} ${employee.lastName}`.trim();
    const history = employee.contract_history?.length
      ? employee.contract_history
      : employee.contract_type
        ? [{
            contract_type: employee.contract_type,
            start_date: employee.contract_start_date || employee.joinDate || "",
            end_date: employee.contract_end_date || "",
            change_reason: "Current contract period",
            changed_by: "",
          }]
        : [];

    if (!history.length) {
      toast.info("No contract history is recorded for this employee yet.");
      return;
    }

    const rows: ContractHistoryExportRow[] = history.map((period) => ({
      staff_id: employee.staff_id || "",
      employee_name: employeeName,
      email: employee.email || "",
      department: employee.department || "",
      contract_type: contractTypeLabels[period.contract_type] || period.contract_type,
      start_date: period.start_date || "",
      end_date: period.end_date || "Current",
      change_reason: period.change_reason || "",
      changed_by: period.changed_by || "",
    }));
    const safeStaffId = (employee.staff_id || employee.id).replace(/[^a-zA-Z0-9_-]/g, "-");
    exportToCSV(rows, contractHistoryExportColumns, `contract-history-${safeStaffId}`);
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

  const handleRetryEmail = async (employee: Employee) => {
    setUpdatingId(employee.id);
    try {
      const result = await retryEmailRestrictionAction(employee.id, employee.status === "Active");
      if (result.success) notifyEmailRestriction(result.emailRestriction);
      else toast.error(result.error || "Could not retry email restriction");
    } finally { setUpdatingId(null); }
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
            <TableHead>Staff Duration</TableHead>
            <TableHead>Contract Period</TableHead>
            <TableHead
              className="cursor-pointer hover:text-foreground transition-colors group"
              onClick={() => handleSort("status")}
            >
              <div className="flex items-center">
                Status {renderSortIcon("status")}
              </div>
            </TableHead>
            {blacklist && <TableHead>Blacklist record</TableHead>}
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.length === 0 ? (
            <TableRow>
              <TableCell colSpan={blacklist ? 10 : 9} className="h-24 text-center">
                No employees found.
              </TableCell>
            </TableRow>
          ) : (
            sorted.map((employee: Employee) => (
              <TableRow
                key={employee.id}
                tabIndex={0}
                aria-label={`View ${employee.firstName} ${employee.lastName}`}
                onClick={(event) => {
                  if ((event.target as HTMLElement).closest("button, a, input, select, [role='menu'], [role='menuitem'], [data-row-click-ignore='true']")) return;
                  openEmployee(employee);
                }}
                onKeyDown={(event) => handleRowKeyDown(event, employee)}
                className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
              >
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
                    {employee.email_restriction && <span
                      className={`text-[11px] ${["failed", "partial"].includes(employee.email_restriction.status) ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}
                      title={`${employee.email_restriction.email}: ${employee.email_restriction.message}`}
                    >
                      {employee.email_restriction.status === "restored" ? "Email login & sending restored" : employee.email_restriction.status === "restricted" ? "Email login & sending restricted" : employee.email_restriction.status === "partial" ? `Email ${employee.email_restriction.action === "restore" ? "restoration" : "restriction"} incomplete — retry needed` : employee.email_restriction.status === "failed" ? `Email ${employee.email_restriction.action === "restore" ? "restoration" : "restriction"} failed — retry needed` : "Email update skipped"}
                    </span>}
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
                <TableCell className="whitespace-nowrap text-sm">
                  {formatEmployeeDuration(employee.joinDate, employee.status, employee.exit_date)}
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm">
                  <div className="font-medium">{{ full_time: "Full staff", part_time: "Part time", contract: "Contract", nysc: "NYSC", intern: "Intern" }[employee.contract_type || ""] || "Not specified"}</div>
                  {employee.contract_start_date && <div className="text-xs text-muted-foreground">{formatLagosDate(employee.contract_start_date)} – {employee.contract_end_date ? formatLagosDate(employee.contract_end_date) : "Current"}</div>}
                  {(employee.contract_history?.length || 0) > 0 && <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setContractEmployee(employee)}>Manage periods</Button>}
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
                {blacklist && <TableCell className="min-w-56 max-w-sm whitespace-normal">
                  <p className="text-sm whitespace-pre-wrap">{employee.blacklist_reason || "No reason recorded"}</p>
                  {employee.blacklisted_at && <p className="mt-1 text-xs text-muted-foreground">Added {formatLagosDate(employee.blacklisted_at)}</p>}
                </TableCell>}
                <TableCell className="text-right" data-row-click-ignore="true" onClick={(event) => event.stopPropagation()}>
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
                    <DropdownMenuContent align="end" className="w-64">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => setViewingEmployee(employee)}>
                        <Eye className="mr-2 h-4 w-4" /> View employee
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => exportContractHistory(employee)}>
                        <History className="mr-2 h-4 w-4" /> Export Contract History
                      </DropdownMenuItem>
                      {employee.email_restriction && (["failed", "partial"].includes(employee.email_restriction.status) || (employee.status === "Active" && employee.email_restriction.status === "restricted")) && <DropdownMenuItem onClick={() => handleRetryEmail(employee)}>
                        <ShieldAlert className="mr-2 h-4 w-4" />Retry Email {employee.status === "Active" ? "Restoration" : "Restriction"}
                      </DropdownMenuItem>}
                      <DropdownMenuItem
                        onClick={() => setEditingEmployee(employee)}
                      >
                        <Edit className="mr-2 h-4 w-4" /> Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setContractEmployee(employee)}>
                        <BriefcaseBusiness className="mr-2 h-4 w-4" /> Manage Contract Periods
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
                          <UserCheck className="mr-2 h-4 w-4" />Make Active & Restore Email
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => setClearanceEmployee(employee)}
                      >
                        <ShieldAlert className="mr-2 h-4 w-4 text-amber-600" /> Gadget Clearance
                      </DropdownMenuItem>
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

      <EmployeeContractDialog employee={contractEmployee} open={!!contractEmployee} onOpenChange={(open) => !open && setContractEmployee(null)} />
      <EmployeeDetailsSheet employee={viewingEmployee} open={!!viewingEmployee} onOpenChange={(open) => !open && setViewingEmployee(null)} onUpdated={setViewingEmployee} />

      <DeactivateUserDialog
        employee={deactivatingEmployee}
        open={!!deactivatingEmployee}
        onOpenChange={(open) => !open && setDeactivatingEmployee(null)}
      />

      <InitiateFullClearanceDialog
        open={!!clearanceEmployee}
        onOpenChange={(open) => !open && setClearanceEmployee(null)}
        employees={employees}
        initialStaffId={clearanceEmployee?.id}
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
