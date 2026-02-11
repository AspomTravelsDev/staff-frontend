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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import type { FormValues } from "./schema";

export function AchievementsSection() {
  const { control } = useFormContext<FormValues>();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Additional Information</CardTitle>
        <CardDescription>
          Share your key achievements and contributions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <FormField
          control={control}
          name="job_achievements"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job Achievements</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Describe your achievements during this period (minimum 10 characters)..."
                  rows={4}
                  className="resize-y"
                />
              </FormControl>
              <FormDescription>
                List your major accomplishments, projects completed, and value
                added.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="new_innovations"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Innovations & Improvements</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Describe any innovations or improvements you've implemented..."
                  rows={4}
                  className="resize-y"
                />
              </FormControl>
              <FormDescription>
                Optional: Share any new ideas, process improvements, or creative
                solutions.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
