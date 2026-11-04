"use client";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollText } from "lucide-react";
import { useFormContext } from "react-hook-form";
export function AssetUndertakingFields() {
  const form = useFormContext();
  return <>                {/* Asset Declaration Undertaking & Rules from Form PDF */}
                <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                    <ScrollText className="h-4 w-4 shrink-0 text-primary" />
                    <span>Asset Declaration Undertaking &amp; Rules</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    By accepting custody of this asset, you confirm you have inspected it and declare to abide by the company&apos;s asset undertaking regulations:
                  </p>

                  <ol className="space-y-2 text-xs text-muted-foreground list-none pl-0">
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-foreground shrink-0 w-4">1.</span>
                      <span>
                        <strong className="text-foreground">Official Purpose:</strong> The asset issue is solely for official purposes and will continue to remain ASPOM TRAVELS property.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-foreground shrink-0 w-4">2.</span>
                      <span>
                        <strong className="text-foreground">Financial Accountability:</strong> The employee will be fully accountable for theft, damage, or loss of the property and if such event occurs will be liable to pay equivalent amount or company retains right to deduct it from salary.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-foreground shrink-0 w-4">3.</span>
                      <span>
                        <strong className="text-foreground">Inspection &amp; Defect Notice:</strong> Employee has performed the necessary check before owning possession of this asset. In case of future malfunctioning, employee must inform the company by email to <strong className="text-foreground">hr@aspomtravels.com</strong> within 24 hours of the issue arising. Failure to do so will result in a daily penalty charge (Company’s Discretion) until asset is returned.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-foreground shrink-0 w-4">4.</span>
                      <span>
                        <strong className="text-foreground">Outside Repairs Prohibited:</strong> Unless permitted in writing, employee will not take asset for repair to any outside vendor.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-foreground shrink-0 w-4">5.</span>
                      <span>
                        <strong className="text-foreground">24-Hour Return Window:</strong> Staff have 24 hours to confirm gadget assigned and return filled asset form.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-foreground shrink-0 w-4">6.</span>
                      <span>
                        <strong className="text-foreground">Tenure Requirement:</strong> New staff not up to 1 month cannot take gadget except approval is given.
                      </span>
                    </li>
                  </ol>

                  <div className="pt-2 border-t border-border/60 text-[11px] text-muted-foreground bg-background/60 p-2.5 rounded">
                    <strong className="text-foreground">Exit / Final Paycheck Clause:</strong> In addition, you acknowledge that you will not receive your last paycheck unless you return the allotted assets. Should the final paycheck not cover expenses, ASPOM Travels retains the right to file for reimbursement through court proceedings.
                  </div>

                  <FormField
                    control={form.control}
                    name="agreedToTerms"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-xs font-medium cursor-pointer">
                            I have read, understood, and declare to abide by the terms and conditions laid above.
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
</>;
}
