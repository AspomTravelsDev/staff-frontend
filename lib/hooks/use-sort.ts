import { useState, useMemo } from "react";

export type SortDirection = "asc" | "desc";

export interface SortConfig<T> {
  key: keyof T;
  direction: SortDirection;
}

export interface UseSortOptions<T> {
  initialConfig?: SortConfig<T> | null;
  customSorts?: Partial<Record<keyof T, (a: T, b: T, direction: SortDirection) => number>>;
  dateFields?: (keyof T)[];
}

export function useSort<T>(data: T[], options: UseSortOptions<T> = {}) {
  const [sortConfig, setSortConfig] = useState<SortConfig<T> | null>(
    options.initialConfig || null
  );

  const handleSort = (key: keyof T) => {
    let direction: SortDirection = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    const { key, direction } = sortConfig;
    const sorted = [...data].sort((a, b) => {
      // Custom sorting logic
      if (options.customSorts?.[key]) {
        return options.customSorts[key]!(a, b, direction);
      }

      let aValue: any = a[key] || "";
      let bValue: any = b[key] || "";

      // Date sorting
      if (options.dateFields?.includes(key)) {
        const aDate = aValue ? new Date(aValue).getTime() : 0;
        const bDate = bValue ? new Date(bValue).getTime() : 0;
        if (!isNaN(aDate) && !isNaN(bDate)) {
          aValue = aDate;
          bValue = bDate;
        }
      }

      if (aValue < bValue) return direction === "asc" ? -1 : 1;
      if (aValue > bValue) return direction === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [data, sortConfig, options.customSorts, options.dateFields]);

  return {
    sortedData,
    sortConfig,
    handleSort,
    setSortConfig,
  };
}
