import { createPlaywrightRouter } from 'crawlee';
import { fillAgeCheckForm } from './helpers';

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

router.addHandler('GAME', async ({ request, page }) => {
  console.log(`The title of "${request.url}" is: `, await page.title());
  const isAgeCheckFormVisible = await page
    .locator('span')
    .filter({
      hasText:
        'contains content that is unrated and may not be appropriate for all ages.',
    })
    .isVisible();

  if (isAgeCheckFormVisible) {
    await fillAgeCheckForm(page);

    // then, do the same as below, in else block: getPrice()
    await page.pause(); //!! debugging
  } else {
    // get the price
  }
});

// handle the start URL
router.addDefaultHandler(async ({ request, page, enqueueLinks }) => {
  console.log(`Enqueuing search results: ${request.url}`);
  const gameName = 'Disciples II'; // exists and has two results. sometimes, the result will force you to enter a birthdate
  // const gameName = 'Papers, please'; // doesn't exist in their db, so the shape of the dom is different,

  await page.getByPlaceholder('Search store').fill(gameName);
  const selector = 'div[data-tippy-root] ul li a';
  await page.waitForSelector(selector);
  await enqueueLinks({
    selector,
    label: 'GAME',
  });
});
