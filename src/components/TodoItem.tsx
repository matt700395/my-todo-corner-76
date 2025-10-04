import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TodoItemProps {
  id: string;
  title: string;
  completed: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export const TodoItem = ({ id, title, completed, onToggle, onDelete }: TodoItemProps) => {
  return (
    <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
      <Checkbox checked={completed} onCheckedChange={() => onToggle(id)} />
      <span className={cn("flex-1", completed && "line-through text-muted-foreground")}>
        {title}
      </span>
      <Button variant="ghost" size="icon" onClick={() => onDelete(id)}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
};
