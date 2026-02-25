"use client";

import { useState } from "react";
import { VisaInformation } from "@/lib/api/visa";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Trash2, MapPin, Clock, Loader2, Info } from "lucide-react";
import { deleteVisaInformationAction } from "../actions";

interface Props {
  items: VisaInformation[];
  canManage: boolean;
  onEdit: (item: VisaInformation) => void;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface LocationItem {
  name: string;
  address: string;
  timings: string;
}

// --- Interactive Checklist Component ---
function InteractiveChecklist({ items }: { items: string[] }) {
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const toggle = (index: number) => {
    const next = new Set(checked);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setChecked(next);
  };

  return (
    <div className="space-y-3 mt-2">
      {items.map((item, i) => {
        const isChecked = checked.has(i);
        return (
          <div
            key={i}
            className={`flex items-start gap-4 p-4 border rounded-xl transition-all cursor-pointer ${
              isChecked
                ? "bg-muted/40 border-muted opacity-80"
                : "bg-card hover:border-primary/40 hover:bg-card/80 border-border"
            }`}
            onClick={() => toggle(i)}
          >
            <Checkbox
              checked={isChecked}
              onCheckedChange={() => toggle(i)}
              className="mt-0.5 shrink-0"
            />
            <span
              className={`text-sm leading-relaxed select-none transition-colors ${
                isChecked
                  ? "text-muted-foreground line-through"
                  : "text-foreground font-medium"
              }`}
            >
              {item}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// --- Render Content ---
function renderContent(content: string) {
  try {
    const parsed = JSON.parse(content);

    // Checklist Layout
    if (parsed.type === "checklist" && Array.isArray(parsed.items)) {
      return <InteractiveChecklist items={parsed.items} />;
    }

    // FAQ Layout
    if (parsed.type === "faq" && Array.isArray(parsed.faqs)) {
      return (
        <div className="space-y-4 mt-2">
          {parsed.faqs.map((faq: FAQItem, i: number) => (
            <div
              key={i}
              className="p-5 rounded-xl bg-card border border-border shadow-sm space-y-3"
            >
              <h4 className="flex gap-2 items-start text-sm font-semibold text-foreground">
                <span className="text-primary mt-0.5 shrink-0">Q.</span>
                <span>{faq.question}</span>
              </h4>
              <div className="block h-px w-full bg-border/40 my-2" />
              <div className="flex gap-2 items-start text-sm text-muted-foreground">
                <span className="text-muted-foreground/60 mt-0.5 shrink-0 font-medium select-none">
                  A.
                </span>
                <div
                  className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: faq.answer }}
                />
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Locations Layout
    if (parsed.type === "locations" && Array.isArray(parsed.locations)) {
      return (
        <div className="space-y-6 mt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {parsed.locations.map((loc: LocationItem, i: number) => (
              <div
                key={i}
                className="p-5 border border-border/70 rounded-2xl bg-card hover:shadow-md transition-all space-y-4 relative overflow-hidden group"
              >
                {/* Decorative background shape */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />

                <h4 className="font-semibold text-base text-foreground flex items-center gap-2.5 relative z-10">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  {loc.name}
                </h4>

                <div className="space-y-2.5 relative z-10">
                  {loc.address && (
                    <p className="text-muted-foreground text-sm flex items-start gap-2.5">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                      <span className="leading-relaxed">{loc.address}</span>
                    </p>
                  )}
                  {loc.timings && (
                    <p className="text-muted-foreground text-sm flex items-center gap-2.5 bg-muted/40 p-2 rounded-lg font-medium self-start inline-flex">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      {loc.timings}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {parsed.notes && (
            <div className="p-5 border rounded-xl bg-primary/5 border-primary/10">
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3 flex items-center gap-1.5">
                <Info className="h-4 w-4" /> Additional Details
              </p>
              <div
                className="prose prose-sm dark:prose-invert max-w-none text-foreground/80"
                dangerouslySetInnerHTML={{ __html: parsed.notes }}
              />
            </div>
          )}
        </div>
      );
    }
  } catch {
    // not JSON, fall through
  }
  return <p className="text-sm whitespace-pre-wrap mt-2">{content}</p>;
}

export function InformationAccordion({ items, canManage, onEdit }: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed rounded-xl bg-muted/20">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <Info className="h-6 w-6 text-muted-foreground/60" />
        </div>
        <p className="font-medium text-foreground mb-1">No information found</p>
        <p className="text-sm text-muted-foreground max-w-sm">
          There is no information available in this category at the moment.
        </p>
      </div>
    );
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;
    setDeletingId(id);
    await deleteVisaInformationAction(id);
    setDeletingId(null);
  };

  return (
    <Accordion type="single" collapsible className="w-full space-y-4">
      {items.map((item) => (
        <AccordionItem
          key={item.id}
          value={item.id}
          className="border border-border/60 shadow-sm rounded-xl bg-card px-5 transition-all hover:border-border data-[state=open]:border-primary/20 data-[state=open]:shadow-md overflow-hidden"
        >
          <div className="flex items-center w-full gap-3">
            <AccordionTrigger className="hover:no-underline py-5 flex-1 min-w-0">
              <div className="flex flex-col items-start gap-1.5 text-left min-w-0">
                <span className="font-semibold text-base truncate text-foreground">
                  {item.title}
                </span>
                {item.country && (
                  <span className="text-xs font-medium px-2.5 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-full shrink-0">
                    {item.country}
                  </span>
                )}
              </div>
            </AccordionTrigger>

            {canManage && (
              <div className="flex items-center gap-1.5 shrink-0 bg-muted/30 p-1.5 rounded-lg border">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground bg-background shadow-sm border border-border/50"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(item);
                  }}
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  disabled={deletingId === item.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(item.id);
                  }}
                >
                  {deletingId === item.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            )}
          </div>

          <AccordionContent className="text-muted-foreground pb-6 border-t pt-5">
            {renderContent(item.content)}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
