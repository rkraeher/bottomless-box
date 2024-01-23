import http, { IncomingMessage, ServerResponse } from 'http';
import { handleStaticFileRequest } from './middleware/handleStaticFileRequest';
import { handleSearchRequest } from './middleware/handleSearchRequest';

// process.env
export const host = 'localhost';
export const port = 8000;

const requestListener = async (req: IncomingMessage, res: ServerResponse) => {
  if (req.url?.startsWith('/search')) {
    await handleSearchRequest(req, res);
  } else {
    await handleStaticFileRequest(req, res);
  }
};

const server = http.createServer(requestListener);
server.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}`);
});
