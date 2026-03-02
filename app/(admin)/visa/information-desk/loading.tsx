import { PageSkeleton } from "@/components/ui/page-skeleton";

export default function Loading() {
  return (
    <PageSkeleton
      showCards={false}
      filterCount={1}
      showTable={false}
      rowCount={0}
    />
  );
}
