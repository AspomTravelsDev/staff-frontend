import { getPublicPayment } from "@/lib/api/payment-links";
import { PublicPaymentClient } from "@/components/payment/public-payment-client";
export const metadata = { title: "Payment", description: "View your payment status and download your receipt.", robots: { index: false, follow: false }, referrer: "no-referrer" as const };
export default async function PaymentPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ reference?: string }> }) {
  const { token } = await params; const { reference } = await searchParams;
  if (!/^[a-f0-9]{64}$/.test(token)) return <p className="text-center">This payment link is unavailable. Please contact Accounts.</p>;
  const response = await getPublicPayment(token);
  if (!response.success) return <p className="text-center">This payment link is unavailable. Please contact Accounts or try again later.</p>;
  return <PublicPaymentClient key={`${token}-${reference || "request"}`} token={token} initial={response.data.data} reference={reference} />;
}
