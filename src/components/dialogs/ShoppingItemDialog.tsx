import { useState, useEffect } from 'react';
import type { ShoppingItem } from '@/types';
import { useCreateShoppingItem, useUpdateShoppingItem } from '@/hooks/useApi';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ShoppingItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ShoppingItem | null; // null = create mode
  defaultCurrency: string;
}

const emptyForm = {
  item: '',
  category: 'other' as ShoppingItem['category'],
  quantity: 1,
  estimatedCost: 0,
  actualCost: 0,
  currency: '',
  status: 'needed' as ShoppingItem['status'],
  store: '',
  notes: '',
};

export default function ShoppingItemDialog({ open, onOpenChange, item, defaultCurrency }: ShoppingItemDialogProps) {
  const createMutation = useCreateShoppingItem();
  const updateMutation = useUpdateShoppingItem();
  const mutation = item ? updateMutation : createMutation;

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (open) {
      setForm(item ? {
        item: item.item,
        category: item.category,
        quantity: item.quantity,
        estimatedCost: item.estimatedCost,
        actualCost: item.actualCost,
        currency: item.currency,
        status: item.status,
        store: item.store,
        notes: item.notes,
      } : { ...emptyForm, currency: defaultCurrency });
    }
  }, [open, item, defaultCurrency]);

  const handleSave = () => {
    if (item) {
      updateMutation.mutate({ id: item.id, ...form }, { onSuccess: () => onOpenChange(false) });
    } else {
      createMutation.mutate(form as Omit<ShoppingItem, 'id'>, { onSuccess: () => onOpenChange(false) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{item ? 'Edit Item' : 'New Item'}</DialogTitle>
          <DialogDescription>{item ? 'Update shopping item details.' : 'Add a new shopping item.'}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="si-name">Item Name</Label>
            <Input id="si-name" value={form.item} onChange={(e) => setForm({ ...form, item: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as ShoppingItem['category'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="furniture">Furniture</SelectItem>
                  <SelectItem value="electronics">Electronics</SelectItem>
                  <SelectItem value="household">Household</SelectItem>
                  <SelectItem value="clothing">Clothing</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as ShoppingItem['status'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="needed">Needed</SelectItem>
                  <SelectItem value="researching">Researching</SelectItem>
                  <SelectItem value="purchased">Purchased</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="si-qty">Quantity</Label>
              <Input id="si-qty" type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="si-est">Estimated</Label>
              <Input id="si-est" type="number" min="0" step="0.01" value={form.estimatedCost} onChange={(e) => setForm({ ...form, estimatedCost: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="si-act">Actual</Label>
              <Input id="si-act" type="number" min="0" step="0.01" value={form.actualCost} onChange={(e) => setForm({ ...form, actualCost: parseFloat(e.target.value) || 0 })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="si-currency">Currency</Label>
              <Input id="si-currency" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="si-store">Store</Label>
              <Input id="si-store" value={form.store} onChange={(e) => setForm({ ...form, store: e.target.value })} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="si-notes">Notes</Label>
            <Textarea id="si-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : item ? 'Save' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
