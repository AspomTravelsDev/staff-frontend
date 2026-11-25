"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

export const EMPTY_GADGET_CHECKLIST = {
  screen: "",
  charger: "",
  buttons: "",
  battery: "",
  ports: "",
  cameraMic: "",
  overall: "",
};

const fields = [
  ["screen", "Screen & Display", "e.g. No scratches or N/A"],
  ["charger", "Charger & Cables", "e.g. Original included or N/A"],
  ["buttons", "Buttons & Keyboard", "e.g. All functional or N/A"],
  ["battery", "Battery & Charging", "e.g. Holds charge (90%+) or N/A"],
  ["ports", "Ports & Connectivity", "e.g. USB/Wi-Fi working or N/A"],
  ["cameraMic", "Camera, Mic & Speaker", "e.g. Tested fine or N/A"],
  ["overall", "Overall Body & Casing", "e.g. Minor scuff on corner or N/A"],
] as const;

export function GadgetChecklistFields({
  name,
  title,
  description,
}: {
  name: "defaultChecklist" | "adminChecklist" | "staffChecklist" | "checklist";
  title: string;
  description: string;
}) {
  const { control } = useFormContext<any>();

  return (
    <section className="space-y-4 rounded-md border bg-muted/20 p-4">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {fields.map(([key, label, placeholder]) => (
          <FormField
            key={key}
            control={control}
            name={`${name}.${key}`}
            render={({ field }) => (
              <FormItem className={key === "overall" ? "sm:col-span-2" : undefined}>
                <FormLabel className="text-xs">{label}</FormLabel>
                <FormControl>
                  <Input placeholder={placeholder} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
      </div>
    </section>
  );
}
