import test from 'node:test';
import assert from 'node:assert/strict';
import { actionLoader } from './action-test-utils.mjs';

test('photo save sends a real multipart file and uses Laravel method override for updates', async () => {
  const upload = new File(['photo bytes'], 'fan.png', { type: 'image/png' });
  const photoData = new FormData(); photoData.set('photo', upload);
  const { load } = actionLoader(async (method, url, body) => {
    assert.equal(method, 'post');
    assert.equal(url, '/api/admin/company-inventory/12');
    assert.ok(body instanceof FormData);
    assert.equal(body.get('_method'), 'PATCH');
    assert.equal(body.get('photo').name, 'fan.png');
    assert.equal(body.get('photo').type, 'image/png');
    assert.equal(body.get('serial_number'), '');
    assert.equal(body.get('name'), 'Office fan');
    return { success: true, data: { id: 12, photo_file_id: 'photo-id' } };
  });
  const result = await load('lib/api/company-inventory.actions.ts').saveCompanyAsset({ name: 'Office fan', serial_number: null }, 12, photoData);
  assert.equal(result.success, true);
  assert.equal(result.data.photo_file_id, 'photo-id');
});

test('photo removal is explicit and backend validation remains visible', async () => {
  const photoData = new FormData(); photoData.set('remove_photo', '1');
  const { load } = actionLoader(async (_method, _url, body) => {
    assert.equal(body.get('remove_photo'), '1');
    assert.equal(body.get('photo'), null);
    return { success: false, error: { error: 'Choose an image up to 5 MB.', code: 'HTTP_422' } };
  });
  const result = await load('lib/api/company-inventory.actions.ts').saveCompanyAsset({ name: 'Fan' }, 12, photoData);
  assert.equal(result.success, false);
  assert.match(result.error.message, /5 MB/);
});

test('private photo proxy forwards authentication without making image responses cacheable', async t => {
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.match(url, /\/api\/admin\/company-inventory\/12\/photo$/);
    assert.equal(options.headers.Authorization, 'Bearer test-token');
    assert.equal(options.cache, 'no-store');
    return new Response('photo bytes', { headers: { 'Content-Type': 'image/png' } });
  });
  const { load } = actionLoader(() => {});
  const response = await load('app/api/company-inventory/[id]/photo/route.ts').GET(new Request('http://localhost/api/company-inventory/12/photo'), { params: Promise.resolve({ id: '12' }) });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.equal(response.headers.get('content-type'), 'image/png');
  assert.equal(await response.text(), 'photo bytes');
});
