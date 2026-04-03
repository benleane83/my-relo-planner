import { useState, useEffect } from 'react';
import type { Task } from '@/types';
import { useCreateTask, useUpdateTask } from '@/hooks/useApi';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null; // null = create mode
  categories: string[];
}

const emptyForm = {
  title: '',
  category: '',
  milestone: '',
  status: 'todo' as Task['status'],
  priority: 'medium' as Task['priority'],
  dueDate: '',
  notes: '',
};

export default function TaskDialog({ open, onOpenChange, task, categories }: TaskDialogProps) {
  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask();
  const mutation = task ? updateMutation : createMutation;

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (open) {
      setForm(task ? {
        title: task.title,
        category: task.category,
        milestone: task.milestone ?? '',
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        notes: task.notes,
      } : emptyForm);
    }
  }, [open, task]);

  const handleSave = () => {
    const payload = { ...form, milestone: form.milestone || undefined };
    if (task) {
      updateMutation.mutate({ id: task.id, ...payload }, { onSuccess: () => onOpenChange(false) });
    } else {
      createMutation.mutate(payload as Omit<Task, 'id'>, { onSuccess: () => onOpenChange(false) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'New Task'}</DialogTitle>
          <DialogDescription>{task ? 'Update task details.' : 'Add a new task.'}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-title">Title</Label>
            <Input id="task-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="task-category">Category</Label>
              <Input id="task-category" list="task-categories" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              <datalist id="task-categories">
                {categories.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="task-due">Due Date</Label>
              <Input id="task-due" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Task['status'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">Todo</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as Task['priority'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-milestone">Milestone (optional)</Label>
            <Input id="task-milestone" value={form.milestone} onChange={(e) => setForm({ ...form, milestone: e.target.value })} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-notes">Notes</Label>
            <Textarea id="task-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : task ? 'Save' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
