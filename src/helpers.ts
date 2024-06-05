import { Dataset, Dictionary, Request, log } from 'crawlee';
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

export type WishlistResponse = Record<string, SteamGame>;
type FailedSteamWishlistResponse = { success: 2 };

interface PriceOverview {
  initial_formatted: string;
  final_formatted: string;
  discount_percent: number;
}

interface ReleaseDate {
  coming_soon: boolean;
  date: string;
}
interface AppDetails {
  data: {
    name: string;
    developers: string[];
    publishers: string[];
    price_overview: PriceOverview;
    release_date: ReleaseDate;
  };
}

type AppDetailsResponse = Record<string, AppDetails>;

export interface GameDetails {
  name: string;
  primaryKey: string;
  developers: string[];
  publishers: string[];
  price: string;
  releaseDate: string;
  appId: string;
}
export interface Game {
  primaryKey: string;
  name: string;
  price: string;
  url?: string;
}

export interface GameInfo {
  key: string;
  steam?: Omit<Game, 'primaryKey'>;
  epic?: Omit<Game, 'primaryKey'>;
}

export type BaseMap = Map<string, GameInfo>;

interface EpicGamesStoreListing {
  name: string;
  primaryKey: string;
  url: string;
  originalPrice: string;
  price: string;
}

export const mergeGameInfo = (
  baseMap: BaseMap,
  games: Game[],
  platformKey: 'steam' | 'epic'
) => {
  games.forEach((game) => {
    const existingInfo = baseMap.get(game.primaryKey) ?? {
      key: game.primaryKey,
    };

    baseMap.set(game.primaryKey, {
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
  const { primaryKey, game } = request.userData;

  const prices: string[] =
    (await page
      .locator('span')
      .filter({ hasText: /CZK|\$|\€|Free/ })
      .allTextContents()
      .catch((e) => log.error(e))) ?? [];

  // Edgecases
  // null (coming soon) price: https://store.epicgames.com/en-US/p/journey-to-the-west-7607ad
  // free price: https://store.epicgames.com/en-US/p/the-invincible-iron-ivyenter-the-pretty-pretty-princess-ed912d

  const [originalPrice, discountedPrice] = prices && prices.slice(0, 2);

  const result: EpicGamesStoreListing = {
    name: game,
    primaryKey,
    url: request.url,
    originalPrice,
    price: discountedPrice ?? originalPrice,
  };

  const dataset = await Dataset.open('epic');
  const isDuplicate = await dataset
    .getData()
    .then((data) => data.items.some((item) => item.primaryKey === primaryKey))
    .catch((e) => log.error(e));

  if (!isDuplicate) {
    await dataset.pushData(result);
  }
}

export const createSteamWishlistDataset = async (
  wishlist: WishlistResponse
): Promise<void> => {
  await Dataset.open('steam').then((dataset) => dataset.drop()); // reset the dataset, otherwise it will append
  const dataset = await Dataset.open('steam');

  const appIds = Object.keys(wishlist);
  const devSample = appIds.slice(0, 10);

  // ? for dev but should loop appIds
  for await (const appId of devSample) {
    try {
      const response: Response = await fetch(
        `https://store.steampowered.com/api/appdetails?appids=${appId}`
      );
      const data: AppDetailsResponse = await response.json();

      const gameDetails: GameDetails[] = Object.values(data).map((game) => {
        const { name, developers, publishers, price_overview, release_date } =
          game.data;

        const currentPrice = price_overview?.final_formatted ?? '';
        const releaseDate = release_date?.date ?? '';

        return {
          name,
          primaryKey: name,
          developers,
          publishers,
          price: currentPrice,
          releaseDate,
          appId,
        };
      });

      await dataset.pushData(gameDetails);
    } catch (e) {
      console.error(e);
    }
  }
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

export const getGames = async (key: string): Promise<GameDetails[]> => {
  const dataset: Dataset<GameDetails> = await Dataset.open(key);
  return (await dataset.getData()).items;
};
