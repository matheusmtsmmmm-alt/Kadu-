import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import { INITIAL_APP_DATA } from './data/initialData';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Detect Vercel / serverless environment
const isVercel = Boolean(process.env.VERCEL || process.env.NOW_REGION || process.env.AWS_LAMBDA_FUNCTION_NAME);

// In Vercel serverless, root directory is read-only. Use os.tmpdir() instead.
const DATA_DIR = isVercel
  ? path.join(os.tmpdir(), 'kadu-data')
  : path.resolve(__dirname, '..', 'data');

const DB_FILE = path.join(DATA_DIR, 'db.json');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

// Ensure directories exist safely
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('Could not create directory on disk, operating with in-memory fallback:', e);
}

// Initial seed data from central constant
export const initialData = INITIAL_APP_DATA;

// In-memory fallback cache
let memoryDb: any = JSON.parse(JSON.stringify(INITIAL_APP_DATA));

export function readDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_APP_DATA, null, 2), 'utf-8');
      } catch (writeErr) {
        // Can't write to disk (e.g. read-only environment)
      }
      return memoryDb || INITIAL_APP_DATA;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed.companySettings) {
      if (!parsed.companySettings.adminPin) {
        parsed.companySettings.adminPin = "1111";
      }
      if (
        !parsed.companySettings.logoUrl ||
        parsed.companySettings.logoUrl.startsWith('/src/assets') ||
        (parsed.companySettings.logoUrl.includes('kadu_logo_1790525097159.jpg') && !parsed.companySettings.logoUrl.startsWith('data:'))
      ) {
        parsed.companySettings.logoUrl = INITIAL_APP_DATA.companySettings.logoUrl;
      }
    }
    if (parsed.machines && Array.isArray(parsed.machines)) {
      // Clean out any outdated compressor maq_3 if present and ensure Oppeano is client
      parsed.machines = parsed.machines
        .filter((m: any) => m.id !== 'maq_3' && m.tag !== 'MQ-03' && !m.name?.includes('Compressor'))
        .map((m: any) => ({
          ...m,
          clientName: m.clientName && m.clientName !== 'Embalagens Brasil Sul' && m.clientName !== 'Kadu Manutenções' ? m.clientName : 'Oppeano'
        }));
    } else {
      parsed.machines = INITIAL_APP_DATA.machines;
    }
    if (parsed.clients && Array.isArray(parsed.clients)) {
      parsed.clients = parsed.clients.filter((c: any) => c.id !== 'cli_1' && c.id !== 'cli_2' && c.id !== 'cli_3');
      if (parsed.clients.length === 0) {
        parsed.clients = INITIAL_APP_DATA.clients;
      }
    } else {
      parsed.clients = INITIAL_APP_DATA.clients;
    }
    if (!parsed.version) {
      parsed.version = 1;
    }
    memoryDb = parsed;
    return parsed;
  } catch (err) {
    if (!memoryDb.version) memoryDb.version = 1;
    return memoryDb || INITIAL_APP_DATA;
  }
}

import { broadcastDataUpdate, registerSseClient, getCurrentVersion, getConnectedClientsCount, setCurrentVersion } from './serverSync';

export function writeDb(data: any) {
  // Monotonically increasing version on every mutation
  data.version = (typeof data.version === 'number' ? data.version : 0) + 1;
  data.lastModified = new Date().toISOString();
  memoryDb = data;
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    // If running in serverless where disk is read-only, memoryDb still holds the changes
  }
  // Keep serverSync in sync with latest version
  setCurrentVersion(data.version);
  // Immediately broadcast change to all connected devices in real time
  broadcastDataUpdate(data);
}

