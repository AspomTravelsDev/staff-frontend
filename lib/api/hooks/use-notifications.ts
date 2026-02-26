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
        refetchInterval: 60000, // Poll every 60 seconds
    });
}
