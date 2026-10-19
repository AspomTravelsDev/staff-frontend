import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';
import { actionLoader } from '../lib/api/action-test-utils.mjs';

function loader(api = () => { throw new Error('Unexpected API request'); }) {
  return actionLoader(api, { react: React, 'react/jsx-runtime': jsxRuntime });
}
test('invoice preview and generated document source use the invoice currency for every amount', () => {
  const { InvoicePreview } = loader().load('components/accounts/invoice-preview.tsx');
  for (const currency of ['NGN', 'USD']) {
    const html = renderToStaticMarkup(React.createElement(InvoicePreview, { invoice: {
      currency, subsidiary: 'aspom', invoice_number: 'CUR-1', issue_date: '2026-10-16', due_date: '2026-10-30',
      company_name: 'Aspom', client_name: 'Client', items: [{ description: 'Service', date: '2026-10-16', qty: 1, rate: 100, amount: 100 }],
      subtotal: 100, deposit: 25, balance_due: 75,
    } }));
    assert.match(html, new RegExp(`${currency}[^<]*100\\.00`));
    assert.match(html, new RegExp(`${currency}[^<]*25\\.00`));
    assert.match(html, new RegExp(`${currency}[^<]*75\\.00`));
    assert.doesNotMatch(html, new RegExp(currency === 'USD' ? 'NGN' : 'USD'));
  }
});
test('legacy invoice preview defaults to NGN without changing values', () => {
  const { formatInvoiceMoney } = loader().load('lib/utils/invoice-currency.ts');
  assert.match(formatInvoiceMoney('1250.50'), /NGN\s*1,250\.50/);
  assert.match(formatInvoiceMoney('1250.50', 'USD'), /USD\s*1,250\.50/);
});
test('invoice actions preserve currency in payments and normalize sent invoice response', async () => {
  const calls = [];
  const sent = { id: 'inv-1', currency: 'USD', currency_locked: true, email_status: 'sent' };
  const actions = loader(async (method, url, body) => {
    calls.push({ method, url, body });
    return { success: true, data: url.endsWith('/send') ? { invoice: sent } : { invoice: sent, payment: { amount: 50 } } };
  }).load('lib/api/invoices.ts');
  const result = await actions.sendInvoiceEmail('inv-1', { currency: 'USD', pdfBase64: 'pdf', to: 'client@example.test' });
  assert.deepEqual(result.data, sent);
  await actions.recordInvoicePayment('inv-1', { currency: 'USD', amount: 50, payment_date: '2026-10-16', payment_method: 'CASH' });
  assert.equal(calls[0].body.currency, 'USD');
  assert.equal(calls[1].body.currency, 'USD');
});
test('invoice list sends currency filter to server', async () => {
  let requested;
  const actions = loader(async (_method, url) => { requested = url; return { success: true, data: { data: [], pagination: {} } }; }).load('lib/api/invoices.ts');
  await actions.getInvoices({ currency: 'USD' });
  assert.equal(new URL(requested, 'http://test').searchParams.get('currency'), 'USD');
});
