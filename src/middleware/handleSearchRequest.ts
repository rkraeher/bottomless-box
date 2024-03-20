import { IncomingMessage, ServerResponse } from 'http';
import {
  Game,
  GameInfo,
  isValidSteamWishlist,
  mergeGameInfo,
  createSteamWishlistDataset,
} from '../helpers';
import { host, port } from '../server';
import { crawlEpicGames } from '../scraper/main';
import { Dataset } from 'crawlee';

export const handleSearchRequest = async (
  req: IncomingMessage,
  res: ServerResponse
) => {
  const url = new URL(`http://${host}:${port}${req.url}`);
  const steamId = url.searchParams.get('steamId');

  // TODO: instead of running the scraper on request, after the first time, I can cache the results and run the scraper once a day. Then add some 'refresh' feature

  try {
    //?? const userId = '76561198067142342';
    const steamWishlistEndpoint = `https://store.steampowered.com/wishlist/profiles/${steamId}/wishlistdata/?p=0`;
    const response = await fetch(steamWishlistEndpoint);
    const data = await response.json();

    if (!isValidSteamWishlist(data)) {
      // need to inform user in client
      console.info(
        'No wishlist found for this id. Double-check the id and make sure your Steam account is set to public.'
      );
    } else {
      await createSteamWishlistDataset(data);
      const steamDataset = await Dataset.open('steam');
      const steamData = await steamDataset.getData();
      const steamGames = steamData.items as Game[];

      const wishlist: string[] = steamGames.map((game) => game.name);
      //? turn off for developing UI
      await crawlEpicGames(wishlist);

      const epicDataset = await Dataset.open('epic');
      const epicData = await epicDataset.getData();
      const epicGames = epicData.items as Game[];

      const map = new Map();
      mergeGameInfo(map, steamGames, 'steam');
      mergeGameInfo(map, epicGames, 'epic');

      const allGames: GameInfo[] = Array.from(map.values());

      // TODO: sometimes the epic store will give search results for a completely different game (e.g., DREDGE query returns Dead by Daylight)
      // How should we account for these mismatches?
      // 1. the partial title match custom algo (helpers.ts)
      // *2. release date, publisher, and developer (all this data is available at the following steam endpoint: https://store.steampowered.com/api/appdetails?appids={APP_IDS}
      // * however, to use that endpoint and get release/publisher/developer data, I must call the endpoint one game at a time
      // * as that data is not going to change, I can store the results in some DB to avoid having to call the endpoint and getting throttled
      // * in order to get that data for an epic store game, I need to proceed into the game detail page, passing any ageCheck form, and scrape the data from that page

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(allGames));
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
