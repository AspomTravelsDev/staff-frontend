export type InvoiceCurrency = "NGN" | "USD";

/** Invoice values are already in major units; currency selection never converts them. */
export function formatInvoiceMoney(amount: number | string, currency: InvoiceCurrency = "NGN") {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    currencyDisplay: "code",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount));
}
