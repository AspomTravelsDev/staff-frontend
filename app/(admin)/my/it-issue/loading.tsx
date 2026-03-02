import { PageSkeleton } from "@/components/ui/page-skeleton";

export default function Loading() {
  return (
    <PageSkeleton showCards={false} showFilters={false} showTable={false} />
  );
}
