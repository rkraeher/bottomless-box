import { KeyValueStore, PlaywrightCrawler } from 'crawlee';
import { router } from './routes';

type Game = {
  [key: string]: string;
};

const wishlist: Game[] = (await KeyValueStore.getInput()) ?? [];
const games = wishlist.map((game) => Object.keys(game)[0]);

const requests = games.map(
  (game) =>
    `https://store.epicgames.com/en-US/browse?q=${encodeURIComponent(
      game
    )}&sortBy=relevancy&sortDir=DESC&count=40`
);

const crawler = new PlaywrightCrawler({
  // headless: false,
  maxRequestsPerCrawl: 20,
  requestHandler: router,
});

await crawler.run(requests);
