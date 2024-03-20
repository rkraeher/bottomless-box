import { PlaywrightCrawler, log } from 'crawlee';
import { router } from './routes';

export const crawlEpicGames = async (games: string[]) => {
  // This is better set with CRAWLEE_LOG_LEVEL env var or a configuration option.
  log.setLevel(log.LEVELS.DEBUG);

  const requests = games.map((game) => ({
    url: `https://store.epicgames.com/en-US/browse?q=${encodeURIComponent(
      game
    )}&sortBy=relevancy&sortDir=DESC&count=40`,
    uniqueKey: game,
  }));

  const crawler = new PlaywrightCrawler({
    // headless: false,
    maxRequestsPerCrawl: 20,
    requestHandler: router,
    maxRequestRetries: 2,
    // failedRequestHandler
  });

  // ? for dev
  // await crawler.run([requests[0]]);
  await crawler.run([
    'https://store.epicgames.com/en-US/browse?q=Alan%20Wake&sortBy=relevancy&sortDir=DESC&count=40',
  ]);

  // const slicedRequests = requests.slice(0, 5);
  // await crawler.run(slicedRequests);

  // await crawler.run(requests);
};
