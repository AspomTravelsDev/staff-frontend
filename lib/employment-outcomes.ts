export const employmentOutcomeLabels = {
  active: 'Active staff',
  rejected: 'Not hired',
  discontinued: 'Discontinued',
  not_resumed: 'Did not resume',
  resignation: 'Resignation',
  termination: 'Termination',
  absconded: 'Absconded',
} as const;

export const CUSTOM_OUTCOME_MAX_LENGTH = 40;

export function isStandardEmploymentOutcome(status: string): status is keyof typeof employmentOutcomeLabels {
  return Object.prototype.hasOwnProperty.call(employmentOutcomeLabels, status);
}

export function employmentOutcomeLabel(status?: string | null): string {
  if (!status) return '';
  return isStandardEmploymentOutcome(status) ? employmentOutcomeLabels[status] : status;
}
