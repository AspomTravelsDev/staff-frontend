import test from 'node:test';
import assert from 'node:assert/strict';
import { actionLoader } from './api/action-test-utils.mjs';

const { load } = actionLoader(() => {});
const { employmentOutcomeLabel, isStandardEmploymentOutcome } = load('lib/employment-outcomes.ts');

test('outcome labels preserve standard names and custom text in exports', () => {
  assert.equal(employmentOutcomeLabel('resignation'), 'Resignation');
  assert.equal(employmentOutcomeLabel('termination'), 'Termination');
  assert.equal(employmentOutcomeLabel('absconded'), 'Absconded');
  assert.equal(employmentOutcomeLabel('not_resumed'), 'Did not resume');
  assert.equal(employmentOutcomeLabel('On study_leave'), 'On study_leave');
  assert.equal(isStandardEmploymentOutcome('On study_leave'), false);
  assert.equal(employmentOutcomeLabel('__proto__'), '__proto__');
  const columns = load('lib/utils/hr-application-export.ts').HR_APPLICATION_EXPORT_COLUMNS;
  const outcome = columns.find(column => column.header === 'Staff Outcome');
  assert.equal(outcome.key({ employment_status: 'On study leave' }), 'On study leave');
});
