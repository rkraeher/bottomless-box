import { createPlaywrightRouter } from 'crawlee';
import { getPrice, getUrlQueryParam } from '../helpers';

// in this iteration, playwright is overkill because we are just crawling specific urls
export const router = createPlaywrightRouter();

router.addDefaultHandler(async ({ request, page, log }) => {
  const game = getUrlQueryParam(request.url);
  log.debug(`Getting price for wishlist item: ${game}`);
  await getPrice(page, request);
});
