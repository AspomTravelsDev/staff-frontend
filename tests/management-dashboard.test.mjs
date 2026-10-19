import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import * as jsxRuntime from 'react/jsx-runtime';
import { actionLoader } from '../lib/api/action-test-utils.mjs';

function dashboard(user, fail = false) {
  const calls = { management: 0, personal: 0 };
  const data = { marker: 'management summary' };
  const path = 'app/(admin)/dashboard/page.tsx';
  const overrides = {
    'react/jsx-runtime': jsxRuntime,
    '@/lib/auth/session': { getCurrentUser: async () => user },
    '@/lib/api/render-data-page': { renderDataPage: async fn => { try { return await fn(); } catch { return 'LOAD_ERROR'; } } },
    '@/lib/api/management-dashboard': { getManagementDashboard: async () => { calls.management++; if (fail) throw new Error('API unavailable'); return data; } },
    '@/components/dashboard/management-dashboard': { ManagementDashboard: 'ManagementDashboard' },
    '@/lib/api/clock-in': { getClockInHistory: () => { calls.personal++; throw new Error('PERSONAL_DASHBOARD_REACHED'); } },
  };
  const source = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  for (const statement of source.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    const name = statement.moduleSpecifier.text;
    if (name in overrides || name === '@/types/user-types') continue;
    const bindings = statement.importClause?.namedBindings;
    const names = bindings && ts.isNamedImports(bindings) ? bindings.elements.map(item => item.propertyName?.text ?? item.name.text) : [];
    overrides[name] = Object.fromEntries(names.map(key => [key, 'UnusedComponent']));
  }
  return { run: actionLoader(() => {}, overrides).load(path).default, calls, data };
}

test('MP/MD primary and secondary roles receive one management fetch and no personal fetches', async () => {
  for (const role of ['mp', 'md']) for (const user of [{role}, {role:'visa',secondary_roles:[role]}, {role:'visa',roles:['visa',role]}]) {
    const fixture = dashboard(user);
    const result = await fixture.run();
    assert.equal(result.type, 'ManagementDashboard');
    assert.equal(result.props.data, fixture.data);
    assert.deepEqual(fixture.calls, {management:1,personal:0});
  }
});
test('other roles retain the existing personal dashboard', async () => {
  for (const role of ['super','hr','it','account','visa']) {
    const fixture = dashboard({role});
    await assert.rejects(fixture.run(), /PERSONAL_DASHBOARD_REACHED/);
    assert.deepEqual(fixture.calls, {management:0,personal:1});
  }
});
test('management load errors do not silently become zero counts or personal data', async () => {
  const fixture = dashboard({role:'mp'}, true);
  assert.equal(await fixture.run(), 'LOAD_ERROR');
  assert.deepEqual(fixture.calls, {management:1,personal:0});
});
test('management API unwraps its summary and preserves server failures', async () => {
  let url;
  const api = actionLoader(async (_method, endpoint) => { url = endpoint; return { success:true, data:{data:{attendance:{present:3}}} }; }).load('lib/api/management-dashboard.ts');
  assert.equal((await api.getManagementDashboard()).attendance.present, 3);
  assert.equal(url, '/api/management/dashboard');
  const failed = actionLoader(async () => ({success:false,error:{error:'Forbidden',code:'403'}})).load('lib/api/management-dashboard.ts');
  await assert.rejects(failed.getManagementDashboard(), /Forbidden/);
});
