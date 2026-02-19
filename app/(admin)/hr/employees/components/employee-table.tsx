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
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  UserCheck,
  UserX,
  Edit,
  Phone,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Employee } from "@/lib/api/employees";
import { useUpdateUserStatus } from "@/lib/api/hooks/use-employees";
import { toast } from "sonner";
import { useState } from "react";
import { EditUserDialog } from "./edit-user-dialog";

interface EmployeeTableProps {
  employees: Employee[];
}

export function EmployeeTable({ employees }: EmployeeTableProps) {
  const { mutate: updateStatus, isPending } = useUpdateUserStatus();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const handleStatusToggle = (employee: Employee) => {
    const newStatus = !employee.status || employee.status === "Inactive";
    setUpdatingId(employee.id);

    updateStatus(
      { userId: employee.id, isActive: newStatus },
      {
        onSuccess: () => {
          toast.success(
            `${employee.firstName} ${employee.lastName} has been ${newStatus ? "activated" : "deactivated"}.`,
          );
          setUpdatingId(null);
        },
        onError: (error) => {
          toast.error(error.message || "Failed to update user status");
          setUpdatingId(null);
        },
      },
    );
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Staff ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Date Joined</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                No employees found.
              </TableCell>
            </TableRow>
          ) : (
            employees.map((employee) => (
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
                      {employee.role}
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
                  {employee.joinDate
                    ? new Date(employee.joinDate).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "-"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      employee.status === "Active" ? "default" : "secondary"
                    }
                  >
                    {employee.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={isPending && updatingId === employee.id}
                      >
                        {isPending && updatingId === employee.id ? (
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
                          className="text-destructive"
                          onClick={() => handleStatusToggle(employee)}
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
      />
    </div>
  );
}
