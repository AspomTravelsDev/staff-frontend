"use client";

import { useState } from "react";
import { ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InterviewRubricDialog } from "../[id]/components/interview-rubric-dialog";
import { cn } from "@/lib/utils";

export function StandaloneRubricDialog({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" className={cn("gap-2", className)} onClick={() => setOpen(true)}>
        <ClipboardList className="h-4 w-4" />
        Create rubric
      </Button>
      {open && <InterviewRubricDialog standalone open onOpenChange={setOpen} />}
    </>
  );
}
