"use client";

import { useState } from "react";
import { TravelPurposeGenerator } from "@/components/visa/samples/travel-purpose-generator";
import { WorkDutiesGenerator } from "@/components/visa/samples/work-duties-generator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Briefcase, Globe2 } from "lucide-react";

export default function TravelInfoGeneratorPage() {
  const [activeTab, setActiveTab] = useState("purpose");

  return (
    <div className="w-full min-w-0 space-y-6">
      {/* PAGE HEADER */}
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <FileText className="size-6 text-primary" />
          Visa Info & Work Duties Generator
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generate concise purpose of travel statements and professional job duties tailored for visa applications, DS-160 forms, and employment letters.
        </p>
      </div>

      {/* GENERATOR WORKSPACE TABS */}
      <div className="max-w-4xl space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 h-10 max-w-md">
            <TabsTrigger value="purpose" className="text-xs font-bold gap-2">
              <Globe2 className="size-3.5 text-primary" /> Travel Purpose Generator
            </TabsTrigger>
            <TabsTrigger value="duties" className="text-xs font-bold gap-2">
              <Briefcase className="size-3.5 text-primary" /> Work Duties Generator
            </TabsTrigger>
          </TabsList>

          <TabsContent value="purpose" className="mt-4">
            <TravelPurposeGenerator />
          </TabsContent>

          <TabsContent value="duties" className="mt-4">
            <WorkDutiesGenerator />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
