import express from "express";
import { createServer as createViteServer } from "vite";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { errorHandler } from './src/api/middleware.ts';

import authRouter from './src/api/routes/auth.ts';
import publicRouter from './src/api/routes/public.ts';
import projectsRouter from './src/api/routes/projects.ts';
import propertiesRouter from './src/api/routes/properties.ts';
import leadsRouter from './src/api/routes/leads.ts';
import clientsRouter from './src/api/routes/clients.ts';
import visitsRouter from './src/api/routes/visits.ts';
import dealsRouter from './src/api/routes/deals.ts';
import statsRouter from './src/api/routes/stats.ts';
import reportsRouter from './src/api/routes/reports.ts';
import agentsRouter from './src/api/routes/agents.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 30000;

  app.use(express.json());

  // --- API Routes ---
  app.use('/api/public', publicRouter);
  app.use('/api', authRouter);
  app.use('/api', projectsRouter);
  app.use('/api', propertiesRouter);
  app.use('/api', leadsRouter);
  app.use('/api', clientsRouter);
  app.use('/api', visitsRouter);
  app.use('/api', dealsRouter);
  app.use('/api', statsRouter);
  app.use('/api', reportsRouter);
  app.use('/api', agentsRouter);

  // Global Error Handler
  app.use(errorHandler);

  // Vite middleware for active development
  const vite = await createViteServer({
    server: { 
      middlewareMode: true,
      hmr: false 
    },
    appType: "spa",
  });
  
  // Use vite's connect instance as middleware
  app.use(vite.middlewares);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 DEV Server (Single Port) running on http://localhost:${PORT}`);
    console.log(`🛠️  Vite Middleware Active (No WebSockets needed)`);
  });
}

startServer();
