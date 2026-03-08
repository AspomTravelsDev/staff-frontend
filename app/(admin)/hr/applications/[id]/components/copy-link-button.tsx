"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function CopyLinkButton({ url }: { url: string }) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleCopy}>
      Copy Link
    </Button>
  );
}
