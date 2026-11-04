# Invoice discounts

Invoices support an optional invoice-level fixed or percentage discount. Fixed amounts use the invoice currency (NGN or USD). Percentage values range from 0 to 100. No discount remains the default.

The backend owns calculation: round each quantity times rate to two decimal places, sum the line items into the pre-discount subtotal, calculate and round the discount, then subtract it to derive the invoice total. The balance is the discounted total less recorded payments. The API ignores client-supplied totals. Invalid discounts and totals lower than recorded payments are rejected. A fully discounted nonzero invoice has zero balance and paid status.

The saved fields are discount_type, discount_value and discount_amount. The total is a derived model attribute. Legacy invoices receive none/zero defaults without changing existing amounts. Updates that omit discount settings preserve the saved settings; selecting No discount explicitly removes a discount. Draft currency changes clear the discount with the prices.

The invoice form, preview (also used for PDF and image export), email, invoice history, manual payments and online reconciliation use the discounted total. Existing payment-link checks against balance_due remain in force.

Deploy database migration 2026_10_26_160000_add_invoice_discounts.php before serving the updated backend and frontend. It has not been applied to the configured application database during this task.

Verification: 76 backend invoice/payment tests and five frontend invoice tests pass. TypeScript checks pass. Focused lint reports no errors and five existing warnings. Tests use isolated databases and fake payment/email services. Browser visual verification was not performed.
