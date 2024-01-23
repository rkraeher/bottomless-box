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

  const results = {
    // perhaps it would be best to also save the associated steam name. better than matching strings
    name: await page.getByTestId('offer-title-info-title').textContent(),
    url: request.url,
    price,
  };

  const dataset = await Dataset.open('epic');
  await dataset.pushData(results);
}

export const storeWishlistData = async (
  wishlist: WishlistResponse
): Promise<void> => {
  const dataset = await Dataset.open('steam');
  const gameData: SteamGamePrice[] = Object.values(wishlist).map((game) => {
    // if game.subs is empty array, then its either free or coming soon and we should include this info in case it isn't free or is available elsewhere
    const price = game.subs?.[0]?.price;
    const formattedPrice = isNaN(parseFloat(price))
      ? ''
      : (parseFloat(price) / 100).toFixed(2); // I should name this function because it manipulates a number that is actually currency

    return {
      // keep in mind the currency that is used. steam endpoint only includes number without currency
      name: game.name,
      price: formattedPrice,
    };
  });

  // without resetting the dataset, it will just append
  gameData.forEach(async (game) => {
    await dataset.pushData(game);
  });
};
