import {
  Request,
  Log,
  createPlaywrightRouter,
  handleRequestTimeout,
  Dataset,
} from 'crawlee';
import { Page } from 'playwright';
import { getEpicStorePrice, getUrlQueryParam, partialMatch } from '../helpers';

export interface UserData {
  primaryKey: string;
  game: string;
}
interface DetailRouteHandler {
  request: Request<UserData>;
  page: Page;
  log: Log;
}

export const router = createPlaywrightRouter();

router.addDefaultHandler(async ({ request, page, log, enqueueLinks }) => {
  const queriedGame = getUrlQueryParam(request.url);
  log.debug(`Getting price for wishlist item: ${queriedGame}`);

  const isNoResultsPage = await page
    .getByText('No results found')
    .textContent()
    .catch((e) => log.error(e));

  if (isNoResultsPage) return;

  const foundGame = await page
    .getByTestId('picture')
    .locator('img')
    .first()
    .getAttribute('alt')
    .catch((e) => log.error(e));

  if (!foundGame) return;

  const isPartialMatch = partialMatch(queriedGame, foundGame);

  if (!isPartialMatch) return;

  const link =
    (await page
      .getByLabel(/Base Game/)
      .first()
      .getAttribute('href')
      .catch((e) => log.error(e))) ?? '';

  const regex = new RegExp(link);

  const userData: UserData = {
    game: foundGame,
    primaryKey: request.userData.primaryKey,
  };

  await enqueueLinks({
    regexps: [regex],
    label: 'DETAIL',
    userData,
  });
});

router.addHandler(
  'DETAIL',
  async ({ request, page, log }: DetailRouteHandler) => {
    log.debug(`Checking detail page for ${request.url}`);
    // await validateMatch ...
    // 1. scrape the detail page for data: publishers, developers, and release date
    const developer = await page
      .getByText('Developer', { exact: true })
      .locator('+ div > span')
      .textContent()
      .catch((e) => log.error(e));

    const publisher = await page
      .getByText('Publisher', { exact: true })
      .locator('+ div > span')
      .textContent()
      .catch((e) => log.error(e));

    const initialReleaseDate = await page
      .getByText('Initial Release', { exact: true })
      .locator('+ div time')
      .getAttribute('datetime')
      .catch((e) => log.error(e));

    const formattedReleaseDate =
      initialReleaseDate &&
      new Date(initialReleaseDate).toISOString().substring(0, 10);

    const result = {
      developer,
      publisher,
      releaseDate: formattedReleaseDate,
      userData: request.userData,
    };

    console.log({ result });

    // 2. compare it against the matching game in the steam dataset and only scrape prices for those that are exact match
    // open the steam dataset
    // use the primaryKey (which I think we should now use appId instead of name) to find the
    await getEpicStorePrice(page, request);
  }
);
