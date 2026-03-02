import { PageSkeleton } from "@/components/ui/page-skeleton";

export default function Loading() {
  return <PageSkeleton showCards={true} cardCount={4} filterCount={1} />;
}
