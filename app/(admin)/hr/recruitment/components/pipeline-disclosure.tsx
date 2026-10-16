"use client";

import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export function PipelineDisclosure({
  title,
  children,
  defaultOpen = false,
  className,
  suffix,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  suffix?: React.ReactNode;
}) {
  return (
    <Collapsible defaultOpen={defaultOpen} className={className}>
      <div className="flex items-start justify-between gap-2">
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="group -ml-2 h-auto min-h-7 min-w-0 max-w-full shrink justify-start whitespace-normal text-left text-muted-foreground"
          >
            <ChevronDown className="size-3.5 shrink-0 transition-transform group-aria-expanded:rotate-180" />
            {title}
          </Button>
        </CollapsibleTrigger>
        {suffix}
      </div>
      <CollapsibleContent className="pt-2">{children}</CollapsibleContent>
    </Collapsible>
  );
}
