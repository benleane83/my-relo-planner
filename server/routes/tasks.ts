import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';

export const tasksRouter = Router();

tasksRouter.get('/', async (req, res) => {
  try {
    const dataDir = req.app.locals.dataDir;
    const raw = await fs.readFile(path.join(dataDir, 'tasks.yaml'), 'utf-8');
    const data = yaml.load(raw) as any;
    let tasks = data.tasks || [];

    const category = req.query.category as string | undefined;
    if (category) {
      tasks = tasks.filter((t: any) => t.category === category);
    }

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read tasks' });
  }
});

tasksRouter.post('/', async (req, res) => {
  try {
    const dataDir = req.app.locals.dataDir;
    const filePath = path.join(dataDir, 'tasks.yaml');
    const raw = await fs.readFile(filePath, 'utf-8');
    const data = yaml.load(raw) as any;
    const tasks = data.tasks || [];

    const newTask = {
      ...req.body,
      id: `task-${Date.now()}`,
    };
    tasks.push(newTask);

    await fs.writeFile(filePath, yaml.dump({ tasks }, { lineWidth: -1 }), 'utf-8');
    res.status(201).json(newTask);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

tasksRouter.put('/:id', async (req, res) => {
  try {
    const dataDir = req.app.locals.dataDir;
    const filePath = path.join(dataDir, 'tasks.yaml');
    const raw = await fs.readFile(filePath, 'utf-8');
    const data = yaml.load(raw) as any;
    const tasks = data.tasks || [];

    const idx = tasks.findIndex((t: any) => t.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }

    tasks[idx] = { ...tasks[idx], ...req.body, id: req.params.id };
    await fs.writeFile(filePath, yaml.dump({ tasks }, { lineWidth: -1 }), 'utf-8');
    res.json(tasks[idx]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

tasksRouter.delete('/:id', async (req, res) => {
  try {
    const dataDir = req.app.locals.dataDir;
    const filePath = path.join(dataDir, 'tasks.yaml');
    const raw = await fs.readFile(filePath, 'utf-8');
    const data = yaml.load(raw) as any;
    const tasks = data.tasks || [];

    const idx = tasks.findIndex((t: any) => t.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }

    tasks.splice(idx, 1);
    await fs.writeFile(filePath, yaml.dump({ tasks }, { lineWidth: -1 }), 'utf-8');
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});
