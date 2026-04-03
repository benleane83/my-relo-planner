import { useState, useEffect } from 'react';
import type { Config, FamilyMember } from '@/types';
import { useUpdateConfig } from '@/hooks/useApi';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { XIcon, PlusIcon } from 'lucide-react';

interface ConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: Config;
}

export default function ConfigDialog({ open, onOpenChange, config }: ConfigDialogProps) {
  const mutation = useUpdateConfig();

  const [form, setForm] = useState<Config>(config);

  useEffect(() => {
    if (open) setForm(config);
  }, [open, config]);

  const handleSave = () => {
    mutation.mutate(form, { onSuccess: () => onOpenChange(false) });
  };

  const updateFamily = (idx: number, field: keyof FamilyMember, value: string) => {
    setForm((prev) => ({
      ...prev,
      familyMembers: prev.familyMembers.map((m, i) => (i === idx ? { ...m, [field]: value } : m)),
    }));
  };

  const addMember = () => {
    setForm((prev) => ({ ...prev, familyMembers: [...prev.familyMembers, { name: '', notes: '' }] }));
  };

  const removeMember = (idx: number) => {
    setForm((prev) => ({ ...prev, familyMembers: prev.familyMembers.filter((_, i) => i !== idx) }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Move Configuration</DialogTitle>
          <DialogDescription>Update your relocation details.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Origin */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="origin-city">Origin City</Label>
              <Input id="origin-city" value={form.origin.city} onChange={(e) => setForm({ ...form, origin: { ...form.origin, city: e.target.value } })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="origin-country">Origin Country</Label>
              <Input id="origin-country" value={form.origin.country} onChange={(e) => setForm({ ...form, origin: { ...form.origin, country: e.target.value } })} />
            </div>
          </div>

          {/* Destination */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dest-city">Destination City</Label>
              <Input id="dest-city" value={form.destination.city} onChange={(e) => setForm({ ...form, destination: { ...form.destination, city: e.target.value } })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dest-country">Destination Country</Label>
              <Input id="dest-country" value={form.destination.country} onChange={(e) => setForm({ ...form, destination: { ...form.destination, country: e.target.value } })} />
            </div>
          </div>

          {/* Move Date */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="move-date">Move Date</Label>
            <Input id="move-date" type="date" value={form.moveDate} onChange={(e) => setForm({ ...form, moveDate: e.target.value })} />
          </div>

          {/* Currencies */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="origin-currency">Origin Currency</Label>
              <Input id="origin-currency" value={form.originCurrency} onChange={(e) => setForm({ ...form, originCurrency: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dest-currency">Dest Currency</Label>
              <Input id="dest-currency" value={form.destinationCurrency} onChange={(e) => setForm({ ...form, destinationCurrency: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="conv-rate">Rate</Label>
              <Input id="conv-rate" type="number" step="0.01" value={form.conversionRate} onChange={(e) => setForm({ ...form, conversionRate: parseFloat(e.target.value) || 0 })} />
            </div>
          </div>

          {/* Family Members */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label>Family Members</Label>
              <Button variant="ghost" size="xs" onClick={addMember}><PlusIcon /> Add</Button>
            </div>
            {form.familyMembers.map((member, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input placeholder="Name" value={member.name} onChange={(e) => updateFamily(idx, 'name', e.target.value)} className="flex-1" />
                <Input placeholder="Notes" value={member.notes} onChange={(e) => updateFamily(idx, 'notes', e.target.value)} className="flex-1" />
                <Button variant="ghost" size="icon-xs" onClick={() => removeMember(idx)} className="text-destructive"><XIcon /></Button>
              </div>
            ))}
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
