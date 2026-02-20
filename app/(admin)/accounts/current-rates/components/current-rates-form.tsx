"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect } from "react";
import { Coins, Loader2, Lock } from "lucide-react";

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
import { useUser } from "@/providers/user-provider";
import { USER_ROLES } from "@/types/user-types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formSchema = z.object({
  internal_rate: z.coerce
    .number()
    .min(1, "Internal rate must be greater than 0"),
  billing_rate: z.coerce.number().min(1, "Billing rate must be greater than 0"),
});

export function CurrentRatesForm() {
  const { user } = useUser();
  const { data: rates, isLoading } = useRates();
  const updateRates = useUpdateRates();

  const canEdit =
    user?.role === USER_ROLES.SUPER_ADMIN ||
    user?.role === USER_ROLES.ACCOUNT_OFFICER;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      internal_rate: 0,
      billing_rate: 0,
    },
  });

  useEffect(() => {
    if (rates) {
      form.reset({
        internal_rate: rates.internal_rate,
        billing_rate: rates.billing_rate,
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
          <Skeleton className="h-8 w-50 mb-2" />
          <Skeleton className="h-4 w-75" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-25" />
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
        {!canEdit && (
          <Alert className="mb-6 bg-muted/50">
            <Lock className="h-4 w-4" />
            <AlertTitle>Read Only</AlertTitle>
            <AlertDescription>
              Only Super Admin and Accounts Officers can update exchange rates.
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="internal_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Internal Rate (₦)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0.00"
                        {...field}
                        disabled={updateRates.isPending || !canEdit}
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
                name="billing_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billing Rate (₦)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0.00"
                        {...field}
                        disabled={updateRates.isPending || !canEdit}
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
              {canEdit && (
                <Button type="submit" disabled={updateRates.isPending}>
                  {updateRates.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Changes
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
