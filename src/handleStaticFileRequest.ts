import { IncomingMessage, ServerResponse } from 'http';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

interface Sub {
  price: string;
}

interface Game {
  name: string;
  subs: Sub[] | [];
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const handleStaticFileRequest = async (
  req: IncomingMessage,
  res: ServerResponse
) => {
  const validPaths: Record<string, { file: string; contentType: string }> = {
    '/': { file: 'index.html', contentType: 'text/html' },
    '/index.html': { file: 'index.html', contentType: 'text/html' },
    '/styles.css': { file: 'styles.css', contentType: 'text/css' },
    '/script.js': { file: 'script.js', contentType: 'text/javascript' },
  };

  const requestedPath = req.url || '/';
  const validPath = validPaths[requestedPath];

  if (validPath) {
    const filePath = path.join(__dirname, validPath.file);
    res.setHeader('Content-Type', validPath.contentType);

    try {
      const contents = await fs.readFile(filePath);
      res.writeHead(200);
      res.end(contents);
    } catch (err: any) {
      console.error('Error: ', err);
    }
  } else {
    handleNotFound(res);
  }
};

const handleNotFound = (res: ServerResponse) => {
  res.writeHead(404);
  res.end('Not Found');
};
