import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getAllClients, getClientStats } from "./queries";
import { CRMContent } from "./components/crm-content";

type CRMSearchParams = {
  page?: string | string[];
  limit?: string | string[];
};

const DEFAULT_LIMIT = 50;

const parsePositiveInt = (
  value: string | string[] | undefined,
  fallback: number,
) => {
  if (typeof value !== "string") return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export default async function CRMPage({
  searchParams,
}: {
  searchParams: Promise<CRMSearchParams>;
}) {
  const user = await getCurrentUser();
  const params = await searchParams;

  if (!user) {
    redirect("/login");
  }

  const page = parsePositiveInt(params.page, 1);
  const limit = Math.min(parsePositiveInt(params.limit, DEFAULT_LIMIT), 100);

  const [clientsData, stats] = await Promise.all([
    getAllClients({ page, limit }),
    getClientStats(),
  ]);

  return (
    <CRMContent
      clients={clientsData.items}
      pagination={clientsData.pagination}
      stats={stats}
      currentUserId={user.id}
    />
  );
}
