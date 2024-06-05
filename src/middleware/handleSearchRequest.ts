import { IncomingMessage, ServerResponse } from 'http';
import {
  Game,
  GameInfo,
  isValidSteamWishlist,
  mergeGameInfo,
  createSteamWishlistDataset,
  getGames,
} from '../helpers';
import { host, port } from '../server';
import { crawlEpicGames } from '../scraper/main';

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
      const steamGames = await getGames('steam');

      // await crawlEpicGames(steamGames);
      // const epicGames = await getGames('epic');

      const map = new Map();
      mergeGameInfo(map, steamGames, 'steam');
      // mergeGameInfo(map, epicGames, 'epic');

      const allGames: GameInfo[] = Array.from(map.values());

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(allGames));
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
