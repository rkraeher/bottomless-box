import { Dataset, Request } from 'crawlee';
import { Page } from 'playwright';

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

interface SteamGamePrice {
  name: string;
  price: string;
}

export interface Game {
  uniqueKey: string;
  name: string;
  price: string;
  url?: string;
}

interface GameInfo {
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

// getEpicStorePrice
export async function getPrice(page: Page, request: Request) {
  const price = await page
    .locator('span')
    .filter({ hasText: /CZK|\$/ })
    .first()
    .textContent();

  //!! this is actually returning the full price, not the currently on sale price.
  // to fix that, we should check for text related to 'sale ends', -50%, and use the lower numeric value of multiple matched price strings (420 > 210)
  // fortunately, looks like steam subs[0].price property uses the actual, discounted price

  const results = {
    name: await page.getByTestId('offer-title-info-title').textContent(),
    uniqueKey: request.uniqueKey,
    url: request.url,
    price,
  };

  const dataset = await Dataset.open('epic');
  await dataset.pushData(results);
}

export const storeWishlistData = async (
  wishlist: WishlistResponse
): Promise<void> => {
  const existingDataset = await Dataset.open('steam');
  await existingDataset.drop(); // reset the dataset, otherwise it will append. alternatively we could implement some dedupping logic
  const dataset = await Dataset.open('steam');

  const gameData: SteamGamePrice[] = Object.values(wishlist).map((game) => {
    // if game.subs is empty array, then its either free or coming soon and we should include this info in case it isn't free or is available elsewhere
    const price = game.subs?.[0]?.price;
    const formattedPrice = isNaN(parseFloat(price))
      ? ''
      : (parseFloat(price) / 100).toFixed(2); // I should name this function because it manipulates a number that is actually currency.

    return {
      // keep in mind the currency that is used. steam wishlist endpoint only includes number without currency
      name: game.name,
      uniqueKey: game.name,
      price: formattedPrice,
    };
  });

  await dataset.pushData(gameData);
};

const partialMatch = (title1: string, title2: string): boolean => {
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
const gameTitle1 = 'The Legend of Zelda: Breath of the Wild';
const gameTitle2 = 'Zelda Breath Wild Legend';

const isPartialMatch = partialMatch(gameTitle1, gameTitle2);

// console.log(`Are titles partially matched? ${isPartialMatch}`);
