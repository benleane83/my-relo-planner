import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import MarkdownIt from 'markdown-it';

export const researchRouter = Router();
const md = new MarkdownIt();

const toTopicResponse = (slug: string, data: Record<string, any>, bodyMarkdown: string) => ({
  slug,
  title: data.title || slug.replace(/-/g, ' '),
  status: data.status || 'not-started',
  lastUpdated: data.lastUpdated || '',
  tags: Array.isArray(data.tags) ? data.tags : [],
  bodyMarkdown,
  contentHtml: md.render(bodyMarkdown),
});

researchRouter.get('/', async (req, res) => {
  try {
    const dataDir = req.app.locals.dataDir;
    const researchDir = path.join(dataDir, 'research');
    const files = await fs.readdir(researchDir);
    const mdFiles = files.filter(f => f.endsWith('.md'));

    const topics = await Promise.all(
      mdFiles.map(async (file) => {
        const raw = await fs.readFile(path.join(researchDir, file), 'utf-8');
        const { data } = matter(raw);
        return {
          slug: file.replace('.md', ''),
          title: data.title || file.replace('.md', '').replace(/-/g, ' '),
          status: data.status || 'not-started',
          lastUpdated: data.lastUpdated || '',
          tags: data.tags || [],
        };
      })
    );

    res.json(topics);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read research topics' });
  }
});

researchRouter.get('/:slug', async (req, res) => {
  try {
    const dataDir = req.app.locals.dataDir;
    const filePath = path.join(dataDir, 'research', `${req.params.slug}.md`);
    const raw = await fs.readFile(filePath, 'utf-8');
    const { data, content } = matter(raw);

    res.json(toTopicResponse(req.params.slug, data, content));
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      res.status(404).json({ error: 'Research topic not found' });
    } else {
      res.status(500).json({ error: 'Failed to read research topic' });
    }
  }
});

researchRouter.post('/', async (req, res) => {
  try {
    const dataDir = req.app.locals.dataDir;
    const { slug, title, tags } = req.body;

    if (!slug || !title) {
      return res.status(400).json({ error: 'slug and title are required' });
    }

    if (slug.includes('..') || slug.includes('/') || slug.includes('\\') || !/^[a-z0-9-]+$/.test(slug)) {
      return res.status(400).json({ error: 'Invalid slug. Use lowercase letters, numbers, and hyphens only.' });
    }

    const filePath = path.join(dataDir, 'research', `${slug}.md`);

    try {
      await fs.access(filePath);
      return res.status(409).json({ error: 'Research topic already exists' });
    } catch {}

    const frontmatter = {
      title,
      status: 'not-started' as const,
      lastUpdated: new Date().toISOString().split('T')[0],
      tags: tags || [],
    };

    const content = `# ${title}\n\n## Overview\n\n_No research yet._\n\n## Key Questions\n\n- \n\n## Notes\n\n`;
    const fileContent = matter.stringify(content, frontmatter);
    await fs.writeFile(filePath, fileContent, 'utf-8');

    res.status(201).json(toTopicResponse(slug, frontmatter, content));
  } catch (err) {
    res.status(500).json({ error: 'Failed to create research topic' });
  }
});

researchRouter.put('/:slug', async (req, res) => {
  try {
    const dataDir = req.app.locals.dataDir;

    if (req.params.slug.includes('..') || req.params.slug.includes('/') || req.params.slug.includes('\\')) {
      return res.status(400).json({ error: 'Invalid slug' });
    }

    const filePath = path.join(dataDir, 'research', `${req.params.slug}.md`);
    const raw = await fs.readFile(filePath, 'utf-8');
    const { data: existingFrontmatter, content: existingBodyMarkdown } = matter(raw);
    const { title, status, tags, bodyMarkdown, content } = req.body;
    const hasBodyMarkdown = Object.prototype.hasOwnProperty.call(req.body, 'bodyMarkdown');
    const hasLegacyContent = Object.prototype.hasOwnProperty.call(req.body, 'content');
    const nextBodyMarkdown = hasBodyMarkdown
      ? bodyMarkdown
      : hasLegacyContent
        ? content
        : existingBodyMarkdown;

    const frontmatter: any = {
      title: title || existingFrontmatter.title || req.params.slug.replace(/-/g, ' '),
      status: status || existingFrontmatter.status || 'not-started',
      lastUpdated: new Date().toISOString().split('T')[0],
      tags: Array.isArray(tags) ? tags : Array.isArray(existingFrontmatter.tags) ? existingFrontmatter.tags : [],
    };

    const fileContent = matter.stringify(nextBodyMarkdown ?? '', frontmatter);
    await fs.writeFile(filePath, fileContent, 'utf-8');

    res.json(toTopicResponse(req.params.slug, frontmatter, nextBodyMarkdown ?? ''));
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      res.status(404).json({ error: 'Research topic not found' });
    } else {
      res.status(500).json({ error: 'Failed to update research topic' });
    }
  }
});
