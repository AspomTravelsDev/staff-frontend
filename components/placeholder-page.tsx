import { Button } from "@/components/ui/button";
import { Construction } from "lucide-react";
import Link from "next/link";

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="flex flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">{title}</h1>
      </div>
      <div
        className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm"
        style={{ minHeight: "500px" }}
      >
        <div className="flex flex-col items-center gap-2 text-center max-w-[500px] p-4">
          <div className="rounded-full bg-muted p-4 mb-2">
            <Construction className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-2xl font-bold tracking-tight">Coming Soon</h3>
          <p className="text-sm text-muted-foreground">
            {description ||
              "This module is currently under active development. We're working hard to bring this feature to you."}
          </p>
          <div className="mt-4">
            <Link href="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
