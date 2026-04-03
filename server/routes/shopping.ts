import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';

export const shoppingRouter = Router();

shoppingRouter.get('/', async (req, res) => {
  try {
    const dataDir = req.app.locals.dataDir;
    const raw = await fs.readFile(path.join(dataDir, 'shopping.yaml'), 'utf-8');
    const data = yaml.load(raw) as any;

    const items = data.items || [];
    const budget = data.budget || { total: 0, categories: {} };

    // Read config for currency conversion
    const configRaw = await fs.readFile(path.join(dataDir, 'config.json'), 'utf-8');
    const config = JSON.parse(configRaw);

    // Compute totals
    const totalEstimated = items.reduce((sum: number, item: any) => {
      const cost = item.estimatedCost || 0;
      const normalizedCost = item.currency === config.destinationCurrency
        ? cost / config.conversionRate
        : cost;
      return sum + normalizedCost;
    }, 0);

    const totalActual = items.reduce((sum: number, item: any) => {
      const cost = item.actualCost || 0;
      const normalizedCost = item.currency === config.destinationCurrency
        ? cost / config.conversionRate
        : cost;
      return sum + normalizedCost;
    }, 0);

    // Per-category totals
    const categoryTotals: Record<string, { estimated: number; actual: number }> = {};
    for (const item of items) {
      if (!categoryTotals[item.category]) {
        categoryTotals[item.category] = { estimated: 0, actual: 0 };
      }
      const estCost = item.estimatedCost || 0;
      const actCost = item.actualCost || 0;
      const normalizeEst = item.currency === config.destinationCurrency
        ? estCost / config.conversionRate
        : estCost;
      const normalizeAct = item.currency === config.destinationCurrency
        ? actCost / config.conversionRate
        : actCost;
      categoryTotals[item.category].estimated += normalizeEst;
      categoryTotals[item.category].actual += normalizeAct;
    }

    res.json({
      budget,
      items,
      totals: {
        estimated: Math.round(totalEstimated * 100) / 100,
        actual: Math.round(totalActual * 100) / 100,
        byCategory: categoryTotals,
      },
      currency: {
        origin: config.originCurrency,
        destination: config.destinationCurrency,
        conversionRate: config.conversionRate,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read shopping data' });
  }
});

shoppingRouter.post('/items', async (req, res) => {
  try {
    const dataDir = req.app.locals.dataDir;
    const filePath = path.join(dataDir, 'shopping.yaml');
    const raw = await fs.readFile(filePath, 'utf-8');
    const data = yaml.load(raw) as any;
    const items = data.items || [];
    const budget = data.budget || { total: 0, categories: {} };

    const newItem = {
      ...req.body,
      id: `shop-${Date.now()}`,
    };
    items.push(newItem);

    await fs.writeFile(filePath, yaml.dump({ budget, items }, { lineWidth: -1 }), 'utf-8');
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create shopping item' });
  }
});

shoppingRouter.put('/items/:id', async (req, res) => {
  try {
    const dataDir = req.app.locals.dataDir;
    const filePath = path.join(dataDir, 'shopping.yaml');
    const raw = await fs.readFile(filePath, 'utf-8');
    const data = yaml.load(raw) as any;
    const items = data.items || [];
    const budget = data.budget || { total: 0, categories: {} };

    const idx = items.findIndex((i: any) => i.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Shopping item not found' });
    }

    items[idx] = { ...items[idx], ...req.body, id: req.params.id };
    await fs.writeFile(filePath, yaml.dump({ budget, items }, { lineWidth: -1 }), 'utf-8');
    res.json(items[idx]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update shopping item' });
  }
});

shoppingRouter.delete('/items/:id', async (req, res) => {
  try {
    const dataDir = req.app.locals.dataDir;
    const filePath = path.join(dataDir, 'shopping.yaml');
    const raw = await fs.readFile(filePath, 'utf-8');
    const data = yaml.load(raw) as any;
    const items = data.items || [];
    const budget = data.budget || { total: 0, categories: {} };

    const idx = items.findIndex((i: any) => i.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Shopping item not found' });
    }

    items.splice(idx, 1);
    await fs.writeFile(filePath, yaml.dump({ budget, items }, { lineWidth: -1 }), 'utf-8');
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete shopping item' });
  }
});

shoppingRouter.put('/budget', async (req, res) => {
  try {
    const dataDir = req.app.locals.dataDir;
    const filePath = path.join(dataDir, 'shopping.yaml');
    const raw = await fs.readFile(filePath, 'utf-8');
    const data = yaml.load(raw) as any;
    const items = data.items || [];

    const budget = { ...data.budget, ...req.body };
    await fs.writeFile(filePath, yaml.dump({ budget, items }, { lineWidth: -1 }), 'utf-8');
    res.json(budget);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update budget' });
  }
});
