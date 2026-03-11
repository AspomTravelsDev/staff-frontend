"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ManageInventoryDialog } from "./inventory-dialog";
import type { Employee } from "@/lib/api/employees";
import { createInventoryItem, InventoryItemPayload } from "@/lib/api/inventory";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface InventoryAddButtonProps {
  employees: Employee[];
}

export function InventoryAddButton({ employees }: InventoryAddButtonProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleCreate = async (data: InventoryItemPayload) => {
    toast.promise(createInventoryItem(data), {
      loading: "Adding inventory item...",
      success: () => {
        router.refresh();
        setOpen(false);
        return "Item added successfully";
      },
      error: (err: any) => err.message || "Failed to add item",
    });
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Item
      </Button>
      <ManageInventoryDialog
        open={open}
        onOpenChange={setOpen}
        onSubmit={handleCreate}
        employees={employees}
      />
    </>
  );
}
