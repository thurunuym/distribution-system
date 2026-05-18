import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5000'],
    credentials: true
  }));
  app.use(express.json());

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

  // SPA fallback
  app.get('*', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.end(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Distribution Agency Invoice Tracker</title>
          <script type="module" src="/src/main.tsx"></script>
        </head>
        <body>
          <div id="root"></div>
        </body>
      </html>
    `);
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n✓ Frontend server running at http://localhost:${PORT}`);
    console.log(`✓ API proxy configured: /api -> http://localhost:5000`);
    console.log(`\nMake sure the .NET backend is running on http://localhost:5000\n`);
  });
}

startServer();
