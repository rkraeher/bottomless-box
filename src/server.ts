import http, { IncomingMessage, ServerResponse } from 'http';
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

export type WishlistResponse = Record<string, Game>;
type FailedSteamWishlistResponse = { success: 2 };

const host = 'localhost';
const port = 8000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// we also should have some sanitization since it is user input
const isValidSteamId = (
  data: WishlistResponse | FailedSteamWishlistResponse
): boolean => !('success' in data);

const handleSearchRequest = async (
  req: IncomingMessage,
  _res: ServerResponse
) => {
  if (req.method === 'GET' && req.url?.startsWith('/search')) {
    const url = new URL(`http://${host}:${port}${req.url}`);
    const steamId = url.searchParams.get('steamId');

    try {
      // const userId = '76561198067142342';
      const steamWishlistEndpoint = `https://store.steampowered.com/wishlist/profiles/${steamId}/wishlistdata/?p=0`;

      const response = await fetch(steamWishlistEndpoint);
      const data = await response.json();

      if (!isValidSteamId(data)) {
        // need to inform user in client
        console.info(
          'No wishlist found for this id. Double-check the id and make sure your Steam account is set to public.'
        );
      } else {
        console.log('good steamId');
        // TODO process the data and pass it to the crawler
        // console.log(data);
      }
    } catch (error) {
      console.error('Error:', error);
    }
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
    console.error('Error: ', err);
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
