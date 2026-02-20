"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
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
import { useUser } from "@/providers/user-provider";
import { USER_ROLES } from "@/types/user-types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { updateRatesAction } from "../actions";
import { toast } from "sonner";
import type { Rates } from "@/lib/api/rates";

const formSchema = z.object({
  internal_rate: z.coerce
    .number()
    .min(1, "Internal rate must be greater than 0"),
  billing_rate: z.coerce.number().min(1, "Billing rate must be greater than 0"),
});

interface CurrentRatesFormProps {
  initialRates: Rates;
}

export function CurrentRatesForm({ initialRates }: CurrentRatesFormProps) {
  const { user } = useUser();
  const [isPending, setIsPending] = useState(false);

  const canEdit =
    user?.role === USER_ROLES.SUPER_ADMIN ||
    user?.role === USER_ROLES.ACCOUNT_OFFICER;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      internal_rate: initialRates.internal_rate,
      billing_rate: initialRates.billing_rate,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsPending(true);
    try {
      const result = await updateRatesAction(values);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Rates updated successfully");
      }
    } finally {
      setIsPending(false);
    }
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
                        disabled={isPending || !canEdit}
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
                        disabled={isPending || !canEdit}
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
                <Button type="submit" disabled={isPending}>
                  {isPending && (
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
