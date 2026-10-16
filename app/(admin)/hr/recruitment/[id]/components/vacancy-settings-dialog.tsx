"use client";

import { useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { RecruitmentRole } from "@/lib/types/recruitment";
import { PipelineVacancySettings } from "./pipeline-vacancy-settings";

export function VacancySettingsDialog({
  role,
  onClose,
  onSaved,
}: {
  role: RecruitmentRole;
  onClose: () => void;
  onSaved: (role: RecruitmentRole) => void;
}) {
  const guard = useRef<() => Promise<boolean>>(async () => true);
  const registerClose = useCallback((check: () => Promise<boolean>) => {
    guard.current = check;
    return () => {
      guard.current = async () => true;
    };
  }, []);
  async function close() {
    if (await guard.current()) onClose();
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) void close();
      }}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Vacancy settings</DialogTitle>
          <DialogDescription>
            {role.title} · {role.department}
          </DialogDescription>
        </DialogHeader>
        <PipelineVacancySettings
          role={role}
          registerClose={registerClose}
          onSaved={onSaved}
        />
      </DialogContent>
    </Dialog>
  );
}
