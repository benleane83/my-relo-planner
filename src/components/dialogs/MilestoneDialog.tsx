import { useState, useEffect } from 'react';
import type { Milestone } from '@/types';
import { useUpdateMilestone } from '@/hooks/useApi';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface MilestoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  milestone: Milestone | null;
}

export default function MilestoneDialog({ open, onOpenChange, milestone }: MilestoneDialogProps) {
  const mutation = useUpdateMilestone();

  const [form, setForm] = useState({
    title: '',
    category: '',
    targetDate: '',
    status: 'pending' as Milestone['status'],
    notes: '',
  });

  useEffect(() => {
    if (open && milestone) {
      setForm({
        title: milestone.title,
        category: milestone.category,
        targetDate: milestone.targetDate,
        status: milestone.status,
        notes: milestone.notes,
      });
    }
  }, [open, milestone]);

  const handleSave = () => {
    if (!milestone) return;
    mutation.mutate({ id: milestone.id, ...form }, { onSuccess: () => onOpenChange(false) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Milestone</DialogTitle>
          <DialogDescription>Update milestone details.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ms-title">Title</Label>
            <Input id="ms-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ms-category">Category</Label>
              <Input id="ms-category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ms-date">Target Date</Label>
              <Input id="ms-date" type="date" value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Milestone['status'] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ms-notes">Notes</Label>
            <Textarea id="ms-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
