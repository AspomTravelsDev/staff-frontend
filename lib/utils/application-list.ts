export type ApplicationSort =
  | "newest"
  | "oldest"
  | "name_asc"
  | "name_desc"
  | "position";
export interface ApplicationListFilters {
  search: string;
  status: string;
  position: string;
  sort: ApplicationSort;
}
type ApplicationRow = {
  id: string;
  application_id: string;
  applicant_name: string | null;
  applicant_email: string;
  position_title: string;
  status: string;
  invited_at: string;
};

export function filterApplications<T extends ApplicationRow>(
  applications: T[],
  filters: ApplicationListFilters,
): T[] {
  const search = filters.search.trim().toLocaleLowerCase();
  const name = (row: T) =>
    row.applicant_name || row.applicant_email.split("@")[0];
  const date = (row: T) => Date.parse(row.invited_at) || 0;
  return applications
    .filter(
      (row) =>
        (filters.status === "all" || row.status === filters.status) &&
        (filters.position === "all" ||
          row.position_title === filters.position) &&
        (!search ||
          [
            row.applicant_name,
            row.applicant_email,
            row.application_id,
            row.position_title,
          ].some((value) => value?.toLocaleLowerCase().includes(search))),
    )
    .sort((a, b) => {
      let order = 0;
      switch (filters.sort) {
        case "newest":
          order = date(b) - date(a);
          break;
        case "oldest":
          order = date(a) - date(b);
          break;
        case "name_asc":
          order = name(a).localeCompare(name(b));
          break;
        case "name_desc":
          order = name(b).localeCompare(name(a));
          break;
        case "position":
          order =
            a.position_title.localeCompare(b.position_title) ||
            name(a).localeCompare(name(b));
          break;
      }
      return order || a.id.localeCompare(b.id);
    });
}

export function paginateApplications<T>(
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
