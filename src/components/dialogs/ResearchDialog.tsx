import { useState, useEffect } from 'react';
import type { ResearchTopic } from '@/types';
import { useCreateResearchTopic, useUpdateResearchTopic } from '@/hooks/useApi';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ResearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topic: ResearchTopic | null; // null = create mode
}

export default function ResearchDialog({ open, onOpenChange, topic }: ResearchDialogProps) {
  const createMutation = useCreateResearchTopic();
  const updateMutation = useUpdateResearchTopic();
  const mutation = topic ? updateMutation : createMutation;

  const [form, setForm] = useState({
    title: '',
    slug: '',
    status: 'not-started' as string,
    tags: '',
    content: '',
  });

  useEffect(() => {
    if (open) {
      if (topic) {
        setForm({
          title: topic.title,
          slug: topic.slug,
          status: topic.status,
          tags: topic.tags.join(', '),
          content: '', // User writes fresh markdown
        });
      } else {
        setForm({ title: '', slug: '', status: 'not-started', tags: '', content: '' });
      }
    }
  }, [open, topic]);

  const handleTitleChange = (title: string) => {
    const autoSlug = topic ? form.slug : title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setForm({ ...form, title, slug: autoSlug });
  };

  const handleSave = () => {
    const tagArray = form.tags.split(',').map((t) => t.trim()).filter(Boolean);
    if (topic) {
      updateMutation.mutate(
        { slug: topic.slug, title: form.title, status: form.status, tags: tagArray, content: form.content },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      createMutation.mutate(
        { slug: form.slug, title: form.title, tags: tagArray },
        { onSuccess: () => onOpenChange(false) }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{topic ? 'Edit Topic' : 'New Research Topic'}</DialogTitle>
          <DialogDescription>{topic ? 'Update research topic details and content.' : 'Create a new research topic.'}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rt-title">Title</Label>
            <Input id="rt-title" value={form.title} onChange={(e) => handleTitleChange(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rt-slug">Slug</Label>
            <Input id="rt-slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} disabled={!!topic} />
          </div>

          {topic && (
            <div className="flex flex-col gap-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="not-started">Not Started</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rt-tags">Tags (comma-separated)</Label>
            <Input id="rt-tags" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="e.g. logistics, housing" />
          </div>

          {topic && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rt-content">Content (Markdown)</Label>
              <Textarea id="rt-content" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={12} className="font-mono text-xs" placeholder="Write your research notes in Markdown…" />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : topic ? 'Save' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
