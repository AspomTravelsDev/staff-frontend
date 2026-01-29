"use client";

import { useState } from "react";
import { IconPlus } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { GoogleFormSheet } from "./google-form-sheet";

interface CreateApplicationButtonProps extends React.ComponentProps<
  typeof Button
> {
  label?: string;
  showIcon?: boolean;
}

export function CreateApplicationButton({
  label = "New Application",
  showIcon = true,
  className,
  variant,
  size,
  ...props
}: CreateApplicationButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className={className}
        variant={variant}
        size={size}
        {...props}
      >
        {showIcon && <IconPlus className="mr-2 size-4" />}
        {label}
      </Button>

      <GoogleFormSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
