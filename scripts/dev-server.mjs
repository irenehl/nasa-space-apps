import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

const ROOT = process.cwd();
const PORT = Number(process.env.PORT || 4173);
const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = resolve(ROOT, `.${pathname === '/' ? '/index.html' : pathname}`);
    const isHidden = pathname.split('/').some((segment) => segment.startsWith('.'));
    if (!file.startsWith(ROOT + sep) || isHidden) {
      response.writeHead(403).end();
      return;
    }
    const body = await readFile(file);
    response
      .writeHead(200, {
        'Content-Type': CONTENT_TYPES[extname(file)] || 'application/octet-stream',
        'Cache-Control': 'no-store',
      })
      .end(body);
  } catch {
    response.writeHead(404).end('Not found');
  }
});

server.listen(PORT, '127.0.0.1', () => console.log(`http://127.0.0.1:${server.address().port}`));
