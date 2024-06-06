import { IncomingMessage, ServerResponse } from 'http';
import {
  isValidSteamWishlist,
  addSteamGameDetailsToStore,
  WishlistResponse,
} from '../helpers';
import { host, port } from '../server';
import { crawlEpicGames } from '../scraper/main';

export const handleSearchRequest = async (
  req: IncomingMessage,
  res: ServerResponse
) => {
  const url = new URL(`http://${host}:${port}${req.url}`);
  const steamId = url.searchParams.get('steamId');

  try {
    //?? const userId = '76561198067142342';
    const response: Response = await fetch(
      `https://store.steampowered.com/wishlist/profiles/${steamId}/wishlistdata/?p=0`
    );
    const wishlistData: WishlistResponse = await response.json();

    if (!isValidSteamWishlist(wishlistData)) {
      // need to inform user in client
      console.info(
        'No wishlist found for this id. Double-check the id and make sure your Steam account is set to public.'
      );
    } else {
      await addSteamGameDetailsToStore(wishlistData);
      await crawlEpicGames(wishlistData);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      // const allGames: GameInfo[] = Array.from(map.values());
      // TODO: map the full prospectorStore in the JSON response
      res.end(JSON.stringify([]));
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
