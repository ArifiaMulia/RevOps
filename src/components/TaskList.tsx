// @ts-nocheck
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { taskService, type Task } from "@/lib/task-service";
import { toast } from "sonner";
import { Plus, Trash2, Calendar, User } from "lucide-react";

const taskSchema = z.object({
  title: z.string().min(2, "Title required"),
  assignee: z.string().min(2, "Assignee required"),
  status: z.enum(["Todo", "In Progress", "Done"]),
  priority: z.enum(["Low", "Medium", "High"]),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format: YYYY-MM-DD"),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface TaskListProps {
  projectId: string;
}

export function TaskList({ projectId }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const loadTasks = () => {
    setTasks(taskService.getByProject(projectId));
  };

  useEffect(() => {
    loadTasks();
  }, [projectId]);

  const handleCreate = (values: TaskFormValues) => {
    taskService.create({ ...values, projectId });
    loadTasks();
    setIsFormOpen(false);
    toast.success("Task created");
  };

  const handleStatusChange = (task: Task, checked: boolean) => {
    taskService.update(task.id, { status: checked ? "Done" : "Todo" });
    loadTasks();
  };

  const handleDelete = (id: string) => {
    taskService.delete(id);
    loadTasks();
    toast.success("Task deleted");
  };

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: { title: "", assignee: "", status: "Todo", priority: "Medium", dueDate: new Date().toISOString().split('T')[0] }
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Project Tasks</h3>
        <Button size="sm" onClick={() => { form.reset(); setIsFormOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Add Task
        </Button>
      </div>

      <div className="space-y-2">
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No tasks yet.</p>
        ) : (
          tasks.map(task => (
            <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
              <div className="flex items-center gap-3">
                <Checkbox 
                  checked={task.status === "Done"} 
                  onCheckedChange={(checked) => handleStatusChange(task, checked as boolean)}
                />
                <div className={task.status === "Done" ? "line-through text-muted-foreground" : ""}>
                  <p className="font-medium text-sm">{task.title}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> {task.assignee}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {task.dueDate}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={task.priority === "High" ? "destructive" : "outline"}>{task.priority}</Badge>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(task.id)}>
                  <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Task</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="assignee" render={({ field }) => (
                  <FormItem><FormLabel>Assignee</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="priority" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="dueDate" render={({ field }) => (
                <FormItem><FormLabel>Due Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter><Button type="submit">Create Task</Button></DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
