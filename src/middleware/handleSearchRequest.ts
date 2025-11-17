import { IncomingMessage, ServerResponse } from 'http';
import {
  isValidSteamWishlist,
  addSteamGameDetailsToStore,
  WishlistResponse,
} from '../helpers.js';
import { host, port } from '../server.js';
import { crawlEpicGames } from '../scraper/main';
import { KeyValueStore } from 'crawlee';
import sampleResults from '../../demo/sampleResults.js';

export const handleSearchRequest = async (
  req: IncomingMessage,
  res: ServerResponse
) => {
  const url = new URL(`http://${host}:${port}${req.url}`);
  const demoProfileId = '76561198768181711';
  const steamId = url.searchParams.get('steamId') || demoProfileId;
  // const getWishlistEndpoint = `https://api.steampowered.com/IWishlistService/GetWishlist/v1?steamid=${steamId}`;

  try {
    // const response: Response = await fetch(getWishlistEndpoint);

    // const data: WishlistResponse = await response.json();
    // const gameIds = data?.response?.items?.map((game) => String(game?.appid));

    // if (!gameIds?.length) {
    //   // need to inform user in client
    //   console.info(
    //     'No wishlist found for this id. Double-check the id and make sure your Steam account is set to public.'
    //   );
    // } else {
    // const prospectorStore = await KeyValueStore.open('prospectorStore');
    // await prospectorStore.drop(); // should drop the store

    // await addSteamGameDetailsToStore(gameIds);

    // const games: Array<Record<string, any>> = [];

    // await prospectorStore.forEachKey(async (gameId) => {
    //   const gameDetails: Record<string, any> | null =
    //     await prospectorStore.getValue(gameId);
    //   if (gameDetails) games.push(gameDetails);
    // });

    //** Temporarily disable the crawl for demo **
    // await crawlEpicGames(games);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    // res.end(JSON.stringify(games));
    res.end(JSON.stringify(sampleResults));
    // }
  } catch (error) {
    console.error('Error:', error);
  }
};
