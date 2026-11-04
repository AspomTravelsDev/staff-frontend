import test from 'node:test';
import assert from 'node:assert/strict';
import { actionLoader } from '../api/action-test-utils.mjs';

const { load } = actionLoader(() => {});
const { splitPayrollExportEntries } = load('lib/payroll/export-groups.ts');

test('Full Staff and FHON exports partition payroll without duplicates or changing order', () => {
  const entries = [
    { id: 'full', is_intern: false, user: { contract_type: 'full_time' } },
    { id: 'intern', is_intern: true, user: { contract_type: 'intern' } },
    { id: 'contract', is_intern: true, user: { contract_type: 'contract' } },
    { id: 'part', is_intern: false, user: { contract_type: 'part_time' } },
    { id: 'nysc', is_intern: true, user: { contract_type: 'nysc' } },
  ];
  const result = splitPayrollExportEntries(entries);
  assert.deepEqual(result.full_staff.map(e => e.id), ['full', 'part']);
  assert.deepEqual(result.fhon.map(e => e.id), ['intern', 'contract', 'nysc']);
  assert.equal(new Set([...result.full_staff, ...result.fhon]).size, entries.length);
  assert.equal(result.fhon[0], entries[1]);
});

test('saved payroll classification wins over subsequent changes to the current contract', () => {
  const result = splitPayrollExportEntries([
    { id: 'previous-intern', is_intern: true, user: { contract_type: 'full_time' } },
    { id: 'salaried-contract', is_intern: false, user: { contract_type: 'contract' } },
  ]);
  assert.deepEqual(result.fhon.map(e => e.id), ['previous-intern']);
  assert.deepEqual(result.full_staff.map(e => e.id), ['salaried-contract']);
});

test('legacy entries use the existing contract classification and empty groups stay empty', () => {
  const result = splitPayrollExportEntries([
    { id: 'intern', user: { contract_type: 'intern' } },
    { id: 'nysc', user: { contract_type: 'nysc' } },
    { id: 'contract', user: { contract_type: 'contract' } },
    { id: 'staff', user: { contract_type: 'full_time' } },
  ]);
  assert.equal(result.fhon.length, 3);
  assert.equal(result.full_staff.length, 1);
  assert.deepEqual(splitPayrollExportEntries([]), { full_staff: [], fhon: [] });
});
