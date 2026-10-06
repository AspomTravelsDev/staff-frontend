"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { spreadsheetClipboard } from "./content-copy";

export function ContentCopyButton({ text, rows, label, disabled = false, iconOnly = false }: { text?: string; rows?: string[][]; label: string; disabled?: boolean; iconOnly?: boolean }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(rows ? spreadsheetClipboard(rows) : text ?? "");
      toast.success(rows ? "Copied. Paste into your spreadsheet." : "Copied to clipboard");
    } catch {
      toast.error("Unable to copy. Check your browser’s clipboard permissions and try again.");
    }
  }
  return <Button type="button" variant={iconOnly ? "ghost" : "outline"} size={iconOnly ? "icon-sm" : "sm"} disabled={disabled} onClick={copy} aria-label={label} title={label}><Copy className="size-3.5" />{!iconOnly && label}</Button>;
}
