import { Dataset, Request, log } from 'crawlee';
import { Page } from 'playwright';
import { UserData } from './scraper/routes';

// await page.pause(); //!! debugging
// npx playwright codegen {url} //!! locator generator

interface Sub {
  price: string;
}

interface SteamGame {
  name: string;
  subs: Sub[] | [];
}

type WishlistResponse = Record<string, SteamGame>;
type FailedSteamWishlistResponse = { success: 2 };

interface PriceOverview {
  price_overview: {
    initial_formatted: string;
    final_formatted: string;
    discount_percent: number;
  };
}
interface AppDetails {
  data: PriceOverview;
}

type AppDetailsResponse = Record<string, AppDetails>;
interface SteamApiData {
  appId: string;
  uniqueKey: string;
  name: string;
  price: string;
}

export interface Game {
  uniqueKey: string;
  name: string;
  price: string;
  url?: string;
}

export interface GameInfo {
  key: string;
  steam?: Omit<Game, 'uniqueKey'>;
  epic?: Omit<Game, 'uniqueKey'>;
}

export type BaseMap = Map<string, GameInfo>;

export const mergeGameInfo = (
  baseMap: BaseMap,
  games: Game[],
  platformKey: 'steam' | 'epic'
) => {
  games.forEach((game) => {
    const existingInfo = baseMap.get(game.uniqueKey) ?? {
      key: game.uniqueKey,
    };
    baseMap.set(game.uniqueKey, {
      ...existingInfo,
      [platformKey]: {
        name: game.name,
        price: game.price,
        ...(platformKey === 'epic' && { url: game.url }),
      },
    });
  });
};

// we also should have some sanitization since it is user input
export const isValidSteamWishlist = (
  data: WishlistResponse | FailedSteamWishlistResponse
): boolean => !('success' in data);

export function getUrlQueryParam(url: string): string {
  const queryParam = new URLSearchParams(new URL(url).search).get('q') ?? '';
  return decodeURIComponent(queryParam);
}

async function fillAgeCheckForm(page: Page) {
  await page.getByRole('button', { name: 'MM' }).click();
  await page.getByRole('menuitem', { name: '10' }).click();

  await page
    .getByTestId('AgeSelect')
    .getByRole('button', { name: 'DD' })
    .click();
  await page.getByRole('menuitem', { name: '20' }).click();

  await page.getByRole('button', { name: 'YYYY' }).click();
  await page.getByRole('menuitem', { name: '1989' }).click();

  await page.getByRole('button', { name: 'Continue' }).click();
}

export async function getEpicStorePrice(
  page: Page,
  request: Request<UserData>
) {
  const { game } = request.userData;

  const price = await page
    .locator('span')
    .filter({ hasText: /CZK|\$|\€/ })
    .allTextContents()
    .catch((e) => log.error(e));

  // TODO: if (price.length > 1) how to decide which one we use? Last item on array or somehow parse and use the smaller number?

  const results = {
    name: game,
    uniqueKey: request.uniqueKey,
    url: request.url,
    price,
  };

  const dataset = await Dataset.open('epic');
  await dataset.pushData(results);
}

export const createSteamWishlistDataset = async (
  wishlist: WishlistResponse
): Promise<void> => {
  const existingDataset = await Dataset.open('steam');
  await existingDataset.drop(); // reset the dataset, otherwise it will append
  const dataset = await Dataset.open('steam');

  const steamAppIds = Object.keys(wishlist).join(',');
  const steamAppDetailsEndpoint = `https://store.steampowered.com/api/appdetails?appids=${steamAppIds}&filters=price_overview`; // filters param must be set to price_overview when passing multiple appids
  const response = await fetch(steamAppDetailsEndpoint);
  const appDetails: AppDetailsResponse = await response.json();

  const gameData: SteamApiData[] = Object.entries(wishlist)
    .map(([steamAppId, wishlistData]) => {
      const matchingGameDetails = Object.entries(appDetails).find(
        ([appId]) => appId === steamAppId
      );

      if (matchingGameDetails) {
        const [appId, gameDetails] = matchingGameDetails;
        const currentPrice =
          gameDetails?.data?.price_overview?.final_formatted ?? '';

        return {
          appId,
          uniqueKey: wishlistData.name,
          name: wishlistData.name,
          price: currentPrice,
        };
      }
      return;
    })
    .filter((game): game is SteamApiData => game !== undefined);

  await dataset.pushData(gameData);
};

export const partialMatch = (title1: string, title2: string): boolean => {
  const normalize = (text: string) =>
    text
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
      .replace(/\b(?:and|or|the|of|in|with)\b/gi, '');

  const words1 = normalize(title1).split(/\s+/);
  const words2 = normalize(title2).split(/\s+/);

  const intersection = words1.filter((word) => words2.includes(word));

  const matchThreshold = Math.min(words1.length, words2.length) * 0.6;

  return intersection.length >= matchThreshold;
};

// Example usage
// const gameTitle1 = 'The Legend of Zelda: Breath of the Wild';
// const gameTitle2 = 'Zelda Breath Wild Legend';
// const isPartialMatch = partialMatch(gameTitle1, gameTitle2);
// returns true
