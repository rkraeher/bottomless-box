import { KeyValueStore, PlaywrightCrawler, log } from 'crawlee';
import { router } from './routes';

type Game = {
  [key: string]: string;
};

// This is better set with CRAWLEE_LOG_LEVEL env var or a configuration option.
log.setLevel(log.LEVELS.DEBUG);

const wishlist: Game[] = (await KeyValueStore.getInput()) ?? [];
const games = wishlist.map((game) => Object.keys(game)[0]);

const requests = games.map(
  (game) =>
    `https://store.epicgames.com/en-US/browse?q=${encodeURIComponent(
      game
    )}&sortBy=relevancy&sortDir=DESC&count=40`
);

log.debug('Setting up crawler.');
const crawler = new PlaywrightCrawler({
  // headless: false,
  maxRequestsPerCrawl: 20,
  requestHandler: router,
});

await crawler.run(requests);
