import { WebSocketServer, WebSocket } from 'ws';
import type { Server as HttpServer } from 'http';
import type { Response } from 'express';

// Set of connected WebSocket clients
const wsClients = new Set<WebSocket>();

// Set of connected SSE clients (fallback for environments where WS is limited)
const sseClients = new Set<Response>();

let currentVersion = Date.now();
let lastBroadcastData: any = null;

export function getCurrentVersion() {
  return currentVersion;
}

export function getConnectedClientsCount() {
  return wsClients.size + sseClients.size;
}

/**
 * Broadcasts data update to all connected phones/devices immediately.
 */
export function broadcastDataUpdate(data: any) {
  currentVersion = Date.now();
  data.version = currentVersion;
  lastBroadcastData = data;

  const payload = JSON.stringify({
    type: 'DATA_UPDATE',
    data,
    version: currentVersion,
    timestamp: new Date().toISOString(),
    clientCount: wsClients.size + sseClients.size
  });

  // 1. Broadcast to all active WebSocket clients
  for (const client of wsClients) {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(payload);
      } catch (err) {
        console.error('Error broadcasting to WS client:', err);
        wsClients.delete(client);
      }
    } else if (client.readyState === WebSocket.CLOSED || client.readyState === WebSocket.CLOSING) {
      wsClients.delete(client);
    }
  }

  // 2. Broadcast to all active SSE clients
  for (const sseRes of sseClients) {
    try {
      sseRes.write(`event: data_update\ndata: ${payload}\n\n`);
    } catch (err) {
      sseClients.delete(sseRes);
    }
  }
}

/**
 * Initializes WebSocket Server attached to the HTTP server
 */
export function setupWebSocketServer(server: HttpServer, getLatestData: () => any) {
  const wss = new WebSocketServer({
    noServer: true
  });

  server.on('upgrade', (request, socket, head) => {
    const url = request.url || '';
    // Accept upgrades on /ws, /api/ws, or /
    if (url.startsWith('/ws') || url.startsWith('/api/ws')) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', (ws: WebSocket) => {
    wsClients.add(ws);

    // Immediately send current state and version to newly connected device
    try {
      const currentData = getLatestData();
      ws.send(JSON.stringify({
        type: 'INIT',
        data: currentData,
        version: currentVersion,
        timestamp: new Date().toISOString(),
        clientCount: wsClients.size
      }));
    } catch (e) {
      console.error('Error sending init data to WS client:', e);
    }

    // Ping / Pong heartbeat to keep mobile connections alive
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.ping();
        } catch {
          clearInterval(pingInterval);
          wsClients.delete(ws);
        }
      } else {
        clearInterval(pingInterval);
        wsClients.delete(ws);
      }
    }, 25000);

    ws.on('message', (message) => {
      try {
        const parsed = JSON.parse(message.toString());
        if (parsed.type === 'PING') {
          ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
        } else if (parsed.type === 'REQUEST_SYNC') {
          const currentData = getLatestData();
          ws.send(JSON.stringify({
            type: 'DATA_UPDATE',
            data: currentData,
            version: currentVersion
          }));
        }
      } catch (err) {
        // non-json or invalid
      }
    });

    ws.on('close', () => {
      clearInterval(pingInterval);
      wsClients.delete(ws);
    });

    ws.on('error', () => {
      clearInterval(pingInterval);
      wsClients.delete(ws);
    });
  });

  return wss;
}

/**
 * Registers an SSE client for real-time fallback updates
 */
export function registerSseClient(res: Response, getLatestData: () => any) {
  sseClients.add(res);

  // Send initial data
  const currentData = getLatestData();
  const initPayload = JSON.stringify({
    type: 'INIT',
    data: currentData,
    version: currentVersion
  });
  res.write(`event: init\ndata: ${initPayload}\n\n`);

  // Keep-alive heartbeat comment every 20 seconds
  const sseKeepAlive = setInterval(() => {
    try {
      res.write(': keepalive\n\n');
    } catch {
      clearInterval(sseKeepAlive);
      sseClients.delete(res);
    }
  }, 20000);

  res.on('close', () => {
    clearInterval(sseKeepAlive);
    sseClients.delete(res);
  });
}
