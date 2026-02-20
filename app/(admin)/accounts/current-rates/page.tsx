import { CurrentRatesForm } from "./components/current-rates-form";
import { getCurrentRates } from "./queries";

export const metadata = {
  title: "Current Rates | Aspom Portal",
  description: "Manage current exchange rates",
};

export default async function CurrentRatesPage() {
  const rates = await getCurrentRates();

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
    </div>
  );
}
