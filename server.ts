import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createBackendApp } from './backend/app.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = createBackendApp();
  const PORT = 3000;

  // Vite/Static logic
  if (process.env.NODE_ENV !== "production") {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.warn('Vite not found, skipping middleware');
    }
  } else {
    // Only serve static files if NOT on Vercel (e.g. Cloud Run)
    // Vercel handles static logic via vercel.json rewrites
    if (!process.env.VERCEL) {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*all', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
