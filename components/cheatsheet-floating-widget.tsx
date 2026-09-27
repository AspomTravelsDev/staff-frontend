"use client";

import { useState } from "react";
import { Lightbulb, Loader2, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getRandomCheatsheetItems, markCheatsheetItemViewed } from "@/lib/api/cheatsheet";
import type { CheatsheetItem } from "@/types/cheatsheet-types";
import { toast } from "sonner";

export function CheatsheetFloatingWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [item, setItem] = useState<CheatsheetItem | null>(null);
  const [loading, setLoading] = useState(false);

  const handleOpen = async () => {
    if (isOpen) {
      setIsOpen(false);
      return; 
    }

    setIsOpen(true);
    await fetchRandomItem();
  };

  const fetchRandomItem = async () => {
    setLoading(true);
    setItem(null);
    try {
      const items = await getRandomCheatsheetItems(1);
      if (items && items.length > 0) {
        setItem(items[0]);
        // Silently register the view on the backend
        markCheatsheetItemViewed(items[0].id).catch(() => {});
      } else {
        setItem(null);
      }
    } catch (error) {
      toast.error("Failed to load cheatsheet information");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <Card className="mb-3 w-80 sm:w-96 shadow-2xl border border-muted bg-card/95 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary animate-pulse" />
              <CardTitle className="text-sm font-bold">Quick Product Tip</CardTitle>
            </div>
            <div className="flex items-center gap-1">
              {item && (
                <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                  {item.category || "General"}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 py-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : item ? (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-foreground">{item.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.content}</p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No cheatsheet tips available yet.
              </p>
            )}
          </CardContent>
          {item && (
            <CardFooter className="pt-2 flex justify-between gap-2 border-t mt-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-8 text-muted-foreground hover:text-foreground font-semibold flex items-center gap-1.5"
                onClick={fetchRandomItem}
                disabled={loading}
              >
                <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                Next Tip
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8 font-semibold"
                onClick={() => setIsOpen(false)}
              >
                Dismiss
              </Button>
            </CardFooter>
          )}
        </Card>
      )}

      <Button
        variant="default"
        onClick={handleOpen}
        className="h-14 rounded-full px-6 flex items-center gap-2.5 shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/20 active:scale-95 text-sm font-semibold"
      >
        <Lightbulb className="h-5 w-5" />
        <span>Tips</span>
      </Button>
    </div>
  );
}
