import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { TaskItem as TaskItemType } from "@/types/task-types";
import { cn } from "@/lib/utils";

interface TaskItemProps {
  task: TaskItemType;
  index: number;
  onUpdate: (index: number, updates: Partial<TaskItemType>) => void;
  onRemove: (index: number) => void;
  disabled?: boolean;
}

export function TaskItem({
  task,
  index,
  onUpdate,
  onRemove,
  disabled = false,
}: TaskItemProps) {
  return (
    <div className={cn(
        "flex items-center gap-3 p-3 rounded-lg border bg-card transition-colors",
        task.completed && "bg-muted/50 border-muted"
    )}>
      <Checkbox
        checked={task.completed}
        onCheckedChange={(checked) => {
            const isCompleted = checked === true;
            onUpdate(index, { 
                completed: isCompleted,
                completed_at: isCompleted ? new Date().toISOString() : null
            });
        }}
        disabled={disabled}
        className="h-5 w-5"
      />
      
      <Input
        value={task.text}
        onChange={(e) => onUpdate(index, { text: e.target.value })}
        placeholder="Describe your task..."
        className={cn(
            "border-none shadow-none bg-transparent focus-visible:ring-0 p-0 h-auto text-base",
            task.completed && "line-through text-muted-foreground"
        )}
        disabled={disabled}
      />

      {!disabled && (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(index)}
            className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
        >
            <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
