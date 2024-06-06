import { PlaywrightCrawler, log } from 'crawlee';
import { router } from './routes';
import { WishlistResponse } from '../helpers';

type WishlistGames = Array<{ id: string; name: string }>;

export const crawlEpicGames = async (wishlist: WishlistResponse) => {
  // This is better set with CRAWLEE_LOG_LEVEL env var or a configuration option.
  log.setLevel(log.LEVELS.DEBUG);

  const gamesToQuery: WishlistGames = Object.entries(wishlist).map(
    ([id, game]) => ({
      id,
      name: game.name,
    })
  );

  const requests = gamesToQuery.map((game) => ({
    url: `https://store.epicgames.com/en-US/browse?q=${encodeURIComponent(
      game.name
    )}&sortBy=relevancy&sortDir=DESC&count=40`,
    userData: { id: game.id },
  }));

  const crawler = new PlaywrightCrawler({
    // headless: false,
    maxRequestsPerCrawl: 20,
    requestHandler: router,
    maxRequestRetries: 2,
    // failedRequestHandler
  });

  // ? for dev
  await crawler.run([requests[0]]);
  // await crawler.run([
  //   'https://store.epicgames.com/en-US/browse?q=Alan%20Wake&sortBy=relevancy&sortDir=DESC&count=40',
  // ]);

  const slicedRequests = requests.slice(10, 20);
  // await crawler.run(slicedRequests);

  // await crawler.run(requests);
};
