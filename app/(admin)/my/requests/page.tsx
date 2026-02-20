import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getMyRequests } from "./queries";
import { MyRequestsContent } from "./components/my-requests-content";

export default async function MyRequestsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const requests = await getMyRequests();

  return <MyRequestsContent requests={requests} />;
}
