import http, { IncomingMessage, ServerResponse } from 'http';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const host = 'localhost';
const port = 8000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Sub {
  price: string;
}

interface Game {
  name: string;
  subs: Sub[] | [];
}

type WishlistResponse = Record<string, Game>;
type FailedSteamWishlistResponse = { success: 2 };

const isValidSteamId = (
  data: WishlistResponse | FailedSteamWishlistResponse
): boolean => !('success' in data);

const handleSearchRequest = async (
  req: IncomingMessage,
  _res: ServerResponse
) => {
  if (req.method === 'POST' && req.url === '/search') {
    let data = '';

    req.on('data', (chunk) => {
      data += chunk;
    });

    req.on('end', async () => {
      try {
        const parsedData = JSON.parse(data);
        // const userId = '76561198067142342';
        const steamWishlistEndpoint = `https://store.steampowered.com/wishlist/profiles/${parsedData.steamId}/wishlistdata/?p=0`;

        await fetch(steamWishlistEndpoint)
          .then((response) => response.json())
          .then((data) => {
            if (!isValidSteamId(data)) {
              console.info(
                'No wishlist found for this id. Double check the id and make sure your Steam account is set to public.'
              );
            } else {
              console.log('good steamId');
              // TODO process the data and pass it to the crawler
              // console.log(data);
            }
          });
      } catch (error) {
        console.error('Error:', error);
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
