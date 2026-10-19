import test from 'node:test';
import assert from 'node:assert/strict';
import { actionLoader } from '../lib/api/action-test-utils.mjs';
const app = '01a144e4-0014-7230-a14b-3c8f3ad48b42';
const file = '01a14501-7a6c-71f3-bc6d-9ad72abe8c2d';
const routeFile = 'app/api/onboarding/[applicationId]/documents/[kind]/[document]/route.ts';
const context = (extra = {}) => ({ params: Promise.resolve({ applicationId: app, kind: 'files', document: file, ...extra }) });
function load(file) { return actionLoader(() => { throw new Error('Unexpected API'); }).load(file); }
test('document fetch stays on the portal origin when direct backend requests reset', async () => {
  const old = global.fetch;
  global.fetch = async url => {
    if (String(url).startsWith('http')) throw new TypeError('Failed to fetch: ERR_CONNECTION_RESET');
    assert.equal(url, `/api/onboarding/${app}/documents/files/${file}`);
    return new Response('%PDF-1.4 fixture', { headers: { 'Content-Type': 'application/pdf' } });
  };
  try {
    const { fetchOnboardingDocument } = load('lib/utils/onboarding-download.ts');
    const response = await fetchOnboardingDocument(`http://127.0.0.1:8000/api/public/onboarding-applications/${app}/files/${file}`, app);
    assert.match(await response.text(), /^%PDF-/);
  } finally { global.fetch = old; }
});
test('download URL validation rejects other applicants and arbitrary paths', () => {
  const { onboardingDownloadUrl } = load('lib/utils/onboarding-download.ts');
  assert.throws(() => onboardingDownloadUrl(`http://example.test/api/public/onboarding-applications/other/files/${file}`, app));
  assert.throws(() => onboardingDownloadUrl('http://example.test/private', app));
  assert.equal(onboardingDownloadUrl(`/api/public/onboarding-applications/${app}/assets/form.pdf`, app), `/api/onboarding/${app}/documents/assets/form.pdf`);
});
test('download route preserves PDF bytes and attachment headers without public caching', async () => {
  const old = global.fetch;
  global.fetch = async (url, options) => {
    assert.equal(new URL(url).pathname, `/api/public/onboarding-applications/${app}/files/${file}`);
    assert.equal(options.cache, 'no-store');
    assert.equal(options.redirect, 'error');
    assert.equal(options.headers?.Authorization, undefined);
    return new Response('%PDF-1.4 fixture', { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="Guarantor.pdf"' } });
  };
  try {
    const response = await load(routeFile).GET(new Request('http://portal.test/download'), context());
    assert.equal(response.status, 200);
    assert.equal(await response.text(), '%PDF-1.4 fixture');
    assert.equal(response.headers.get('Content-Disposition'), 'attachment; filename="Guarantor.pdf"');
    assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
    assert.equal(response.headers.get('Content-Length'), String(Buffer.byteLength('%PDF-1.4 fixture')));
  } finally { global.fetch = old; }
});
test('download route returns useful failures and does not fetch unvalidated paths', async () => {
  const old = global.fetch; let calls = 0;
  global.fetch = async () => { calls++; throw new TypeError('socket reset'); };
  try {
    const { GET } = load(routeFile);
    assert.equal((await GET(new Request('http://portal.test'), context({ kind: 'private' }))).status, 400);
    assert.equal((await GET(new Request('http://portal.test'), context({ document: '../secret' }))).status, 400);
    assert.equal(calls, 0);
    assert.equal((await GET(new Request('http://portal.test'), context())).status, 502);
    global.fetch = async () => new Response('Internal storage path', { status: 404 });
    const missing = await GET(new Request('http://portal.test'), context());
    assert.equal(missing.status, 404);
    assert.doesNotMatch(await missing.text(), /Internal storage path/);
  } finally { global.fetch = old; }
});
import { readFileSync } from 'node:fs';
import ts from 'typescript';
test('the actual Step 7 download handler succeeds when Edge cannot reach the backend directly', async () => {
  const source = readFileSync(new URL('../app/(public)/applicant/[id]/components/step-7-documents.tsx', import.meta.url), 'utf8');
  const handler = source.slice(source.indexOf('  const downloadFile ='), source.indexOf('  const getRequiredForms ='));
  const js = ts.transpileModule(handler, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  let clicked = 0;
  const fetcher = async url => {
    if (String(url).startsWith('http')) throw new TypeError('Failed to fetch: ERR_CONNECTION_RESET');
    return new Response('%PDF-1.4 fixture', { headers: { 'Content-Type': 'application/pdf' } });
  };
  const oldFetch = global.fetch;
  global.fetch = fetcher;
  try {
    // Before the fix the real handler uses direct fetch, so no helper is required.
    const helper = source.includes('await fetchOnboardingDocument(') ? load('lib/utils/onboarding-download.ts').fetchOnboardingDocument : undefined;
    const run = new Function('fetch', 'window', 'setDownloadingFile', 'document', 'URL', 'toast', 'console', 'fetchOnboardingDocument', 'applicationId', js + '\nreturn downloadFile;');
    const document = { createElement: () => ({ click: () => clicked++ }), body: { appendChild() {}, removeChild() {} } };
    const handlerFunction = run(fetcher, { location: { origin: 'http://localhost:3000' }, setTimeout: fn => fn() }, () => {}, document, URL, { error() {} }, { error() {} }, helper, app);
    await handlerFunction(`http://127.0.0.1:8000/api/public/onboarding-applications/${app}/files/${file}`, 'Guarantor_1_Form.pdf');
    assert.equal(clicked, 1, 'The direct backend fetch reset and no PDF download started');
  } finally { global.fetch = oldFetch; }
});
