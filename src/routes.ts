import { createPlaywrightRouter, Dataset } from 'crawlee';
import { Page } from 'playwright';

export const router = createPlaywrightRouter();

// This replaces the request.label === DETAIL branch of the if clause.
// router.addHandler('DETAIL', async ({ request, page, log }) => {
//   log.debug(`Extracting data: ${request.url}`);
//   const urlPart = request.url.split('/').slice(-1); // ['sennheiser-mke-440-professional-stereo-shotgun-microphone-mke-440']
//   const manufacturer = urlPart[0].split('-')[0]; // 'sennheiser'

//   const title = await page.locator('.product-meta h1').textContent();
//   const sku = await page.locator('span.product-meta__sku-number').textContent();

//   const priceElement = page
//     .locator('span.price')
//     .filter({
//       hasText: '$',
//     })
//     .first();

//   const currentPriceString = await priceElement.textContent();
//   const rawPrice = currentPriceString.split('$')[1];
//   const price = Number(rawPrice.replaceAll(',', ''));

//   const inStockElement = page
//     .locator('span.product-form__inventory')
//     .filter({
//       hasText: 'In stock',
//     })
//     .first();

//   const inStock = (await inStockElement.count()) > 0;

//   const results = {
//     url: request.url,
//     manufacturer,
//     title,
//     sku,
//     currentPrice: price,
//     availableInStock: inStock,
//   };

//   log.debug(`Saving data: ${request.url}`);
//   await Dataset.pushData(results);
// });

// router.addHandler('CATEGORY', async ({ page, enqueueLinks, request, log }) => {
//   log.debug(`Enqueueing pagination for: ${request.url}`);
//   // We are now on a category page. We can use this to paginate through and enqueue all products,
//   // as well as any subsequent pages we find

//   await page.waitForSelector('.product-item > a');
//   await enqueueLinks({
//     selector: '.product-item > a',
//     label: 'DETAIL', // <= note the different label
//   });

//   // Now we need to find the "Next" button and enqueue the next page of results (if it exists)
//   const nextButton = await page.$('a.pagination__next');
//   if (nextButton) {
//     await enqueueLinks({
//       selector: 'a.pagination__next',
//       label: 'CATEGORY', // <= note the same label
//     });
//   }
// });

// This is a fallback route which will handle the start URL
router.addDefaultHandler(async ({ request, page, enqueueLinks, log }) => {
  const searchInput = 'input[placeholder="Search store"]';

  const searchTerm = 'Disciples II'; // exists and has two results
  // const searchTerm = 'Papers, please'; // not found, so the shape of the dom is different,

  const searchResultsContainer = 'div[data-tippy-root] ul';

  await page.fill(searchInput, searchTerm);
  await page.waitForSelector(searchResultsContainer);

  // TODO: get the full list of items
  const listOfItems = await page
    .locator(searchResultsContainer)
    .getByRole('listitem')
    // works when the game is found, but need a different locator for the case that the search term has no results
    .allTextContents();
  console.log({ listOfItems });

  enqueueLinks();
});

// for testing selectors
const testSelector = async (selector: string, page: Page) => {
  const targetedSelector = page.locator(selector);
  await targetedSelector.waitFor();
  if (targetedSelector) {
    console.log('Targeted selector found: ', targetedSelector);
  } else {
    console.log('Targeted selector was NOT found');
  }
};
