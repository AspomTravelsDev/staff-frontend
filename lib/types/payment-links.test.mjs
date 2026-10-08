import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const compiled = ts.transpileModule(readFileSync(new URL("./payment-links.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const exports = {};
vm.runInNewContext(compiled, { exports });
const link = { currency: "NGN", mode: "test" };
const attempt = {
  details_verified: true, status: "success", provider_id: "123", reconciled_at: "2026-10-07T11:00:00Z", paid_at: "2026-10-07T11:00:00Z",
  amount_minor: 4000000, verified_amount_minor: 4071066, verified_requested_amount_minor: 4000000, fees_minor: 71066,
  verified_currency: "NGN", verified_mode: "test",
};
test("fee-inclusive receipt accepts Paystack's original amount and exact fee difference", () => {
  assert.equal(exports.hasVerifiedPaymentReceipt(attempt, link), true);
  assert.equal(exports.hasVerifiedPaymentReceipt({ ...attempt, verified_amount_minor: 4000000, verified_requested_amount_minor: null }, link), true);
});
test("receipts reject unproven extra amounts or unverified payment details", () => {
  for (const invalid of [
    { verified_requested_amount_minor: null }, { verified_requested_amount_minor: 1 }, { fees_minor: 71065 },
    { verified_amount_minor: 3999999 }, { verified_currency: "USD" }, { verified_mode: "live" },
    { details_verified: false }, { status: "failed" }, { paid_at: null }, { reconciled_at: null }, { provider_id: null },
  ]) assert.equal(exports.hasVerifiedPaymentReceipt({ ...attempt, ...invalid }, link), false);
});
test("review messages preserve refund warnings instead of presenting them as fee differences", () => {
  const reason = "Paystack reported refund processed. Accounts must reconcile this payment.";
  assert.equal(exports.paymentReviewDescription({ ...link, attention_reason: reason, attempts: [{ ...attempt, message: "The verified payment details did not match this request." }] }), reason);
});
