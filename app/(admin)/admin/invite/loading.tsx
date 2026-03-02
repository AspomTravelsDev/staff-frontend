import { PageSkeleton } from "@/components/ui/page-skeleton";

export default function Loading() {
  return (
    <PageSkeleton
      showCards={true}
      cardCount={2}
      showFilters={false}
      rowCount={3}
    />
  );
}
