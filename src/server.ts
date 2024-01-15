import http, { IncomingMessage, ServerResponse } from 'http';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const host = 'localhost';
const port = 8000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const requestListener = async (req: IncomingMessage, res: ServerResponse) => {
  let filePath = '';

  if (req.url === '/' || req.url === '/index.html') {
    filePath = path.join(__dirname, 'index.html');
    res.setHeader('Content-Type', 'text/html');
  } else if (req.url === '/styles.css') {
    filePath = path.join(__dirname, 'styles.css');
    res.setHeader('Content-Type', 'text/css');
  } else {
    res.writeHead(404);
    res.end('Not Found');
    return;
  }

  try {
    const contents = await fs.readFile(filePath);
    res.writeHead(200);
    res.end(contents);
  } catch (err: any) {
    res.writeHead(500);
    res.end(err.message);
  }
};

const server = http.createServer(requestListener);
server.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}`);
});
