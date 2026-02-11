"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Info, Loader2, Save, Send } from "lucide-react";
import { useSubmitSelfAppraisal } from "@/lib/api/hooks/use-performance-appraisal";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { KRAScores } from "@/lib/api/performance-appraisal";
import { useUser } from "@/providers/user-provider";

const KRA_CONFIG = [
  {
    name: "quality",
    title: "Quality",
    indicators: [
      "Work is accurate and precise",
      "Error-free rating",
      "Displays thoroughness and completeness in work activity",
      "Takes proper care of equipment/keeps work area clean",
    ],
  },
  {
    name: "productivity",
    title: "Productivity",
    indicators: [
      "Meeting set targets",
      "Time utilization",
      "Commitment to performing responsibilities",
      "Problem solving",
      "Judgement and decision making",
      "Adaptability",
    ],
  },
  {
    name: "job_knowledge",
    title: "Job Knowledge",
    indicators: [
      "Able to follow verbal and/or written instructions",
      "Uses proper procedures",
      "Uses proper methods and tools",
      "Performs work without detailed instructions",
      "Shows improvement on repetitive tasks",
      "Able to train others (if applicable)",
      "Has practical/technical knowledge to perform job",
    ],
  },
  {
    name: "reliability",
    title: "Reliability",
    indicators: [
      "Begins and finishes on time",
      "Requires minimum supervision; completes tasks without prompting",
      "Completes tasks efficiently within required time frames",
      "Puts in extra time and effort",
      "Does the best according to ability and within minimum job standards",
    ],
  },
  {
    name: "attendance",
    title: "Attendance",
    indicators: [
      "At work on a daily basis",
      "Start and finishes according to approved schedule (punctual)",
      "Calls/Emails to explain absence",
      "Observes generally agreed work break/meal periods",
      "Availability/Punctuality to meetings and other Job related engagements",
    ],
  },
  {
    name: "initiative",
    title: "Initiative/Creativity",
    indicators: [
      "Seeks out new assignments when finished with own work",
      "Assumes additional responsibilities when needed",
      "Properly selects priorities",
      "Determines what must be done without being told",
      "Makes suggestions on better ways of getting work done",
      "Identifies and corrects errors during the work process",
    ],
  },
  {
    name: "teamwork",
    title: "Teamwork",
    indicators: [
      "Works well with supervisors, peers, and subordinates",
      "Sets an example with a positive and supportive attitude",
      "Communicates well with co-workers and supervisors",
      "Promotes teamwork in the work place",
    ],
  },
  {
    name: "policy_compliance",
    title: "Policy Compliance",
    indicators: [
      "Practices proper safety procedures",
      "Adheres to all company policies and regulations",
      "Taking to correction",
    ],
  },
  {
    name: "customer_service",
    title: "Customer Service",
    indicators: [
      "Establishes positive relations colleagues and customers",
      "Responsive and courteous to client inquiries",
      "Relationship with Clients from pre-sale to after sale",
    ],
  },
  {
    name: "communication",
    title: "Communication Skills",
    indicators: [
      "Active Listening",
      "Clarifying and Summarizing",
      "Being Clear and Succinct",
      "Providing Feedback",
      "Developing trust and rapport",
      "Being Empathetic",
    ],
  },
];

