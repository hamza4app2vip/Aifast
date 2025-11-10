import http from 'http';
import { promises as fs } from 'fs';
import path from 'path';
import url from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.txt': 'text/plain; charset=utf-8',
  'default': 'application/octet-stream'
};

function safeJoin(base, target) {
  const targetPath = path.posix.normalize(target.replace(/\\/g, '/'));
  const resolved = path.resolve(base, '.' + path.sep + targetPath);
  if (!resolved.startsWith(path.resolve(base))) {
    throw new Error('Path traversal detected');
  }
  return resolved;
}

const server = http.createServer(async (req, res) => {
  try {
    const parsed = url.parse(req.url);
    let pathname = decodeURIComponent(parsed.pathname || '/');
    if (pathname.endsWith('/')) pathname += 'index.html';
    const filePath = safeJoin(__dirname, pathname);

    let data;
    try {
      data = await fs.readFile(filePath);
    } catch (e) {
      // fallback: if index.html doesn’t exist, try test-env.html for root
      if ((pathname === '/index.html' || pathname === '/')) {
        try {
          const alt = safeJoin(__dirname, 'test-env.html');
          data = await fs.readFile(alt);
          res.writeHead(200, {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-store'
          });
          res.end(data);
          return;
        } catch (_) {}
      }
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const type = mimeTypes[ext] || mimeTypes.default;
    res.writeHead(200, {
      'Content-Type': type,
      'Cache-Control': 'no-store'
    });
    res.end(data);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Server error: ' + err.message);
  }
});

server.listen(PORT, () => {
  console.log(`Static server running at http://localhost:${PORT}`);
  console.log('Serving current directory; dotfiles like .env are accessible in dev.');
});

