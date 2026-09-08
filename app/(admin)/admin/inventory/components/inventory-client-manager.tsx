"use client";

import { useState, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { InventoryItem, InventoryAssignment } from "@/lib/api/inventory";
import { Employee } from "@/lib/api/employees";
import { InventoryFilters } from "./inventory-filters";
import { InventoryTable } from "./inventory-table";
import { InventoryPendingApprovals } from "./inventory-pending-approvals";
import { ClearanceQueueTable } from "./clearance-queue-table";
import { InitiateFullClearanceDialog } from "./initiate-full-clearance-dialog";
import { ExportStaffAssetDialog } from "./export-staff-asset-dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Clock, RotateCcw, ShieldAlert } from "lucide-react";

interface InventoryClientManagerProps {
  userRole?: string;
  userRoles?: string[];
  initialItems: InventoryItem[];
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

  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
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
    () => isSuper || ["compliance"].some((r) => activeRoles.includes(r)),
    [isSuper, activeRoles]
  );

  const canSwitchClearance = isSuper || (isOfficer && isCompliance);
  const [clearanceView, setClearanceView] = useState<"officer" | "compliance">(
    isCompliance && !isOfficer ? "compliance" : "officer"
  );

  const pendingOfficerCount = isOfficer ? officerAssignments.length : 0;
  const pendingComplianceCount = isCompliance ? complianceAssignments.length : 0;
  const totalPendingCount = isSuper || (isOfficer && isCompliance)
    ? officerAssignments.length + complianceAssignments.length
    : isCompliance
      ? pendingComplianceCount
      : pendingOfficerCount;

  const activeClearanceQueue = canSwitchClearance
    ? clearanceView === "compliance"
      ? clearanceComplianceQueue
      : clearanceOfficerQueue
    : isCompliance
      ? clearanceComplianceQueue
      : clearanceOfficerQueue;

  const totalClearanceCount = isSuper || (isOfficer && isCompliance)
    ? clearanceOfficerQueue.length + clearanceComplianceQueue.length
    : activeClearanceQueue.length;

  const urlTab = searchParams.get("tab");
  const activeTab = urlTab || (totalPendingCount > 0 ? "pending-approvals" : initialTab || "inventory");

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

  const filteredItems = useMemo(() => {
    if (!search?.trim()) return initialItems;

    const searchTerm = search.toLowerCase().trim();
    return initialItems.filter((item) => {
      const matchesName = item.name.toLowerCase().includes(searchTerm);
      const matchesSerial = item.serialNumber
        .toLowerCase()
        .includes(searchTerm);

      return matchesName || matchesSerial;
    });
  }, [initialItems, search]);

  return (
    <>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span>Inventory Assets</span>
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
              {filteredItems.length}
            </Badge>
          </TabsTrigger>

          <TabsTrigger value="pending-approvals" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Pending Approvals</span>
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
            <span>Gadget Clearance</span>
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
            onExportStaffFormClick={() => setIsExportDialogOpen(true)}
          />
          <InventoryTable items={filteredItems} employees={employees} />
        </TabsContent>

        <TabsContent value="pending-approvals" className="space-y-4">
          <InventoryPendingApprovals
            userRole={userRole || activeRoles[0] || ""}
            userRoles={activeRoles}
            officerAssignments={officerAssignments}
            complianceAssignments={complianceAssignments}
          />
        </TabsContent>

        <TabsContent value="clearance" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Gadget Clearance & Returns</h3>
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
                <ShieldAlert className="mr-2 h-4 w-4" /> Initiate Full Offboarding Clearance
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
                Officer Clearance Queue
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
                Compliance Audit Queue
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

      <ExportStaffAssetDialog
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
        employees={employees}
        items={initialItems}
      />

      <InitiateFullClearanceDialog
        open={isFullClearanceDialogOpen}
        onOpenChange={setIsFullClearanceDialogOpen}
        employees={employees}
      />
    </>
  );
}

