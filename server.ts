import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { initDb } from './src/backend/data/AppDbContext.ts';
import { 
  RoutesController, 
  ShopsController, 
  InvoicesController, 
  ChequesController, 
  DashboardController 
} from './src/backend/controllers/Controllers.ts';
import { DashboardService } from './src/backend/services/MasterServices.ts';
import { InvoiceService } from './src/backend/services/InvoiceService.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize DB
  initDb();

  app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true
  }));
  app.use(express.json());

  // API Routes
  const api = express.Router();

  // Routes
  api.get('/routes', RoutesController.getAll);
  api.post('/routes', RoutesController.create);

  // Shops
  api.get('/shops', ShopsController.getAll);
  api.post('/shops', ShopsController.create);
  api.put('/shops/:id', ShopsController.update);

  // Invoices
  api.get('/invoices', InvoicesController.getAll);
  api.get('/invoices/summary', InvoicesController.getSummary);
  api.get('/invoices/:id', InvoicesController.getById);
  api.post('/invoices', InvoicesController.create);
  api.put('/invoices/:id', InvoicesController.update);

  // Cheques
  api.get('/cheques', ChequesController.getAll);
  api.put('/cheques/:id', ChequesController.update);

  // Dashboard
  api.get('/dashboard/daily', DashboardController.getDaily);
  api.get('/dashboard/cheques-due', async (req, res) => {
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    res.json(DashboardService.getChequesDueToday(date));
  });

  // Credits
  api.get('/credits', async (req, res) => {
    const { routeId, agingMonths, specificDate } = req.query;
    res.json(InvoiceService.getCredits({ 
      routeId: routeId as string, 
      agingMonths: agingMonths ? parseInt(agingMonths as string) : undefined,
      specificDate: specificDate as string
    }));
  });

  app.use('/api', api);

  // Serve static files / Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
