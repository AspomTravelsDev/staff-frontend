import { WorkFromHomeContent } from "./work-from-home-content";

export const dynamic = "force-dynamic";

export default async function WorkFromHomePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <WorkFromHomeContent searchParams={searchParams} />;
}
