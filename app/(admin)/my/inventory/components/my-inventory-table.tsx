"use client";

import { useState } from "react";
import { InventoryItem, getMyInventoryHistory } from "@/lib/api/inventory";
import { ReportIssueDialog } from "./report-issue-dialog";
import { InventoryHistoryDialog } from "../../../admin/inventory/components/inventory-history-dialog";
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
import { Badge } from "@/components/ui/badge";
import {
  MoreHorizontal,
  History,
  Wrench,
  Server,
  Smartphone,
  Laptop,
  MonitorPlay,
} from "lucide-react";

interface MyInventoryTableProps {
  items: InventoryItem[];
}

export function MyInventoryTable({ items }: MyInventoryTableProps) {
  const [selectedIssueItem, setSelectedIssueItem] =
    useState<InventoryItem | null>(null);
  const [itemHistory, setItemHistory] = useState<InventoryItem | null>(null);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Laptop":
        return <Laptop className="w-4 h-4 text-blue-500 mr-2" />;
      case "Phone":
        return <Smartphone className="w-4 h-4 text-green-500 mr-2" />;
      case "Gadget":
        return <Server className="w-4 h-4 text-purple-500 mr-2" />;
      default:
        return <MonitorPlay className="w-4 h-4 text-slate-500 mr-2" />;
    }
  };

  const getConditionColor = (rating: string) => {
    switch (rating) {
      case "Excellent":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "Good":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
      case "Fair":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "Poor":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
      case "Broken":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400";
    }
  };

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Device Model</TableHead>
            <TableHead>Serial Number</TableHead>
            <TableHead>Condition</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-48 text-center">
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <Server className="w-12 h-12 mb-4 opacity-20" />
                  <p>No IT devices are currently assigned to you.</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center">
                    {getCategoryIcon(item.category)}
                    {item.name}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {item.serialNumber}
                </TableCell>
                <TableCell>
                  <div
                    className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${getConditionColor(item.conditionRating)}`}
                  >
                    {item.conditionRating}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      item.status === "Repairs" ? "destructive" : "default"
                    }
                  >
                    {item.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Device Actions</DropdownMenuLabel>

                      <DropdownMenuItem onClick={() => setItemHistory(item)}>
                        <History className="mr-2 h-4 w-4" /> View History
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        onClick={() => setSelectedIssueItem(item)}
                      >
                        <Wrench className="mr-2 h-4 w-4 text-amber-500" /> Log
                        Observation
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <ReportIssueDialog
        open={!!selectedIssueItem}
        onOpenChange={(open: boolean) => !open && setSelectedIssueItem(null)}
        item={selectedIssueItem}
      />

      <InventoryHistoryDialog
        open={!!itemHistory}
        onOpenChange={(open: boolean) => !open && setItemHistory(null)}
        item={itemHistory}
        fetchHistoryFn={(id) => getMyInventoryHistory(id)}
      />
    </div>
  );
}
