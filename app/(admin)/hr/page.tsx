import { UpcomingBirthdaysCard } from "./components/upcoming-birthdays-card";

export default function Page() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="min-h-screen flex-1 rounded-xl bg-muted/50 md:min-h-min p-4">
        <h1 className="text-2xl font-bold mb-6">Birthday List</h1>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <UpcomingBirthdaysCard />
          {/* Other HR metrics could go here */}
        </div>
      </div>
    </div>
  );
}
