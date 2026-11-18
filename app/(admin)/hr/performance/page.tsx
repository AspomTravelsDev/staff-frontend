import { redirect } from "next/navigation";

export default async function PerformancePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  query.set("status", "completed");

  for (const key of ["search", "type", "month", "department"] as const) {
    const value = params[key];
    if (typeof value === "string" && value.trim()) {
      query.set(key, value.trim());
    }
  }

  redirect(`/performance/reviews?${query.toString()}`);
}
