import { renderDataPage } from "@/lib/api/render-data-page";
import { getITGuides } from "@/lib/api/it-guides";
import { ExternalLink, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ITDeskManager } from "./components/it-desk-manager";

export default async function ITDeskManagementPage() {
  return renderDataPage(async () => {
    const { items: guides } = await getITGuides({ limit: 100 });

    return (
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Manage IT Information Desk
            </h1>
            <p className="text-muted-foreground mt-1">
              Create, preview, and manage portal guides and IT documentation for all staff.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" className="h-11" asChild>
              <Link href="/my/it">
                <ExternalLink className="mr-2 h-4 w-4" />
                View Staff IT Desk
              </Link>
            </Button>
            <Button className="h-11 px-6 shadow-sm" asChild>
              <Link href="/admin/it-desk/create">
                <Plus className="mr-2 h-4 w-4" />
                Create New Guide
              </Link>
            </Button>
          </div>
        </div>

        <ITDeskManager initialGuides={guides} />
      </div>
    );
  }, "Unable to load IT guides");
}
