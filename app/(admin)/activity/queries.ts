/**
 * Activity/Audit Log Queries
 *
 * Server-side data fetching for activity page.
 */

import {
    getActivities as getActivitiesApi,
    type ActivityFilters,
} from "@/lib/api/activity";

export type { ActivityFilters };

export async function getActivities(filters?: ActivityFilters) {
    return getActivitiesApi(filters);
}
