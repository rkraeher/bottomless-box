import { PlaywrightCrawler } from 'crawlee';
import { router } from './routes';

const crawler = new PlaywrightCrawler({
  headless: false,
  maxRequestsPerCrawl: 20,
  requestHandler: router,
});

await crawler.run(['https://store.epicgames.com/en-US/']);
