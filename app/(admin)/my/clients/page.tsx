import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getAllClients, getClientStats } from "./queries";
import { CRMContent } from "./components/crm-content";
import {
  CRM_SERVICE_OPTIONS,
  CRM_SOURCE_OPTIONS,
  type CRMStatus,
} from "@/lib/api/crm-constants";

type CRMSearchParams = {
  page?: string | string[];
  limit?: string | string[];
  search?: string | string[];
  status?: string | string[];
  service?: string | string[];
  source?: string | string[];
};

const DEFAULT_LIMIT = 50;
const ALLOWED_STATUSES: CRMStatus[] = [
  "potential",
  "follow_up",
  "negotiation",
  "paid",
  "inactive",
];

const parsePositiveInt = (
  value: string | string[] | undefined,
  fallback: number,
) => {
  if (typeof value !== "string") return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const parseAllowedString = (
  value: string | string[] | undefined,
  allowed: readonly string[],
) => {
  if (typeof value !== "string") return undefined;
  return allowed.includes(value) ? value : undefined;
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
  const search = typeof params.search === "string" ? params.search.trim() : "";

  const rawStatus =
    typeof params.status === "string" ? params.status : undefined;
  const status =
    rawStatus && ALLOWED_STATUSES.includes(rawStatus as CRMStatus)
      ? (rawStatus as CRMStatus)
      : undefined;
  const service = parseAllowedString(params.service, CRM_SERVICE_OPTIONS);
  const source = parseAllowedString(params.source, CRM_SOURCE_OPTIONS);

  const [clientsData, stats] = await Promise.all([
    getAllClients({
      page,
      limit,
      search: search || undefined,
      status,
      service,
      source,
    }),
    getClientStats({
      search: search || undefined,
      status,
      service,
      source,
    }),
  ]);

  return (
    <CRMContent
      clients={clientsData.items}
      pagination={clientsData.pagination}
      filters={{
        search,
        status: status || "all",
        service: service || "all",
        source: source || "all",
      }}
      stats={stats}
      currentUserId={user.id}
    />
  );
}
