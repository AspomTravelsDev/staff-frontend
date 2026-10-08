import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import JSZip from "jszip";

const require = createRequire(import.meta.url);
function loadExports() {
  const downloads = []; const blobs = new Map();
  const receiptText = []; const receiptFiles = [];
  class ReceiptPdf {
    setFontSize() {}
    setFont() {}
    setTextColor() {}
    setDrawColor() {}
    setLineWidth() {}
    setFillColor() {}
    setLineDashPattern() {}
    line() {}
    rect() {}
    getNumberOfPages() { return 1; }
    setPage() {}
    addPage() {}
    getTextWidth(value) { return value.length; }
    splitTextToSize(value) { return [value]; }
    text(value) { receiptText.push(...(Array.isArray(value) ? value : [value])); }
    save(filename) { receiptFiles.push(filename); }
  }
  const cache = new Map();
  const load = url => {
    if (cache.has(url.href)) return cache.get(url.href);
    const source = readFileSync(url, "utf8");
    const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
    const exports = {}; cache.set(url.href, exports);
    vm.runInNewContext(compiled, { exports, require: name => {
      if (name === "jspdf") return { jsPDF: ReceiptPdf };
      if (name.startsWith("@/")) return load(new URL("../../" + name.slice(2) + ".ts", import.meta.url));
      if (name.startsWith(".")) return load(new URL(name + ".ts", url));
      return require(name);
    }, Blob, setTimeout: fn => fn(), fetch: async () => ({ ok: false }),
      URL: { createObjectURL: blob => { const key = String(blobs.size); blobs.set(key, blob); return key; }, revokeObjectURL() {} },
      document: { createElement: () => ({ click() { downloads.push({ filename: this.download, blob: blobs.get(this.href) }); } }) },
    });
    return exports;
  };
  const exports = load(new URL("./payment-link-files.ts", import.meta.url));
  return { ...exports, downloads, receiptText, receiptFiles };
}
const rows = [{ Reference: 'PL-123', Client: '=HYPERLINK("https://example.test")', Purpose: 'Visa <deposit> & travel\nSecond line', Amount: '20.15', Currency: 'USD', Status: 'paid', Mode: 'live', Subsidiary: 'aspom', Created: '2026-10-07' }];
test("CSV preserves currency and multiline data and neutralizes formula injection", async () => {
  const files = loadExports(); await files.exportPaymentRows(rows, "csv");
  const csv = await files.downloads[0].blob.text();
  assert.equal(files.downloads[0].filename, "payment-links.csv");
  assert.ok(csv.includes('"Currency"')); assert.ok(csv.includes('"USD"'));
  assert.ok(csv.includes('"\'=HYPERLINK(""https://example.test"")"'));
  assert.ok(csv.includes('"Visa <deposit> & travel\nSecond line"'));
});
test("Excel stores user text as literal cells and uses valid workbook relationships", async () => {
  const files = loadExports(); await files.exportPaymentRows(rows, "xlsx");
  const zip = await JSZip.loadAsync(await files.downloads[0].blob.arrayBuffer());
  const worksheet = await zip.file("xl/worksheets/sheet1.xml").async("string");
  assert.equal(files.downloads[0].filename, "payment-links.xlsx");
  assert.ok(worksheet.includes('r="E2" t="inlineStr"><is><t xml:space="preserve">USD'));
  assert.ok(worksheet.includes('=HYPERLINK(&quot;https://example.test&quot;)')); assert.ok(!worksheet.includes("<f>"));
  assert.ok(worksheet.includes("Visa &lt;deposit&gt; &amp; travel"));
  assert.ok((await zip.file("_rels/.rels").async("string")).includes('Target="xl/workbook.xml"'));
  assert.ok((await zip.file("xl/_rels/workbook.xml.rels").async("string")).includes('Target="worksheets/sheet1.xml"'));
});
test("receipt separates the request amount, client-paid fee, and total charged", async () => {
  const files = loadExports();
  await files.downloadPaymentReceipt({ reference: "PL-fee", purpose: "Visa deposit", currency: "NGN", mode: "test", receipt: {
    reference: "ASP-fee", payer: "Test client", amount_minor: 4071066, request_amount_minor: 4000000, customer_fee_minor: 71066,
    paid_at: "2026-10-07T11:00:00Z", channel: "card",
  } });
  assert.ok(files.receiptText.includes("Request amount") && files.receiptText.includes("NGN 40,000.00"));
  assert.ok(files.receiptText.includes("Paystack fees") && files.receiptText.includes("NGN 710.66"));
  assert.ok(files.receiptText.includes("TOTAL PAID") && files.receiptText.includes("NGN 40,710.66"));
  assert.deepEqual(files.receiptFiles, ["PL-fee-receipt.pdf"]);
});

test("receipt uses the selected subsidiary and keeps a partial invoice balance", async () => {
  const files = loadExports();
  await files.downloadPaymentReceipt({ reference: "PL-usd", purpose: "Deposit", subsidiary: "travelatal", currency: "USD", mode: "live", receipt: {
    reference: "ASP-usd", payer: "Client", amount_minor: 20000, request_amount_minor: 20000, customer_fee_minor: 0,
    paid_at: "2026-10-07T11:00:00Z", channel: "card", invoice: { number: "INV-1", balance_due_minor: 30000 },
  } });
  assert.ok(files.receiptText.includes("TRAVELATAL LTD"));
  assert.ok(files.receiptText.includes("USD 200.00"));
  assert.ok(files.receiptText.includes("Current invoice balance"));
  assert.ok(files.receiptText.includes("USD 300.00"));
  assert.ok(files.receiptText.includes("This receipt confirms this payment. The invoice still has an outstanding balance."));
  assert.ok(!files.receiptText.includes("PAID"));
});
test("test invoice receipt does not imply a real credit and retains custom invoice branding", async () => {
  const files = loadExports();
  await files.downloadPaymentReceipt({ reference: "PL-test", purpose: "Deposit", subsidiary: "abs", currency: "NGN", mode: "test",
    company_details: { company_name: "Custom company", company_email: "accounts@example.test", company_website: null, company_phone: null, company_address: null }, receipt: {
      reference: "ASP-test", payer: "Client", amount_minor: 50000, paid_at: "2026-10-07T11:00:00Z", channel: "card",
      invoice: { number: "INV-test", balance_due_minor: null },
    } });
  assert.ok(files.receiptText.includes("CUSTOM COMPANY"));
  assert.ok(files.receiptText.includes("TEST PAYMENT - No real money was received."));
  assert.ok(!files.receiptText.includes("Current invoice balance"));
  assert.ok(files.receiptText.includes("This test receipt does not confirm a real payment or reduce your invoice balance."));
});

test("development invoice receipt shows the simulated balance without claiming real money", async () => {
  const files = loadExports();
  await files.downloadPaymentReceipt({ reference: "PL-dev", purpose: "Invoice payment", subsidiary: "aspom", currency: "NGN", mode: "test", receipt: {
    reference: "ASP-dev", payer: "Client", amount_minor: 4071066, request_amount_minor: 4000000, customer_fee_minor: 71066,
    paid_at: "2026-10-07T11:00:00Z", channel: "card", invoice: { number: "SEP002/2026", balance_due_minor: 0 },
  } });
  assert.ok(files.receiptText.includes("Test invoice balance"));
  assert.ok(files.receiptText.includes("NGN 0.00"));
  assert.ok(files.receiptText.includes("No real money was received. The invoice balance reflects simulated development payments."));
  assert.ok(!files.receiptText.includes("This test receipt does not confirm a real payment or reduce your invoice balance."));
});
