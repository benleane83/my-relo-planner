import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useResearchTopics, useResearchTopic } from '@/hooks/useApi';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusIcon, PencilIcon } from 'lucide-react';
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

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTopic, setEditTopic] = useState<typeof topic | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Research</h2>
        <Button size="sm" onClick={() => { setEditTopic(null); setDialogOpen(true); }}>
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
                      onClick={() => navigate(`/research/${t.slug}`)}
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
                  <Button variant="outline" size="icon-xs" className="ml-auto" onClick={() => { setEditTopic(topic); setDialogOpen(true); }}>
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
                <div
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: topic.content ?? '' }}
                />
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
