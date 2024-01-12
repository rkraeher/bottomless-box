import { createPlaywrightRouter } from 'crawlee';
import { fillAgeCheckForm, getPrice } from './helpers';

export const router = createPlaywrightRouter();

router.addHandler('GAME', async ({ request, page }) => {
  const isAgeCheckFormVisible = await page
    .locator('span')
    .filter({
      hasText:
        'contains content that is unrated and may not be appropriate for all ages.',
    })
    .isVisible();

  if (isAgeCheckFormVisible) {
    await fillAgeCheckForm(page);
    await getPrice(page, request);
  } else {
    await getPrice(page, request);
  }
});

router.addDefaultHandler(async ({ page, enqueueLinks }) => {
  // TODO pass game names as argument
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

// await page.pause(); //!! debugging
