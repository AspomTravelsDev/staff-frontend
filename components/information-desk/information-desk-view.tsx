"use client";

import { useRouter } from "next/navigation";
import { informationCategoryLabel, informationDesk, type InformationDeskKind, type InformationEntry } from "@/lib/information-desk";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InformationAccordion } from "./information-accordion";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface InformationDeskViewProps {
  information: InformationEntry[];
  desk?: InformationDeskKind;
  canManage: boolean;
}

export function InformationDeskView({
  information,
  canManage,
  desk = "visa",
}: InformationDeskViewProps) {
  const router = useRouter();
  const config = informationDesk(desk);
  const categories = config.categories;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {config.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {config.description}
          </p>
        </div>
        {canManage && (
          <Button onClick={() => router.push(`${config.basePath}/manage`)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Information
          </Button>
        )}
      </div>

      <Tabs defaultValue={categories[0]} className="w-full">
        <TabsList style={{ height: "auto" }} className={`grid w-full grid-cols-2 ${desk === "visa" ? "md:grid-cols-4 lg:w-[600px]" : "sm:w-[320px]"}`}>
          {categories.map((category) => (
            <TabsTrigger key={category} value={category} className="h-8">
              {informationCategoryLabel(desk, category)}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => {
          const filtered = information.filter((i) => i.category === category);
          return (
            <TabsContent key={category} value={category} className="mt-2 border border-border rounded-lg">
              <InformationAccordion
                desk={desk}
                items={filtered}
                canManage={canManage}
                onEdit={(item) =>
                  router.push(`${config.basePath}/manage?id=${encodeURIComponent(item.id)}`)
                }
              />
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
