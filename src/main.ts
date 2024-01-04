import { PlaywrightCrawler, log } from 'crawlee';
import { router } from './routes';

// log.setLevel(log.LEVELS.DEBUG);

// log.debug('Setting up crawler.');
const crawler = new PlaywrightCrawler({
  requestHandler: router,
  maxRequestsPerCrawl: 20,
  headless: false,
});

await crawler.run(['https://store.epicgames.com/en-US/']);
