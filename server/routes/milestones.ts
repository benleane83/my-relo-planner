import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';

export const milestonesRouter = Router();

milestonesRouter.get('/', async (req, res) => {
  try {
    const dataDir = req.app.locals.dataDir;
    const raw = await fs.readFile(path.join(dataDir, 'milestones.yaml'), 'utf-8');
    const data = yaml.load(raw) as any;
    res.json(data.milestones || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read milestones' });
  }
});

milestonesRouter.put('/:id', async (req, res) => {
  try {
    const dataDir = req.app.locals.dataDir;
    const filePath = path.join(dataDir, 'milestones.yaml');
    const raw = await fs.readFile(filePath, 'utf-8');
    const data = yaml.load(raw) as any;
    const milestones = data.milestones || [];

    const idx = milestones.findIndex((m: any) => m.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    milestones[idx] = { ...milestones[idx], ...req.body, id: req.params.id };
    await fs.writeFile(filePath, yaml.dump({ milestones }, { lineWidth: -1 }), 'utf-8');
    res.json(milestones[idx]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update milestone' });
  }
});
