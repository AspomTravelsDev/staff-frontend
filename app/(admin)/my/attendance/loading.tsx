import { PageSkeleton } from "@/components/ui/page-skeleton";

export default function Loading() {
  return (
    <PageSkeleton
      showCards={true}
      cardCount={3}
      showFilters={false}
      rowCount={10}
    />
  );
}
