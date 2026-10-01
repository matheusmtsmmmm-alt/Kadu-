// Disable Vite HMR in AI Studio container to avoid port 24678 WebSocket conflicts
process.env.DISABLE_HMR = 'true';

import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import { createExpressApp, readDb } from './src/serverApp';
import { setupWebSocketServer } from './src/serverSync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

async function startServer() {
  const app = createExpressApp();
  const httpServer = http.createServer(app);

  // Setup Real-Time WebSocket synchronization for multi-device live sync
  setupWebSocketServer(httpServer, readDb);

  // Integrate Vite for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`> Kadu Manutenções server running at http://0.0.0.0:${PORT} [Real-time WebSockets active]`);
  });
}

startServer().catch((err) => {
  console.error('Server failed to start:', err);
  process.exit(1);
});
