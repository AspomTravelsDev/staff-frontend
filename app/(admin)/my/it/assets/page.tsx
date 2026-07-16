import { getMyInventory } from "@/lib/api/inventory";
import { MyAssetsList } from "./components/my-assets-list";
import { Laptop, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function MyAssetsPage() {
  const assets = await getMyInventory();

  return (
    <div className="flex flex-col min-h-screen bg-muted/30 p-4 md:p-8">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/my/it">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                My Assigned Devices
              </h1>
              <p className="text-muted-foreground">
                View and manage the equipment assigned to you.
              </p>
            </div>
          </div>
          <div className="p-3 bg-primary/10 rounded-2xl text-primary">
            <Laptop className="h-6 w-6" />
          </div>
        </div>

        <MyAssetsList initialAssets={assets} />
      </div>
    </div>
  );
}
