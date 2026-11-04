import type { NavItem } from "./navigation";
import type { NotificationCountValue } from "./api/notifications";

type BadgeItem = Pick<NavItem, "badgeKey" | "disabled"> & { items?: BadgeItem[] };

/** Count each notification source once, including nested links. */
export function getNavigationBadgeTotal(items: BadgeItem[], badges: Record<string, NotificationCountValue> = {}): number {
  const keys = new Set<string>();
  const visit = (item: BadgeItem) => {
    if (item.disabled) return;
    item.badgeKey?.split(",").forEach(key => { if (key.trim()) keys.add(key.trim()); });
    item.items?.forEach(visit);
  };
  items.forEach(visit);
  return [...keys].reduce((total, key) => {
    const value = badges[key];
    const count = typeof value === "object" && value !== null ? value.count : value;
    return total + (typeof count === "number" && Number.isFinite(count) ? Math.max(0, count) : 0);
  }, 0);
}
