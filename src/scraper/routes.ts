import { createPlaywrightRouter } from 'crawlee';
import { getPrice, getUrlQueryParam } from '../helpers';

export const router = createPlaywrightRouter();

router.addDefaultHandler(async ({ request, page, log }) => {
  const game = getUrlQueryParam(request.url);
  log.debug(`Getting price for wishlist item: ${game}`);
  await getPrice(page, request);
});
