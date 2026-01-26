import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MoveLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center text-center">
      <div className="space-y-4">
        <h1 className="text-8xl font-bold tracking-tighter text-primary/20">
          404
        </h1>
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold tracking-tight">
            Page not found
          </h2>
          <p className="text-muted-foreground max-w-[500px]">
            Sorry, we couldn't find the page you're looking for. It might have
            been removed, renamed, or doesn't exist.
          </p>
        </div>
      </div>
      <div className="mt-8 flex items-center justify-center gap-4">
        <Button asChild variant="default" size="lg">
          <Link href="/">
            <MoveLeft className="mr-2 h-4 w-4" />
            Go back home
          </Link>
        </Button>
      </div>
    </div>
  );
}
