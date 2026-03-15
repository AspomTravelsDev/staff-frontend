"use client";

import { TableExportButton } from "@/components/ui/table-export-button";
import { HR_APPLICATION_EXPORT_COLUMNS } from "@/lib/utils/hr-application-export";
import type { OnboardingApplication } from "@/lib/types/hr";

interface ApplicationExportButtonProps {
  applications: OnboardingApplication[];
  filename?: string;
}

export function ApplicationExportButton({
  applications,
  filename = "hr-applications",
}: ApplicationExportButtonProps) {
  return (
    <TableExportButton
      data={applications}
      columns={HR_APPLICATION_EXPORT_COLUMNS}
      filename={filename}
      keyExtractor={(app) => app.id}
    />
  );
}
