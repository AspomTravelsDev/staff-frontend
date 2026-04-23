"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintButton() {
  return (
    <Button
      variant="outline"
      className="bg-background transition-all active:scale-95"
      onClick={() => window.print()}
    >
      <Printer className="h-4 w-4 mr-2" />
      Print Payslip
    </Button>
  );
}
