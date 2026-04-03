import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';

export const configRouter = Router();

configRouter.get('/', async (req, res) => {
  try {
    const dataDir = req.app.locals.dataDir;
    const raw = await fs.readFile(path.join(dataDir, 'config.json'), 'utf-8');
    res.json(JSON.parse(raw));
  } catch (err) {
    res.status(500).json({ error: 'Failed to read config' });
  }
});

configRouter.put('/', async (req, res) => {
  try {
    const dataDir = req.app.locals.dataDir;
    const config = req.body;
    if (!config.origin || !config.destination || !config.moveDate) {
      return res.status(400).json({ error: 'Missing required fields: origin, destination, moveDate' });
    }
    await fs.writeFile(
      path.join(dataDir, 'config.json'),
      JSON.stringify(config, null, 2),
      'utf-8'
    );
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update config' });
  }
});
