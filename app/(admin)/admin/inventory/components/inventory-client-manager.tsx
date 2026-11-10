"use client";

import { useState, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { InventoryItem, InventoryAssignment } from "@/lib/api/inventory";
import { Employee } from "@/lib/api/employees";
import { InventoryFilters } from "./inventory-filters";
import { InventoryTable } from "./inventory-table";
import { StaffEquipment } from "./staff-equipment";
import { InventoryTasks } from "./inventory-tasks";
import { buildInventoryTasks } from "@/lib/inventory-tasks";
import { ClearanceQueueTable } from "./clearance-queue-table";
import { InitiateFullClearanceDialog } from "./initiate-full-clearance-dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Clock, RotateCcw, ShieldAlert } from "lucide-react";

interface InventoryClientManagerProps {
  userRole?: string;
  userRoles?: string[];
  initialItems: InventoryItem[];
  inventoryPagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  employees: Employee[];
  officerAssignments: InventoryAssignment[];
  complianceAssignments: InventoryAssignment[];
  clearanceOfficerQueue?: InventoryAssignment[];
  clearanceComplianceQueue?: InventoryAssignment[];
  initialTab?: string;
  serverFilters: {
    category: string;
    status: string;
    condition: string;
  };
}

export function InventoryClientManager({
  userRole,
  userRoles,
  initialItems,
  inventoryPagination,
  employees,
  officerAssignments,
  complianceAssignments,
  clearanceOfficerQueue = [],
  clearanceComplianceQueue = [],
  initialTab = "inventory",
  serverFilters,
}: InventoryClientManagerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isFullClearanceDialogOpen, setIsFullClearanceDialogOpen] = useState(false);

  const activeRoles = useMemo(() => {
    if (userRoles && userRoles.length > 0) return userRoles;
    if (userRole) return [userRole];
    return [];
  }, [userRoles, userRole]);

  const isSuper = useMemo(
    () => ["super", "mp", "md"].some((r) => activeRoles.includes(r)),
    [activeRoles]
  );
  const isOfficer = useMemo(
    () => isSuper || ["admin", "it"].some((r) => activeRoles.includes(r)),
    [isSuper, activeRoles]
  );
  const isCompliance = useMemo(
    () => isSuper || ["compliance", "office-operations"].some((r) => activeRoles.includes(r)),
    [isSuper, activeRoles]
  );

  const canSwitchClearance = isSuper || (isOfficer && isCompliance);
  const [clearanceView, setClearanceView] = useState<"officer" | "compliance">(
    isCompliance && !isOfficer ? "compliance" : "officer"
  );

  const taskRecords = [...officerAssignments, ...complianceAssignments, ...clearanceOfficerQueue, ...clearanceComplianceQueue];
  const totalPendingCount = buildInventoryTasks(taskRecords, { officer: isOfficer, compliance: isCompliance }).filter((task) => task.actionable).length;

  const activeClearanceQueue = canSwitchClearance
    ? clearanceView === "compliance"
      ? clearanceComplianceQueue
      : clearanceOfficerQueue
    : isCompliance
      ? clearanceComplianceQueue
      : clearanceOfficerQueue;

  const totalClearanceCount = new Set(
    [...clearanceOfficerQueue, ...clearanceComplianceQueue]
      .filter((item) => item.status !== "cleared" && item.status !== "cancelled")
      .map((item) => item.clearanceBatchId || `return:${item.id}`)
  ).size;

  const urlTab = searchParams.get("tab");
  const requestedTab = urlTab || initialTab || "inventory";
  const activeTab = requestedTab === "pending-approvals" ? "tasks" : requestedTab;

  const [search, setSearch] = useState<string>("");

  const handleTabChange = (val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", val);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleServerFilterChange = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");

    if (value && value !== "all") {
      params.set(name, value);
    } else {
      params.delete(name);
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleClear = () => {
    setSearch("");
    router.push(pathname);
  };

  const handleInventoryPageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`${pathname}?${params.toString()}`);
  };

  const filteredItems = useMemo(() => {
    if (!search?.trim()) return initialItems;

    const searchTerm = search.toLowerCase().trim();
    return initialItems.filter((item) => {
      const matchesName = item.name.toLowerCase().includes(searchTerm);
      const matchesSerial = item.serialNumber
        .toLowerCase()
        .includes(searchTerm);

      const employee = employees.find((employee) => employee.id === item.assignedTo);
      const staffName = employee ? `${employee.firstName} ${employee.lastName}` : "";
      return matchesName || matchesSerial || staffName.toLowerCase().includes(searchTerm) ||
        !!item.openAssignment?.assignee?.name?.toLowerCase().includes(searchTerm);
    });
  }, [initialItems, search, employees]);

  return (
    <>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 sm:max-w-2xl">
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span>Assets</span>
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
              {filteredItems.length}
            </Badge>
          </TabsTrigger>

          <TabsTrigger value="equipment">Staff equipment</TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Tasks</span>
            {totalPendingCount > 0 ? (
              <Badge variant="destructive" className="px-1.5 py-0 text-[10px]">
                {totalPendingCount}
              </Badge>
            ) : (
              <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                0
              </Badge>
            )}
          </TabsTrigger>

          <TabsTrigger value="clearance" className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-blue-500" />
            <span>Clearances</span>
            {totalClearanceCount > 0 ? (
              <Badge variant="destructive" className="px-1.5 py-0 text-[10px]">
                {totalClearanceCount}
              </Badge>
            ) : (
              <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                0
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          <InventoryFilters
            search={search}
            onSearchChange={setSearch}
            category={serverFilters.category}
            onCategoryChange={(val) => handleServerFilterChange("category", val)}
            status={serverFilters.status}
            onStatusChange={(val) => handleServerFilterChange("status", val)}
            condition={serverFilters.condition}
            onConditionChange={(val) =>
              handleServerFilterChange("condition_rating", val)
            }
            onClear={handleClear}
            items={filteredItems}
            employees={employees}
            onExportStaffFormClick={() => handleTabChange("equipment")}
          />
          <InventoryTable items={filteredItems} employees={employees} />
          {inventoryPagination.total_pages > 1 && (
            <div className="flex items-center justify-between gap-3 border-t pt-4">
              <p className="text-sm text-muted-foreground">
                Showing {(inventoryPagination.page - 1) * inventoryPagination.limit + 1}-
                {Math.min(inventoryPagination.page * inventoryPagination.limit, inventoryPagination.total)} of {inventoryPagination.total}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={inventoryPagination.page <= 1}
                  onClick={() => handleInventoryPageChange(inventoryPagination.page - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm tabular-nums text-muted-foreground">
                  Page {inventoryPagination.page} of {inventoryPagination.total_pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={inventoryPagination.page >= inventoryPagination.total_pages}
                  onClick={() => handleInventoryPageChange(inventoryPagination.page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="equipment"><StaffEquipment employees={employees} canIssue={isOfficer} /></TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <InventoryTasks records={taskRecords} isOfficer={isOfficer} isCompliance={isCompliance} />
        </TabsContent>

        <TabsContent value="clearance" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Clearances & returns</h3>
              <p className="text-sm text-muted-foreground">
                Inspect returned devices and audit staff offboarding clearance
              </p>
            </div>
            {isOfficer && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsFullClearanceDialogOpen(true)}
              >
                <ShieldAlert className="mr-2 h-4 w-4" /> Request equipment clearance
              </Button>
            )}
          </div>

          {canSwitchClearance && (
            <div className="flex items-center gap-2 border-b pb-3">
              <button
                type="button"
                onClick={() => setClearanceView("officer")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  clearanceView === "officer"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                IT inspection view
                <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">
                  {clearanceOfficerQueue.length}
                </Badge>
              </button>

              <button
                type="button"
                onClick={() => setClearanceView("compliance")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  clearanceView === "compliance"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                Compliance review view
                <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">
                  {clearanceComplianceQueue.length}
                </Badge>
              </button>
            </div>
          )}

          <ClearanceQueueTable
            assignments={activeClearanceQueue}
            mode={
              canSwitchClearance
                ? clearanceView
                : isCompliance
                ? "compliance"
                : "officer"
            }
          />
        </TabsContent>
      </Tabs>

      <InitiateFullClearanceDialog
        open={isFullClearanceDialogOpen}
        onOpenChange={setIsFullClearanceDialogOpen}
        employees={employees}
      />
    </>
  );
}
