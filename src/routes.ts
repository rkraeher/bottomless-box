import { createPlaywrightRouter } from 'crawlee';
import { getPrice } from './helpers';

export const router = createPlaywrightRouter();

router.addDefaultHandler(async ({ request, page }) => {
  await getPrice(page, request);
});

// TODO use logging methods, as in their example?
