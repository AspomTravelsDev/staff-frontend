import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getAllClients, getClientStats } from "./queries";
import { CRMContent } from "./components/crm-content";

export default async function CRMPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [clients, stats] = await Promise.all([
    getAllClients(),
    getClientStats(),
  ]);

  return <CRMContent clients={clients} stats={stats} />;
}
