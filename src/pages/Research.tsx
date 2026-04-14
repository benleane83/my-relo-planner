import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useResearchTopics, useResearchTopic, useUpdateResearchTopic } from '@/hooks/useApi';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { PlusIcon, PencilIcon, FilePenLineIcon, EyeIcon } from 'lucide-react';
import ResearchDialog from '@/components/dialogs/ResearchDialog';

const statusVariant = (status: string) => {
  switch (status) {
    case 'done':
      return 'default' as const;
    case 'in-progress':
      return 'secondary' as const;
    default:
      return 'outline' as const;
  }
};

const statusLabel = (status: string) => {
  switch (status) {
    case 'done':
      return '✓ Done';
    case 'in-progress':
      return '● In Progress';
    default:
      return '○ Not Started';
  }
};

export default function Research() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: topics, isLoading: topicsLoading } = useResearchTopics();
  const { data: topic, isLoading: topicLoading } = useResearchTopic(slug ?? null);
  const updateTopicMutation = useUpdateResearchTopic();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTopic, setEditTopic] = useState<typeof topic | null>(null);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [editorTab, setEditorTab] = useState('write');
  const [draftMarkdown, setDraftMarkdown] = useState('');
  const [draftSlug, setDraftSlug] = useState<string | null>(null);

  useEffect(() => {
    if (!topic) {
      setDraftMarkdown('');
      setDraftSlug(null);
      setIsEditingContent(false);
      return;
    }

    if (topic.slug !== draftSlug) {
      setDraftMarkdown(topic.bodyMarkdown);
      setDraftSlug(topic.slug);
      setIsEditingContent(false);
      setEditorTab('write');
      return;
    }

    if (!isEditingContent) {
      setDraftMarkdown(topic.bodyMarkdown);
    }
  }, [draftSlug, isEditingContent, topic]);

  const isDirty = !!topic && draftMarkdown !== topic.bodyMarkdown;

  const confirmDiscardChanges = () => {
    if (!isEditingContent || !isDirty) {
      return true;
    }

    return window.confirm('Discard unsaved Markdown changes?');
  };

  const handleTopicSelect = (nextSlug: string) => {
    if (!confirmDiscardChanges()) {
      return;
    }

    navigate(`/research/${nextSlug}`);
  };

  const handleOpenDialog = (nextTopic: typeof topic | null) => {
    setEditTopic(nextTopic);
    setDialogOpen(true);
  };

  const handleStartContentEdit = () => {
    if (!topic) {
      return;
    }

    setDraftMarkdown(topic.bodyMarkdown);
    setIsEditingContent(true);
    setEditorTab('write');
  };

  const handleCancelContentEdit = () => {
    if (!topic) {
      return;
    }

    setDraftMarkdown(topic.bodyMarkdown);
    setIsEditingContent(false);
    setEditorTab('write');
  };

  const handleSaveContent = () => {
    if (!topic) {
      return;
    }

    updateTopicMutation.mutate(
      { slug: topic.slug, bodyMarkdown: draftMarkdown },
      {
        onSuccess: () => {
          setIsEditingContent(false);
          setEditorTab('write');
        },
      }
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Research</h2>
        <Button size="sm" onClick={() => { if (!confirmDiscardChanges()) return; handleOpenDialog(null); }}>
          <PlusIcon /> New Topic
        </Button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row">
        {/* Topic List */}
        <Card className="w-full shrink-0 md:w-72">
          <CardHeader>
            <CardTitle className="text-base">Topics</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-16rem)]">
              <div className="flex flex-col">
                {topicsLoading ? (
                  <div className="flex flex-col gap-2 p-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : (
                  topics?.map((t) => (
                    <button
                      key={t.slug}
                      onClick={() => handleTopicSelect(t.slug)}
                      className={cn(
                        'flex items-center justify-between gap-2 px-4 py-3 text-left text-sm transition-colors hover:bg-accent',
                        slug === t.slug && 'bg-accent'
                      )}
                    >
                      <span className="font-medium">{t.title}</span>
                      <Badge variant={statusVariant(t.status)} className="shrink-0 text-xs">
                        {statusLabel(t.status)}
                      </Badge>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Topic Content */}
        <Card className="flex-1">
          {!slug ? (
            <CardContent className="flex h-64 items-center justify-center">
              <p className="text-sm text-muted-foreground">Select a topic to view</p>
            </CardContent>
          ) : topicLoading ? (
            <CardContent className="flex flex-col gap-3 pt-6">
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-48 w-full" />
            </CardContent>
          ) : topic ? (
            <>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <CardTitle>{topic.title}</CardTitle>
                  <Badge variant={statusVariant(topic.status)}>
                    {statusLabel(topic.status)}
                  </Badge>
                  {isEditingContent ? (
                    <Badge variant="secondary" className="ml-auto">
                      Editing Markdown
                    </Badge>
                  ) : (
                    <Button variant="outline" size="sm" className="ml-auto" onClick={handleStartContentEdit}>
                      <FilePenLineIcon data-icon="inline-start" /> Edit Markdown
                    </Button>
                  )}
                  <Button variant="outline" size="icon-xs" onClick={() => handleOpenDialog(topic)}>
                    <PencilIcon />
                  </Button>
                </div>
                <CardDescription>
                  Last updated: {new Date(topic.lastUpdated).toLocaleDateString()}
                </CardDescription>
                {topic.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {topic.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardHeader>
              <Separator />
              <CardContent className="pt-4">
                {isEditingContent ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={isDirty ? 'secondary' : 'outline'}>
                        {isDirty ? 'Unsaved changes' : 'No changes yet'}
                      </Badge>
                      <Button size="sm" onClick={handleSaveContent} disabled={updateTopicMutation.isPending || !isDirty}>
                        {updateTopicMutation.isPending ? 'Saving…' : 'Save Markdown'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleCancelContentEdit} disabled={updateTopicMutation.isPending}>
                        Cancel
                      </Button>
                    </div>

                    <Tabs value={editorTab} onValueChange={setEditorTab}>
                      <TabsList variant="line">
                        <TabsTrigger value="write">
                          <FilePenLineIcon data-icon="inline-start" /> Write
                        </TabsTrigger>
                        <TabsTrigger value="preview">
                          <EyeIcon data-icon="inline-start" /> Preview
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="write" className="mt-4">
                        <Textarea
                          value={draftMarkdown}
                          onChange={(event) => setDraftMarkdown(event.target.value)}
                          className="min-h-[28rem] font-mono text-sm"
                          placeholder="Write your research notes in Markdown…"
                        />
                      </TabsContent>

                      <TabsContent value="preview" className="mt-4">
                        <div className="min-h-[28rem] rounded-md border bg-muted/20 p-4">
                          <MarkdownBody markdown={draftMarkdown} emptyMessage="Nothing to preview yet." />
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                ) : (
                  <MarkdownBody markdown={topic.bodyMarkdown} emptyMessage="No research content yet." />
                )}
              </CardContent>
            </>
          ) : (
            <CardContent className="flex h-64 items-center justify-center">
              <p className="text-sm text-muted-foreground">Topic not found</p>
            </CardContent>
          )}
        </Card>
      </div>

      <ResearchDialog open={dialogOpen} onOpenChange={setDialogOpen} topic={editTopic ?? null} />
    </div>
  );
}

function MarkdownBody({ markdown, emptyMessage }: { markdown: string; emptyMessage: string }) {
  const trimmedMarkdown = markdown.trim();

  if (!trimmedMarkdown) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </div>
  );
}
