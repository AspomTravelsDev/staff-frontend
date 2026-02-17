import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Circle, Clock } from "lucide-react";

interface TaskStatsProps {
    total: number;
    completed: number;
    ongoing: number;
}

export function TaskStats({ total, completed, ongoing }: TaskStatsProps) {
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
                <CardContent className="p-4 pt-4 flex flex-col justify-between h-full">
                   <div className="text-sm font-medium text-muted-foreground">Total Tasks</div>
                   <div className="flex items-center gap-2 mt-2">
                     <span className="text-2xl font-bold">{total}</span>
                   </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4 pt-4 flex flex-col justify-between h-full">
                   <div className="text-sm font-medium text-muted-foreground">Completed</div>
                   <div className="flex items-center gap-2 mt-2">
                     <CheckCircle2 className="h-5 w-5 text-green-500" />
                     <span className="text-2xl font-bold">{completed}</span>
                   </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4 pt-4 flex flex-col justify-between h-full">
                   <div className="text-sm font-medium text-muted-foreground">Ongoing</div>
                   <div className="flex items-center gap-2 mt-2">
                     <Circle className="h-5 w-5 text-orange-500" />
                     <span className="text-2xl font-bold">{ongoing}</span>
                   </div>
                </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4 pt-4 flex flex-col justify-between h-full">
                   <div className="text-sm font-medium text-primary">Completion Rate</div>
                   <div className="flex items-center gap-2 mt-2">
                     <Clock className="h-5 w-5 text-primary" />
                     <span className="text-2xl font-bold text-primary">{completionRate}%</span>
                   </div>
                </CardContent>
            </Card>
        </div>
    );
}
