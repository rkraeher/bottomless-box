import { Dataset, PlaywrightCrawler, log } from 'crawlee';
import { router } from './routes';
import { Game } from '../helpers';

export const crawlEpicGames = async (games: Game[]) => {
  // This is better set with CRAWLEE_LOG_LEVEL env var or a configuration option.
  log.setLevel(log.LEVELS.DEBUG);

  const requests = games.map((game) => ({
    url: `https://store.epicgames.com/en-US/browse?q=${encodeURIComponent(
      game.name
    )}&sortBy=relevancy&sortDir=DESC&count=40`,
    // can actually use game.primaryKey now
    userData: { primaryKey: game.name },
  }));

  const crawler = new PlaywrightCrawler({
    // headless: false,
    maxRequestsPerCrawl: 20,
    requestHandler: router,
    maxRequestRetries: 2,
    // failedRequestHandler
  });

  await Dataset.open('epic').then((dataset) => dataset.drop()); // reset the epic dataset before crawling

  // ? for dev
  await crawler.run([requests[0]]);
  // await crawler.run([
  //   'https://store.epicgames.com/en-US/browse?q=Alan%20Wake&sortBy=relevancy&sortDir=DESC&count=40',
  // ]);

  const slicedRequests = requests.slice(10, 20);
  // await crawler.run(slicedRequests);

  // await crawler.run(requests);
};
