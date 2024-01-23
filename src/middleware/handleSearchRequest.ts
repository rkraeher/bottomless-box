import { IncomingMessage, ServerResponse } from 'http';
import { getSteamGamePrices, isValidSteamId } from '../helpers';
import { host, port } from '../server';
import { crawlEpicGames } from '../scraper/main';
import { Dataset } from 'crawlee';

export const handleSearchRequest = async (
  req: IncomingMessage,
  res: ServerResponse
) => {
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
      const output = await Dataset.getData();

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(output));
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
