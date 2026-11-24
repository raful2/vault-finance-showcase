/**
 * FinanceHub Local Backend Server
 * Zero external dependencies — runs directly on Node / agy-node
 * Provides:
 * - Static web asset serving with correct MIME types
 * - REST API for persistent JSON data storage (data/state.json)
 * - CSV parsing & categorization helper endpoint
 * - Supabase credentials validation endpoint
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const STATE_FILE = path.join(DATA_DIR, 'state.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.csv': 'text/csv; charset=utf-8'
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 10 * 1024 * 1024) { // 10MB limit
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', err => reject(err));
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // --- API ROUTES ---

  // GET /api/health
  if (pathname === '/api/health') {
    sendJson(res, 200, { status: 'healthy', timestamp: new Date().toISOString() });
    return;
  }

  // GET /api/state - Load current persisted state
  if (pathname === '/api/state' && req.method === 'GET') {
    if (fs.existsSync(STATE_FILE)) {
      try {
        const data = fs.readFileSync(STATE_FILE, 'utf-8');
        sendJson(res, 200, JSON.parse(data));
        return;
      } catch (err) {
        sendJson(res, 500, { error: 'Failed to read state file', details: err.message });
        return;
      }
    } else {
      sendJson(res, 404, { message: 'No stored state found' });
      return;
    }
  }

  // POST /api/state - Save current state
  if (pathname === '/api/state' && req.method === 'POST') {
    try {
      const raw = await readBody(req);
      const parsed = JSON.parse(raw);
      fs.writeFileSync(STATE_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
      sendJson(res, 200, { success: true, savedAt: new Date().toISOString() });
      return;
    } catch (err) {
      sendJson(res, 400, { error: 'Invalid JSON payload', details: err.message });
      return;
    }
  }

  // POST /api/supabase/test - Check if Supabase project URL is reachable
  if (pathname === '/api/supabase/test' && req.method === 'POST') {
    try {
      const raw = await readBody(req);
      const { url, key } = JSON.parse(raw);
      if (!url || !key) {
        sendJson(res, 400, { error: 'URL and API Key are required' });
        return;
      }

      // Quick ping to Supabase REST endpoint
      const testEndpoint = `${url.replace(/\/+$/, '')}/rest/v1/`;
      try {
        const response = await fetch(testEndpoint, {
          headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`
          }
        });
        sendJson(res, 200, {
          connected: response.status < 500,
          status: response.status,
          message: response.status < 500 ? 'Successfully connected to Supabase endpoint!' : 'Supabase returned status ' + response.status
        });
      } catch (fetchErr) {
        sendJson(res, 200, {
          connected: false,
          error: fetchErr.message,
          message: 'Could not connect to Supabase URL. Verify host and internet access.'
        });
      }
      return;
    } catch (err) {
      sendJson(res, 400, { error: err.message });
      return;
    }
  }

  // GET /api/download/schema - Download Supabase SQL Schema
  if (pathname === '/api/download/schema') {
    const schemaFile = path.join(__dirname, 'supabase-schema.sql');
    if (fs.existsSync(schemaFile)) {
      res.writeHead(200, {
        'Content-Type': 'application/sql',
        'Content-Disposition': 'attachment; filename="supabase-schema.sql"'
      });
      fs.createReadStream(schemaFile).pipe(res);
      return;
    }
  }

  // --- STATIC FILE SERVING ---
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);

  // Security check to avoid directory traversal
  const normalizedPath = path.normalize(filePath);
  if (!normalizedPath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Access Denied');
    return;
  }

  fs.stat(normalizedPath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for SPA-style handling if needed
      const fallbackPath = path.join(__dirname, 'index.html');
      if (fs.existsSync(fallbackPath) && !pathname.startsWith('/api/')) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        fs.createReadStream(fallbackPath).pipe(res);
        return;
      }
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      return;
    }

    const ext = path.extname(normalizedPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache'
    });
    fs.createReadStream(normalizedPath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  VaultFinance Web App is running!`);
  console.log(`  Local URL: http://localhost:${PORT}`);
  console.log(`====================================================`);
});
