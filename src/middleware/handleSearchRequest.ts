import { IncomingMessage, ServerResponse } from 'http';
import { isValidSteamWishlist, storeWishlistData } from '../helpers';
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

    if (!isValidSteamWishlist(data)) {
      // need to inform user in client
      console.info(
        'No wishlist found for this id. Double-check the id and make sure your Steam account is set to public.'
      );
    } else {
      await storeWishlistData(data);
      const steamDataset = await Dataset.open('steam');
      const steamData = await steamDataset.getData();
      const wishlist = steamData.items.map((game) => game.name);

      //? turn off for developing UI
      // await crawlEpicGames(wishlist);

      const epicDataset = await Dataset.open('epic');
      const epicData = await epicDataset.getData();

      // TODO: now I have to match up and assemble games with same name to price
      // const output = [
      //   {
      //     name: 'dark souls',
      //     steam: {
      //       price: '39.99',
      //     },
      //     epic: {
      //       price: 'CZK 800',
      //       url: 'fromsoftware.com'
      //     }
      //   },
      // ]

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(epicData));
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
