import { Skeleton } from "./skeleton";

interface PageSkeletonProps {
  showCards?: boolean;
  cardCount?: number;
  showFilters?: boolean;
  filterCount?: number;
  showTable?: boolean;
  rowCount?: number;
}

export function PageSkeleton({
  showCards = true,
  cardCount = 4,
  showFilters = true,
  filterCount = 3,
  showTable = true,
  rowCount = 5,
}: PageSkeletonProps) {
  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-[250px]" />
        <Skeleton className="h-4 w-[400px]" />
      </div>

      {/* Cards Skeleton */}
      {showCards && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: cardCount }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      )}

      {/* Filters Skeleton */}
      {showFilters && (
        <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center bg-card p-4 rounded-lg border">
          {Array.from({ length: filterCount }).map((_, i) => (
            <div key={i} className="grid gap-2 w-full sm:w-auto">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full sm:w-[150px]" />
            </div>
          ))}
          <div className="flex items-center gap-2 mt-auto ml-auto">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      )}

      {/* Table Skeleton */}
      {showTable && (
        <div className="rounded-md border">
          <div className="h-12 border-b bg-muted/50 flex items-center px-4">
            <Skeleton className="h-4 w-full" />
          </div>
          {Array.from({ length: rowCount }).map((_, i) => (
            <div key={i} className="h-16 border-b flex items-center px-4 gap-4">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/6" />
              <Skeleton className="h-4 w-1/6" />
              <Skeleton className="h-4 w-1/12 ml-auto" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
