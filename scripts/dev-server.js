/**
 * Node server for the Changi Off-Airport Check-In replica.
 *
 * Zero dependencies: only Node's built-in modules. It does three things:
 *   1. serves the site (HTML, CSS, JS, JSON, images, fonts) from this folder
 *   2. maps clean URLs to pages:  /faq  ->  faq/index.html
 *   3. refuses everything that is not part of the site (docs, tools, .git, this file)
 *
 * Run:  npm start            (http://localhost:3000)   [from the project folder]
 *       PORT=8080 npm start  (another port)
 *       HOST=0.0.0.0 npm start  (reachable from other devices on your network)
 *
 * Backend developers: add API routes in the `routes` table below, or replace this file with
 * the real stack. The pages only talk to the backend through replica/js/models/api.js.
 */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..'); // the site folder (one level up from scripts/)
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '127.0.0.1';

// Only these top-level entries are public. Anything else (docs, tools, .git, server.js) gets a 404.
const PUBLIC = new Set([
  'index.html',
  '_next',
  'booking-baggage',
  'booking-contact',
  'booking-details',
  'booking-review',
  'data',
  'faq',
  'files',
  'flags',
  'follow-us',
  'icons',
  'images',
  'manage-booking-pin',
  'replica',
]);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.txt': 'text/plain; charset=utf-8',
};

/**
 * Optional API routes (none today; the replica mocks everything in replica/js/models/api.js).
 * Example:  'POST /api/bookings': (req, res) => { ...; sendJson(res, 201, { ok: true }); }
 */
const routes = {};

const sendJson = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
};

const notFound = (res) => {
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('404 Not found');
};

/** Turns a URL path into a file path inside ROOT, or null when it must not be served. */
function resolveFile(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    return null;
  }
  if (decoded.includes('\0')) return null;

  const clean = path.posix.normalize(decoded).replace(/^\/+/, '');
  const top = clean.split('/')[0];
  if (clean && !PUBLIC.has(top)) return null;

  let file = path.join(ROOT, clean);
  if (file !== ROOT && !file.startsWith(ROOT + path.sep)) return null; // path traversal guard

  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  else if (!path.extname(file) && fs.existsSync(file + '/index.html')) file = path.join(file, 'index.html'); // /faq
  return fs.existsSync(file) && fs.statSync(file).isFile() ? file : null;
}

const server = http.createServer((req, res) => {
  const { pathname } = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  const handler = routes[`${req.method} ${pathname}`];
  if (handler) return handler(req, res);

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' });
    return res.end();
  }

  // Pages live in folders: send /faq to /faq/ so relative behaviour matches the static layout.
  const folder = pathname.replace(/\/+$/, '');
  if (!pathname.endsWith('/') && !path.extname(pathname) && PUBLIC.has(folder.split('/')[1] || '') && resolveFile(pathname)) {
    res.writeHead(301, { Location: `${pathname}/` });
    return res.end();
  }

  const file = resolveFile(pathname);
  if (!file) return notFound(res);

  const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
  // No caching in development, so edits show on refresh. Fonts and images may be cached.
  const cache = /\.(woff2?|png|jpe?g|webp|svg|gif)$/i.test(file) ? 'public, max-age=3600' : 'no-cache';
  res.writeHead(200, { 'Content-Type': type, 'Cache-Control': cache });
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(file).pipe(res);
});

server.listen(PORT, HOST, () => {
  console.log(`Changi OACI replica running at http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  console.log(`Jump to any step with ?preview=1, e.g. http://localhost:${PORT}/booking-review/?preview=1`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Try:  PORT=${PORT + 1} npm start`);
  } else {
    console.error(err);
  }
  process.exit(1);
});
