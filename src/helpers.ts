import { KeyValueStore, log } from 'crawlee';
import { Page } from 'playwright';

// await page.pause(); //!! debugging
// npx playwright codegen {url} //!! locator generator

export type WishlistResponse = Record<AppId, any>;

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

interface GameData {
  name: string;
  developers: string[];
  publishers: string[];
  price_overview: PriceOverview;
  release_date: ReleaseDate;
}
type AppDetails = { data: GameData };
type AppId = string;
type AppDetailsResponse = Record<AppId, AppDetails>;

export interface GameDetails {
  id: string;
  name: string;
  price: string | undefined;
  url: string;
  developers: string[];
  publishers: string[];
  releaseDate: string;
}

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

export async function getEpicStorePrice(page: Page): Promise<string> {
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
  console.log('prices: ', prices);
  // maybe if the length of discountedPrice is excessive, it tells us its matching some large string,
  // and we should just use originalPrice instead

  return discountedPrice ?? originalPrice;
}

export const addSteamGameDetailsToStore = async (
  wishlist: WishlistResponse
): Promise<void> => {
  const appIds = Object.keys(wishlist);
  const devSample = appIds.slice(0, 10);

  // ? for dev but should loop appIds
  for await (const appId of devSample) {
    try {
      const response: Response = await fetch(
        `https://store.steampowered.com/api/appdetails?appids=${appId}`
      );
      const jsonResponse: AppDetailsResponse = await response.json();
      const gameData = Object.values(jsonResponse)[0]?.data;

      const { name, developers, publishers, price_overview, release_date } =
        gameData;

      const currentPrice = price_overview?.final_formatted ?? '';

      const releaseDate =
        new Date(release_date?.date.concat(' UTC'))
          .toISOString()
          .substring(0, 10) ?? '';

      const gameDetails: GameDetails = {
        id: appId,
        name,
        price: currentPrice,
        url: `https://store.steampowered.com/app/${appId}`,
        developers,
        publishers,
        releaseDate,
      };

      const store = await KeyValueStore.open('prospectorStore');
      await store.setValue(appId, { id: appId, steam: gameDetails });
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

// TODO: this is too precise and gives too many false negatives when data isn't perfectly aligned
export const validateMatch = (steam: GameDetails, epic: GameDetails) => {
  if (!steam.developers.includes(epic.developers[0])) {
    return false;
  }

  if (!steam.publishers.includes(epic.publishers[0])) {
    return false;
  }

  if (steam.releaseDate !== epic.releaseDate) {
    return false;
  }

  return true;
};
