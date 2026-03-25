import { Suspense } from "react";
import { CurrentRatesForm } from "./components/current-rates-form";
import { RatesHistoryClient } from "./components/rates-history-client";
import { getCurrentRates, getRatesHistoryData } from "./queries";

export const metadata = {
  title: "Current Rates | Aspom Portal",
  description: "Manage current exchange rates",
};

export default async function CurrentRatesPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const from =
    typeof searchParams.from === "string" ? searchParams.from : undefined;
  const to = typeof searchParams.to === "string" ? searchParams.to : undefined;

  const [rates, history] = await Promise.all([
    getCurrentRates(),
    getRatesHistoryData(from, to),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Current Rates</h1>
        <p className="text-muted-foreground">
          View and update the current exchange rates.
        </p>
      </div>

      <div className="max-w-2xl">
        <CurrentRatesForm initialRates={rates} />
      </div>

      <div>
        <RatesHistoryClient
          history={history}
          initialFrom={from}
          initialTo={to}
        />
      </div>
    </div>
  );
}
