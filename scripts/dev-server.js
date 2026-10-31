/**
 * Node server for the Changi Off-Airport Check-In replica.
 *
 * Zero dependencies: only Node's built-in modules. It does three things:
 *   1. serves views/, models/ and controllers/ at their own paths
 *   2. applies the rewrites in vercel.json, as Vercel does:  /faq/  ->  views/pages/faq/index.html,
 *      /icons/x.svg  ->  public/icons/x.svg  (public/ is served at the site root)
 *   3. refuses everything else (docs, tools, scripts, .git)
 *
 * Run:  npm start            (http://localhost:3000)   [from the project folder]
 *       PORT=8080 npm start  (another port)
 *       HOST=0.0.0.0 npm start  (reachable from other devices on your network)
 *
 * Backend developers: add API routes in the `routes` table below, or replace this file with
 * the real stack. The pages only talk to the backend through models/api.js.
 */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..'); // the site folder (one level up from scripts/)
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '127.0.0.1';

// Folders served at their own path. Everything else reaches the browser only through a rewrite in vercel.json
// (pages at their clean URLs, public/ at the site root), so docs, tools, scripts and .git get a 404.
const SERVED = new Set(['views', 'models', 'controllers']);

// The same rewrites Vercel uses, read from vercel.json so local and deployed URLs never drift apart.
const REWRITES = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8')).rewrites.map(({ source, destination }) => {
  const pattern = source.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\/:path\*$/, '(?:/(.*))?');
  return { re: new RegExp(`^${pattern}$`), destination };
});

/** Applies the first matching rewrite, e.g. /faq/ -> /views/pages/faq/index.html, /icons/x.svg -> /public/icons/x.svg */
function rewrite(urlPath) {
  for (const { re, destination } of REWRITES) {
    const m = urlPath.match(re);
    if (m) return destination.replace(':path*', m[1] || '');
  }
  return null;
}

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
 * Optional API routes (none today; the replica mocks everything in models/api.js).
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

  let clean = path.posix.normalize(decoded);
  if (!SERVED.has(clean.split('/')[1])) {
    const target = rewrite(clean);
    if (!target) return null;
    clean = target;
  }
  clean = clean.replace(/^\/+/, '');

  let file = path.join(ROOT, clean);
  if (!file.startsWith(ROOT + path.sep)) return null; // path traversal guard

  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
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

  // Like Vercel's trailingSlash: true, send /faq to /faq/.
  if (!pathname.endsWith('/') && !path.extname(pathname) && rewrite(`${pathname}/`)) {
    res.writeHead(308, { Location: `${pathname}/` + new URL(req.url, 'http://x').search });
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
