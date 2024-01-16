import http, { IncomingMessage, ServerResponse } from 'http';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const host = 'localhost';
const port = 8000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const handleSearchRequest = async (
  req: IncomingMessage,
  res: ServerResponse
) => {
  if (req.method === 'POST' && req.url === '/search') {
    let data = '';

    req.on('data', (chunk) => {
      data += chunk;
    });

    req.on('end', () => {
      try {
        const parsedData = JSON.parse(data);
        console.log('Received search input:', parsedData.searchText);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({ message: 'Search input received successfully' })
        );
      } catch (error) {
        console.error('Error parsing JSON:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON data' }));
      }
    });
  }
};

const handleStaticFileRequest = async (
  req: IncomingMessage,
  res: ServerResponse
) => {
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

const requestListener = async (req: IncomingMessage, res: ServerResponse) => {
  await handleSearchRequest(req, res);
  await handleStaticFileRequest(req, res);
};

const server = http.createServer(requestListener);
server.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}`);
});
