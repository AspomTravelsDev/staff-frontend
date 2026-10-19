import type { LeaveRequest } from "@/lib/api/leave";

export type LeaveSort =
  | "pending"
  | "start_desc"
  | "start_asc"
  | "name"
  | "days";
export interface LeaveListFilters {
  search: string;
  status: string;
  department: string;
  type: string;
  sort: LeaveSort;
}

export function filterLeaveRequests(
  requests: LeaveRequest[],
  filters: LeaveListFilters,
) {
  const search = filters.search.trim().toLocaleLowerCase();
  return requests
    .filter(
      (row) =>
        (filters.status === "all" || row.status === filters.status) &&
        (filters.department === "all" ||
          row.department === filters.department) &&
        (filters.type === "all" || row.type === filters.type) &&
        (!search ||
          [row.employeeName, row.department, row.type].some((value) =>
            value.toLocaleLowerCase().includes(search),
          )),
    )
    .sort((a, b) => {
      const dateOrder = a.startDate.localeCompare(b.startDate);
      let order = 0;
      switch (filters.sort) {
        case "pending":
          order =
            Number(b.status === "Pending") - Number(a.status === "Pending") ||
            -dateOrder;
          break;
        case "start_desc":
          order = -dateOrder;
          break;
        case "start_asc":
          order = dateOrder;
          break;
        case "name":
          order = a.employeeName.localeCompare(b.employeeName);
          break;
        case "days":
          order = b.days - a.days;
          break;
      }
      return order || a.id.localeCompare(b.id);
    });
}

export function paginateLeaveRequests<T>(
  rows: T[],
  requestedPage: number,
  pageSize: number,
) {
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const page = Math.max(1, Math.min(requestedPage, totalPages));
  const start = (page - 1) * pageSize;
  return {
    rows: rows.slice(start, start + pageSize),
    page,
    totalPages,
    from: rows.length ? start + 1 : 0,
    to: Math.min(start + pageSize, rows.length),
  };
}
