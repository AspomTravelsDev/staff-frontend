"use client";

import { useState } from "react";
import {
  InventoryItem,
  InventoryStatus,
  InventoryConditionRating,
} from "@/lib/api/inventory";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Laptop,
  Smartphone,
  Monitor,
  Keyboard,
  AlertCircle,
  RefreshCw,
  ClipboardCheck,
  History,
} from "lucide-react";
import { format } from "date-fns";
import { UpdateAssetDialog } from "./update-asset-dialog";
// We can also reuse the history dialog from admin if we move it to a shared location,
// but for now let's keep it simple or just show current status.

interface MyAssetsListProps {
  initialAssets: InventoryItem[];
}

export function MyAssetsList({ initialAssets }: MyAssetsListProps) {
  const [assets, setAssets] = useState(initialAssets);
  const [selectedAsset, setSelectedAsset] = useState<InventoryItem | null>(
    null,
  );

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Laptop":
        return <Laptop className="h-5 w-5" />;
      case "Phone":
        return <Smartphone className="h-5 w-5" />;
      case "Gadget":
        return <Keyboard className="h-5 w-5" />;
      default:
        return <Monitor className="h-5 w-5" />;
    }
  };

  const getConditionColor = (rating: string) => {
    switch (rating) {
      case "Excellent":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "Good":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
      case "Fair":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "Poor":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
      case "Broken":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {assets.length === 0 ? (
        <Card className="col-span-full py-12 text-center bg-card/50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center">
            <div className="p-4 bg-muted rounded-full mb-4">
              <Laptop className="h-8 w-8 text-muted-foreground opacity-20" />
            </div>
            <h3 className="text-xl font-semibold">No devices assigned</h3>
            <p className="text-muted-foreground mt-2">
              You currently don't have any company equipment assigned to your
              profile.
            </p>
          </CardContent>
        </Card>
      ) : (
        assets.map((asset) => (
          <Card
            key={asset.id}
            className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow group"
          >
            <div
              className={`h-1.5 w-full ${asset.status === "Repairs" ? "bg-red-500" : "bg-primary"}`}
            />
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    {getCategoryIcon(asset.category)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{asset.name}</CardTitle>
                    <CardDescription className="font-mono text-[10px] mt-0.5">
                      S/N: {asset.serialNumber}
                    </CardDescription>
                  </div>
                </div>
                <Badge
                  variant={
                    asset.status === "Repairs" ? "destructive" : "secondary"
                  }
                  className="rounded-full px-3"
                >
                  {asset.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="py-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Current Condition
                  </span>
                  <Badge
                    className={`border-none ${getConditionColor(asset.conditionRating)}`}
                  >
                    {asset.conditionRating}
                  </Badge>
                </div>
                {asset.conditionDetails && (
                  <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded italic">
                    "{asset.conditionDetails}"
                  </p>
                )}
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <RefreshCw className="h-3 w-3" />
                  <span>
                    Last Updated:{" "}
                    {asset.updatedAt
                      ? format(new Date(asset.updatedAt), "PPP")
                      : "Unknown"}
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-6 grid grid-cols-1 gap-2">
              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
                onClick={() => setSelectedAsset(asset)}
              >
                <ClipboardCheck className="h-4 w-4" />
                Update Condition / Report Repair
              </Button>
            </CardFooter>
          </Card>
        ))
      )}

      <UpdateAssetDialog
        open={!!selectedAsset}
        onOpenChange={(open) => !open && setSelectedAsset(null)}
        asset={selectedAsset}
        onSuccess={(updatedAsset) => {
          // Simple local update for UX
          setAssets((prev) =>
            prev.map((a) =>
              a.id === updatedAsset.id ? { ...a, ...updatedAsset } : a,
            ),
          );
        }}
      />
    </div>
  );
}
