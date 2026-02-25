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
import {
  Edit,
  Trash2,
  MapPin,
  Clock,
  Loader2,
  Info,
  CheckCircle2,
} from "lucide-react";
import { deleteVisaInformationAction } from "../actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

// --- Render Content ---
function renderContent(content: string) {
  try {
    const parsed = JSON.parse(content);

    // Checklist Layout
    if (parsed.type === "checklist" && Array.isArray(parsed.items)) {
      return (
        <ul className="space-y-2 mt-2">
          {parsed.items.map((item: string, i: number) => (
            <li
              key={i}
              className="flex gap-3 items-start text-sm bg-muted/20 p-3 rounded-lg border border-border/50"
            >
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
              <span className="text-foreground leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      );
    }

    // FAQ Layout
    if (parsed.type === "faq" && Array.isArray(parsed.faqs)) {
      return (
        <div className=" text-foreground w-full">
          <div className="border border-border/80 rounded-xl overflow-hidden bg-card/50">
            <Accordion type="single" className="w-full">
              {parsed.faqs.map((faq: FAQItem, i: number) => (
                <AccordionItem
                  key={`faq-${i}`}
                  value={`faq-${i}`}
                  className="border-b border-border last:border-0 bg-transparent data-[state=open]:bg-muted/10 transition-colors"
                  style={{ overflow: "visible" }}
                >
                  <AccordionTrigger className="flex flex-row text-sm font-medium hover:no-underline px-5 py-4 text-left w-full">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="px-5 pb-5 overflow-visible">
                    <div
                      className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground prose-p:leading-relaxed mt-2"
                      dangerouslySetInnerHTML={{ __html: faq.answer }}
                    />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
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
                    <p className="text-muted-foreground text-sm items-center gap-2.5 bg-muted/40 p-2 rounded-lg font-medium self-start inline-flex">
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
          className="rounded-xl px-2 transition-all outline-none"
        >
          <div className="flex w-full items-center justify-between gap-4">
            <AccordionTrigger className="hover:no-underline py-4 flex-1 w-full text-left [&[data-state=closed]>svg]:opacity-50">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-base text-foreground">
                  {item.title}
                </span>
                {item.country && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-md uppercase tracking-wide">
                    {item.country}
                  </span>
                )}
              </div>
            </AccordionTrigger>

            {canManage && (
              <div className="flex items-center gap-1.5 shrink-0 -ml-2 z-10">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground bg-background shadow-none"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onEdit(item);
                  }}
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-destructive hover:text-destructive-foreground shadow-none"
                      disabled={deletingId === item.id}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      {deletingId === item.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you absolutely sure?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        delete the Information Desk entry for "{item.title}".
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        variant="destructive"
                        onClick={() => handleDelete(item.id)}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>

          <AccordionContent className="text-muted-foreground pb-4 pt-3">
            {renderContent(item.content)}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