// Form schema
const formSchema = z.object({
  employee_name: z.string().min(1, "Name is required"),
  designation: z.string().min(1, "Designation is required"),
  department: z.string().min(1, "Department is required"),
  date_of_joining: z.string().min(1, "Date of joining is required"),
  appraisal_type: z.string().min(1, "Appraisal type is required"),
  period_start: z.string().min(1, "Period start is required"),
  period_end: z.string().min(1, "Period end is required"),
  // All KRA scores
  ...Object.fromEntries(
    KRA_CONFIG.map((kra) => [
      kra.name,
      z.array(z.coerce.number().min(1).max(5)).length(kra.indicators.length),
    ]),
  ),
  job_achievements: z
    .string()
    .min(10, "Please provide job achievements (minimum 10 characters)"),
  new_innovations: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function SelfAppraisalForm() {
  const router = useRouter();
  const user = useUser();
  const submitMutation = useSubmitSelfAppraisal();
  const [expandedKRAs, setExpandedKRAs] = useState<Record<string, boolean>>({});

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      employee_name: user?.user?.name,
      designation: user?.user?.is_supervisor ? "SUPERVISOR" : "TEAM MEMBER",
      department: user?.user?.role.toUpperCase(),
      appraisal_type: "",
      period_start: "",
      period_end: "",
      ...Object.fromEntries(
        KRA_CONFIG.map((kra) => [
          kra.name,
          Array(kra.indicators.length).fill(3),
        ]),
      ),
      job_achievements: "",
      new_innovations: "",
    },
  });

  const toggleKRA = (kraName: string) => {
    setExpandedKRAs((prev) => ({ ...prev, [kraName]: !prev[kraName] }));
  };

  const onSubmit = async (data: FormValues) => {
    try {
      const scores = Object.fromEntries(
        KRA_CONFIG.map((kra) => [
          kra.name,
          data[kra.name as keyof FormValues] as unknown as number[],
        ]),
      ) as unknown as KRAScores;

      await submitMutation.mutateAsync({
        ...data,
        self_scores: scores,
      });

      toast.success("Self-appraisal submitted successfully!");
      router.push("/my/performance");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to submit appraisal",
      );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Employee Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Employee Basic Information</CardTitle>
            <CardDescription>Your employment details</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="employee_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="designation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Designation</FormLabel>
                  <FormControl>
                    <Input {...field} disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <FormControl>
                    <Input {...field} disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="appraisal_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Appraisal Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="annual">Annual Review</SelectItem>
                      <SelectItem value="mid-year">Mid-Year Review</SelectItem>
                      <SelectItem value="probation">
                        Probation Review
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-2">
              <FormField
                control={form.control}
                name="period_start"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Period Start</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="period_end"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Period End</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Rating Criteria */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Performance Rating Criteria:</strong>
            <div className="mt-2 space-y-1 text-sm flex flex-col md:flex-row gap-2 items-center">
              <div>
                <Badge variant="default">5</Badge> Exceptional (&gt;90%)
              </div>
              <div>
                <Badge variant="default">4</Badge> Exceeded Expectations
                (81-90%)
              </div>
              <div>
                <Badge variant="secondary">3</Badge> Satisfactory (70-80%)
              </div>
              <div>
                <Badge variant="outline">2</Badge> Requires Improvement (50-69%)
              </div>
              <div>
                <Badge variant="destructive">1</Badge> Unsatisfactory (&lt;50%)
              </div>
            </div>
          </AlertDescription>
        </Alert>

        {/* KRA Sections */}
        {KRA_CONFIG.map((kra, index) => (
          <Card key={kra.name}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {index + 1}. {kra.title}
                  </CardTitle>
                  <CardDescription>
                    {kra.indicators.length} indicators
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => toggleKRA(kra.name)}
                >
                  {expandedKRAs[kra.name] ? "Collapse" : "Expand"}
                </Button>
              </div>
            </CardHeader>
            {expandedKRAs[kra.name] && (
              <CardContent className="space-y-4">
                {kra.indicators.map((indicator, indicatorIndex) => (
                  <FormField
                    key={indicatorIndex}
                    control={form.control}
                    name={`${kra.name}.${indicatorIndex}` as any}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">{indicator}</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={(value) =>
                              field.onChange(Number(value))
                            }
                            defaultValue={String(field.value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">5 - Exceptional</SelectItem>
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
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </CardContent>
            )}
          </Card>
        ))}

        {/* Achievements and Innovations */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="job_achievements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>List Job Achieved</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Describe your achievements during this period..."
                      rows={4}
                    />
                  </FormControl>
                  <FormDescription>
                    List your key achievements and contributions
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="new_innovations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Innovations</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Describe any innovations or improvements you've implemented..."
                      rows={4}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional: Share any new ideas or process improvements
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/my/performance")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitMutation.isPending}>
            {submitMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            <Send className="mr-2 h-4 w-4" />
            Submit Appraisal
          </Button>
        </div>
      </form>
    </Form>
  );
}
