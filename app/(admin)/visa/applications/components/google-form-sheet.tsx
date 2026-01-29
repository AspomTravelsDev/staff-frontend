"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { IconCopy, IconCheck, IconExternalLink } from "@tabler/icons-react";

interface GoogleFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FORM_LINKS = {
  canada:
    "https://docs.google.com/forms/d/e/1FAIpQLSfa3dpui9DTxdzDWDnWDdkANpv2WzETZUcn85hJ-Y4hhjsVwg/viewform",
  uk: "https://docs.google.com/forms/d/e/1FAIpQLSfgqKCeKCJ84tKNOSdijgFj1P1OUzaHjqEHj5Kb-ysrqJy-Ng/viewform",
  schengen:
    "https://docs.google.com/forms/d/e/1FAIpQLSerWkvqDZ4eDUoIcvyM7yeXf7URp-v9ZBXEydA_j7DamSuKNg/viewform",
};

export function GoogleFormSheet({ open, onOpenChange }: GoogleFormSheetProps) {
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!selectedCountry) return;
    const url = FORM_LINKS[selectedCountry as keyof typeof FORM_LINKS];
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentLink = selectedCountry
    ? FORM_LINKS[selectedCountry as keyof typeof FORM_LINKS]
    : "";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="p-4">
        <SheetHeader>
          <SheetTitle>New Visa Application</SheetTitle>
          <SheetDescription>
            Select a destination to generate the client intake form link.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-6 py-6">
          <div className="space-y-2">
            <Label>Destination Country</Label>
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select destination..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="canada">Canada</SelectItem>
                <SelectItem value="uk">United Kingdom</SelectItem>
                <SelectItem value="schengen">Schengen Area</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedCountry && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="rounded-lg border p-4 bg-muted/50">
                <Label className="mb-2 block">Client Form Link</Label>
                <div className="flex flex-col gap-3">
                  <Input
                    value={currentLink}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={handleCopy}>
                      {copied ? (
                        <>
                          <IconCheck className="mr-2 h-4 w-4" />
                          Copied
                        </>
                      ) : (
                        <>
                          <IconCopy className="mr-2 h-4 w-4" />
                          Copy Link
                        </>
                      )}
                    </Button>
                    <Button variant="outline" size="icon" asChild>
                      <a
                        href={currentLink}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <IconExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Copy this link and send it to the client via email or WhatsApp.
                They will fill out their details directly on the Google Form.
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
