import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import chokidar from 'chokidar';
import { configRouter } from './routes/config.js';
import { researchRouter } from './routes/research.js';
import { milestonesRouter } from './routes/milestones.js';
import { tasksRouter } from './routes/tasks.js';
import { shoppingRouter } from './routes/shopping.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '..', 'data');

const app = express();
const PORT = 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Simple cache invalidation — routes read fresh on each request after a change
let cacheVersion = 0;
const watcher = chokidar.watch(DATA_DIR, { ignoreInitial: true });
watcher.on('all', (event, filePath) => {
  cacheVersion++;
  console.log(`[data] ${event}: ${path.relative(DATA_DIR, filePath)} (cache v${cacheVersion})`);
});

// Pass DATA_DIR to routes via app.locals
app.locals.dataDir = DATA_DIR;

app.use('/api/config', configRouter);
app.use('/api/research', researchRouter);
app.use('/api/milestones', milestonesRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/shopping', shoppingRouter);

app.listen(PORT, () => {
  console.log(`[server] API running at http://localhost:${PORT}`);
  console.log(`[server] Watching ${DATA_DIR} for changes`);
});
