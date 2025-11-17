import http, { IncomingMessage, ServerResponse } from 'http';
import { handleStaticFileRequest } from './middleware/handleStaticFileRequest.js';
import { handleSearchRequest } from './middleware/handleSearchRequest.js';

export const port = process.env.PORT ? Number(process.env.PORT) : 8000;

const requestListener = async (req: IncomingMessage, res: ServerResponse) => {
  if (req.url?.startsWith('/search')) {
    await handleSearchRequest(req, res);
  } else {
    await handleStaticFileRequest(req, res);
  }
};

const server = http.createServer(requestListener);
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
