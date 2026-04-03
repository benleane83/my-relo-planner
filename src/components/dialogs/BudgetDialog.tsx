import { useState, useEffect } from 'react';
import type { ShoppingBudget } from '@/types';
import { useUpdateBudget } from '@/hooks/useApi';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget: ShoppingBudget;
}

export default function BudgetDialog({ open, onOpenChange, budget }: BudgetDialogProps) {
  const mutation = useUpdateBudget();

  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<Record<string, number>>({});

  useEffect(() => {
    if (open) {
      setTotal(budget.total);
      setCategories({ ...budget.categories });
    }
  }, [open, budget]);

  const handleSave = () => {
    mutation.mutate({ total, categories }, { onSuccess: () => onOpenChange(false) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Budget</DialogTitle>
          <DialogDescription>Update total budget and per-category limits.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="budget-total">Total Budget</Label>
            <Input id="budget-total" type="number" min="0" value={total} onChange={(e) => setTotal(parseFloat(e.target.value) || 0)} />
          </div>

          {Object.entries(categories).map(([name, limit]) => (
            <div key={name} className="flex flex-col gap-1.5">
              <Label className="capitalize">{name}</Label>
              <Input type="number" min="0" value={limit} onChange={(e) => setCategories({ ...categories, [name]: parseFloat(e.target.value) || 0 })} />
            </div>
          ))}
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
