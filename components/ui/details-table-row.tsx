"use client";

import type { ComponentProps, KeyboardEvent, MouseEvent } from "react";
import { cn } from "@/lib/utils";
import { TableRow } from "@/components/ui/table";

type DetailsTableRowProps = ComponentProps<typeof TableRow> & {
  detailLabel: string;
  onOpenDetails: () => void;
};

const INTERACTIVE_TARGETS =
  'a, button, input, select, textarea, [role="button"], [role="checkbox"], [data-row-click-ignore]';

export function DetailsTableRow({
  detailLabel,
  onOpenDetails,
  className,
  onClick,
  onKeyDown,
  tabIndex,
  ...props
}: DetailsTableRowProps) {
  const handleClick = (event: MouseEvent<HTMLTableRowElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;

    const target = event.target;
    if (target instanceof Element && target.closest(INTERACTIVE_TARGETS)) return;
    onOpenDetails();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTableRowElement>) => {
    onKeyDown?.(event);
    if (
      event.defaultPrevented ||
      event.target !== event.currentTarget ||
      (event.key !== "Enter" && event.key !== " ")
    ) {
      return;
    }

    event.preventDefault();
    onOpenDetails();
  };

  return (
    <TableRow
      {...props}
      tabIndex={tabIndex ?? 0}
      aria-label={detailLabel}
      className={cn(
        "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
        className,
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    />
  );
}
