"use client";

import { useRouter } from "next/navigation";
import { VisaInformation, VisaInformationCategory } from "@/lib/api/visa";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InformationAccordion } from "./information-accordion";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface InformationDeskViewProps {
  information: VisaInformation[];
  canManage: boolean;
}

const CATEGORIES: VisaInformationCategory[] = [
  "Checklist",
  "Submission Info",
  "Embassy Details",
  "FAQ",
];

export function InformationDeskView({
  information,
  canManage,
}: InformationDeskViewProps) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Visa Information Desk
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Reference guides, checklists, and FAQs for visa processing.
          </p>
        </div>
        {canManage && (
          <Button onClick={() => router.push("/visa/information-desk/manage")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Information
          </Button>
        )}
      </div>

      <Tabs defaultValue="Checklist" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:w-[600px]">
          {CATEGORIES.map((category) => (
            <TabsTrigger key={category} value={category}>
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        {CATEGORIES.map((category) => {
          const filtered = information.filter((i) => i.category === category);
          return (
            <TabsContent key={category} value={category} className="mt-2 border border-border rounded-lg">
              <InformationAccordion
                items={filtered}
                canManage={canManage}
                onEdit={(item) =>
                  router.push(`/visa/information-desk/manage?id=${item.id}`)
                }
              />
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
