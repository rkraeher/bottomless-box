import { Dataset, Request } from 'crawlee';
import { Page } from 'playwright';

// await page.pause(); //!! debugging
// npx playwright codegen {url} //!! locator generator

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