export function createExpressApp() {
  const app = express();

  // Allow larger payloads for base64 photo sync
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // CORS headers
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    next();
  });

  // Static files for uploaded images if directory exists
  try {
    app.use('/uploads', express.static(UPLOADS_DIR));
  } catch (e) {
    // ignore
  }

  const router = express.Router();

  router.get('/', (req, res) => {
    res.json({
      status: 'online',
      environment: isVercel ? 'vercel' : 'node',
      timestamp: new Date().toISOString(),
      appName: 'Kadu Manutenções API'
    });
  });

  router.get('/status', (req, res) => {
    res.json({
      status: 'online',
      environment: isVercel ? 'vercel' : 'node',
      timestamp: new Date().toISOString(),
      appName: 'Kadu Manutenções'
    });
  });

  // Real-time synchronization state & version check
  router.get('/sync/version', (req, res) => {
    const db = readDb();
    const version = typeof db.version === 'number' ? db.version : getCurrentVersion();
    res.json({
      version,
      lastModified: db.lastModified || new Date().toISOString(),
      clients: getConnectedClientsCount(),
      timestamp: new Date().toISOString()
    });
  });

  // Server-Sent Events (SSE) stream for real-time live sync across devices
  router.get('/sync/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (typeof (res as any).flushHeaders === 'function') {
      (res as any).flushHeaders();
    }
    registerSseClient(res, readDb);
  });

  router.get('/data', (req, res) => {
    const data = readDb();
    if (!data.version) {
      data.version = getCurrentVersion();
    }
    res.json(data);
  });

  router.post('/reports', (req, res) => {
    const report = req.body;
    const db = readDb();
    
    if (!report.code) {
      const nextNum = (db.reports?.length || 0) + 1;
      report.code = `${String(nextNum).padStart(4, '0')}`;
    }
    if (!report.id) {
      report.id = `rel_${Date.now()}`;
    }
    report.updatedAt = new Date().toISOString();
    if (!report.createdAt) {
      report.createdAt = new Date().toISOString();
    }

    const existingIndex = db.reports.findIndex((r: any) => r.id === report.id);
    if (existingIndex >= 0) {
      db.reports[existingIndex] = report;
    } else {
      db.reports.unshift(report);
    }

    // Auto-register machine if not present
    if (report.machine && report.machine.name) {
      const machExists = db.machines.some((m: any) => m.name.toLowerCase() === report.machine.name.toLowerCase());
      if (!machExists) {
        db.machines.push({
          id: `maq_${Date.now()}`,
          name: report.machine.name,
          model: report.machine.model || '',
          serialNumber: report.machine.serialNumber || '',
          tag: report.machine.tag || '',
          clientName: report.client?.name || '',
          horometer: report.machine.horometer || '',
          location: report.machine.location || '',
          manufacturer: report.machine.manufacturer || ''
        });
      }
    }

    // Auto-register client if not present
    if (report.client && report.client.name) {
      const cliExists = db.clients.some((c: any) => c.name.toLowerCase() === report.client.name.toLowerCase());
      if (!cliExists) {
        db.clients.push({
          id: `cli_${Date.now()}`,
          name: report.client.name,
          document: report.client.document || '',
          phone: report.client.phone || '',
          address: report.client.address || '',
          contactPerson: report.client.contactPerson || ''
        });
      }
    }

    writeDb(db);
    res.json({ success: true, report });
  });

  router.delete('/reports/:id', (req, res) => {
    const { id } = req.params;
    const db = readDb();
    db.reports = db.reports.filter((r: any) => r.id !== id);
    writeDb(db);
    res.json({ success: true, id });
  });

  router.post('/machines', (req, res) => {
    const machine = req.body;
    const db = readDb();
    if (!machine.id) {
      machine.id = `maq_${Date.now()}`;
    }
    const idx = db.machines.findIndex((m: any) => m.id === machine.id);
    if (idx >= 0) {
      db.machines[idx] = machine;
    } else {
      db.machines.unshift(machine);
    }
    writeDb(db);
    res.json({ success: true, machine });
  });

  router.delete('/machines/:id', (req, res) => {
    const { id } = req.params;
    const db = readDb();
    db.machines = db.machines.filter((m: any) => m.id !== id);
    writeDb(db);
    res.json({ success: true, id });
  });

  router.post('/clients', (req, res) => {
    const client = req.body;
    const db = readDb();
    if (!client.id) {
      client.id = `cli_${Date.now()}`;
    }
    const idx = db.clients.findIndex((c: any) => c.id === client.id);
    if (idx >= 0) {
      db.clients[idx] = client;
    } else {
      db.clients.unshift(client);
    }
    writeDb(db);
    res.json({ success: true, client });
  });

  router.delete('/clients/:id', (req, res) => {
    const { id } = req.params;
    const db = readDb();
    db.clients = db.clients.filter((c: any) => c.id !== id);
    writeDb(db);
    res.json({ success: true, id });
  });

  router.post('/settings', (req, res) => {
    const newSettings = req.body;
    const db = readDb();
    if (newSettings.companySettings) {
      db.companySettings = { ...db.companySettings, ...newSettings.companySettings };
    }
    if (newSettings.technicians) {
      db.technicians = newSettings.technicians;
    }
    if (newSettings.assistants) {
      db.assistants = newSettings.assistants;
    }
    if (newSettings.checklistTemplate) {
      db.checklistTemplate = newSettings.checklistTemplate;
    }
    writeDb(db);
    res.json({ success: true, data: db });
  });

  router.post('/upload', (req, res) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: 'No image data provided' });
      }

      // Return base64 URL directly for 100% cloud, Vercel and custom domain portability
      // This prevents broken images when running on ephemeral serverless containers
      return res.json({ success: true, url: imageBase64 });
    } catch (err: any) {
      console.error('Upload error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Mount API router strictly on /api
  app.use('/api', router);

  return app;
}
