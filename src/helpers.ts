import { Dataset, Request } from 'crawlee';
import { Page } from 'playwright';
import { WishlistResponse } from './server';

// await page.pause(); //!! debugging
// npx playwright codegen {url} //!! locator generator

interface Game {
  [name: string]: string;
}

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

export async function getPrice(page: Page, request: Request) {
  const price = await page
    .locator('span')
    .filter({ hasText: /CZK|\$/ })
    .first()
    .textContent();

  const results = {
    name: await page.getByTestId('offer-title-info-title').textContent(),
    url: request.url,
    price,
  };

  await Dataset.pushData(results);
}

const gefilteredWishlist = (wishlist: WishlistResponse) => {
  const games: Game[] = Object.values(wishlist).map((game) => {
    // if game.subs is empty array, then its either free or coming soon and we should include this info in case it isn't free or is available elsewhere
    const price = game.subs?.[0]?.price;
    const formattedPrice = isNaN(parseFloat(price))
      ? ''
      : (parseFloat(price) / 100).toFixed(2);

    return {
      // keep in mind the currency that is used. steam endpoint only includes number without currency
      [game.name]: formattedPrice,
    };
  });
  console.log(JSON.stringify(games));
};
