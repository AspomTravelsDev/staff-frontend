"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect } from "react";
import { Coins, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRates, useUpdateRates } from "@/lib/api/hooks/use-rates";
import { Skeleton } from "@/components/ui/skeleton";

const formSchema = z.object({
  internalRate: z.coerce
    .number()
    .min(1, "Internal rate must be greater than 0"),
  billingRate: z.coerce.number().min(1, "Billing rate must be greater than 0"),
});

export function CurrentRatesForm() {
  const { data: rates, isLoading } = useRates();
  const updateRates = useUpdateRates();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      internalRate: 0,
      billingRate: 0,
    },
  });

  useEffect(() => {
    if (rates) {
      form.reset({
        internalRate: rates.internalRate,
        billingRate: rates.billingRate,
      });
    }
  }, [rates, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    updateRates.mutate(values);
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-[200px] mb-2" />
          <Skeleton className="h-4 w-[300px]" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-[100px]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5" />
          Manage Exchange Rates
        </CardTitle>
        <CardDescription>
          Update the current exchange rates for internal calculations and
          billing.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="internalRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Internal Rate (₦)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0.00"
                        {...field}
                        disabled={updateRates.isPending}
                      />
                    </FormControl>
                    <FormDescription>
                      The base rate used for internal company calculations.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="billingRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billing Rate (₦)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0.00"
                        {...field}
                        disabled={updateRates.isPending}
                      />
                    </FormControl>
                    <FormDescription>
                      The rate charged to clients for billing purposes.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={updateRates.isPending}>
                {updateRates.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
