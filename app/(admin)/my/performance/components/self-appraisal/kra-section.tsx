"use client";

import { useFormContext } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { KRA_CONFIG } from "./schema";

interface KRASectionProps {
  expandedKRAs: Record<string, boolean>;
  onToggle: (kraName: string) => void;
}

export function KRASection({ expandedKRAs, onToggle }: KRASectionProps) {
  const { control } = useFormContext();

  return (
    <div className="space-y-4">
      {KRA_CONFIG.map((kra, index) => (
        <Card key={kra.name} className="overflow-hidden">
          <CardHeader className="bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <div
                className="cursor-pointer flex-1"
                onClick={() => onToggle(kra.name)}
              >
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                    {index + 1}
                  </span>
                  {kra.title}
                </CardTitle>
                <CardDescription className="mt-1 ml-8">
                  {kra.indicators.length} indicators
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onToggle(kra.name)}
              >
                {expandedKRAs[kra.name] ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          <div
            className={`transition-all duration-200 ease-in-out ${
              expandedKRAs[kra.name]
                ? "max-h-[2000px] opacity-100"
                : "max-h-0 opacity-0"
            }`}
          >
            <CardContent className="pt-4 pb-6 space-y-6">
              {kra.indicators.map((indicator, indicatorIndex) => (
                <FormField
                  key={indicatorIndex}
                  control={control}
                  name={`${kra.name}.${indicatorIndex}`}
                  render={({ field }) => (
                    <FormItem className="border-b pb-4 last:border-0 last:pb-0">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <FormLabel className="text-sm font-normal flex-1 leading-relaxed mt-2">
                          {indicator}
                        </FormLabel>
                        <FormControl>
                          <div className="w-full md:w-[200px] shrink-0">
                            <Select
                              onValueChange={(value) =>
                                field.onChange(Number(value))
                              }
                              value={String(field.value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="5">
                                  5 - Exceptional
                                </SelectItem>
                                <SelectItem value="4">
                                  4 - Exceeded Expectations
                                </SelectItem>
                                <SelectItem value="3">
                                  3 - Satisfactory
                                </SelectItem>
                                <SelectItem value="2">
                                  2 - Requires Improvement
                                </SelectItem>
                                <SelectItem value="1">
                                  1 - Unsatisfactory
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </CardContent>
          </div>
        </Card>
      ))}
    </div>
  );
}
