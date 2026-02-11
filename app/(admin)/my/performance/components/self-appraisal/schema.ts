import * as z from "zod";

export const KRA_CONFIG = [
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
export const formSchema = z.object({
    employee_name: z.string().min(1, "Name is required"),
    designation: z.string().min(1, "Designation is required"),
    department: z.string().min(1, "Department is required"),
    // date_of_joining: z.string().min(1, "Date of joining is required"), // Removed as requested
    appraisal_type: z.string().min(1, "Appraisal type is required"),
    period_start: z.string().min(1, "Period start is required"),
    period_end: z.string().min(1, "Period end is required"),
    // All KRA scores
    ...Object.fromEntries(
        KRA_CONFIG.map((kra) => [
            kra.name,
            z.array(z.coerce.number().min(1).max(5)).length(kra.indicators.length),
        ])
    ),
    job_achievements: z
        .string()
        .min(10, "Please provide job achievements (minimum 10 characters)"),
    new_innovations: z.string().optional(),
});

export type FormValues = z.infer<typeof formSchema>;
