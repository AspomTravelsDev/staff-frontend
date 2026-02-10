import { CurrentRatesForm } from "./components/current-rates-form";

export const metadata = {
  title: "Current Rates | Aspom Portal",
  description: "Manage current exchange rates",
};

export default function CurrentRatesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Current Rates</h1>
        <p className="text-muted-foreground">
          View and update the current exchange rates.
        </p>
      </div>

      <div className="max-w-2xl">
        <CurrentRatesForm />
      </div>
    </div>
  );
}
