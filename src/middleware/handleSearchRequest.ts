import { IncomingMessage, ServerResponse } from 'http';
import { getSteamGamePrices, isValidSteamId } from '../helpers';
import { host, port } from '../server';
import { crawlEpicGames } from '../scraper/main';

export const handleSearchRequest = async (
  req: IncomingMessage,
  _res: ServerResponse
) => {
  if (req.method === 'GET' && req.url?.startsWith('/search')) {
    const url = new URL(`http://${host}:${port}${req.url}`);
    const steamId = url.searchParams.get('steamId');

    try {
      //?? const userId = '76561198067142342';
      const steamWishlistEndpoint = `https://store.steampowered.com/wishlist/profiles/${steamId}/wishlistdata/?p=0`;

      const response = await fetch(steamWishlistEndpoint);
      const data = await response.json();

      if (!isValidSteamId(data)) {
        // need to inform user in client
        console.info(
          'No wishlist found for this id. Double-check the id and make sure your Steam account is set to public.'
        );
      } else {
        const games = getSteamGamePrices(data).map(
          (game) => Object.keys(game)[0]
        );

        await crawlEpicGames(games);

        // TODO update UI table with results from datasets/default results
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }
};
