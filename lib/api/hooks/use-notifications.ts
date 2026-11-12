import { useQuery } from "@tanstack/react-query";
import { getNotifications } from "../notifications";
import { useUser } from "@/providers/user-provider";

export function useRoleNotifications() {
    const { user } = useUser();
    const isAuthenticated = !!user;

    return useQuery({
        queryKey: ["notifications"],
        queryFn: getNotifications,
        enabled: isAuthenticated,
        staleTime: 60_000,
        refetchInterval: 180_000, // Poll every 3 minutes while tab is active
        refetchIntervalInBackground: false,
        refetchOnWindowFocus: false,
    });
}
