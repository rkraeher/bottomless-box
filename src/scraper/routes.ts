import {
  Request,
  Log,
  createPlaywrightRouter,
  handleRequestTimeout,
} from 'crawlee';
import { Page } from 'playwright';
import { getEpicStorePrice, getUrlQueryParam, partialMatch } from '../helpers';

export interface UserData {
  game: string;
}
interface DetailRouteHandler {
  request: Request<UserData>;
  page: Page;
  log: Log;
}

export const router = createPlaywrightRouter();

router.addHandler(
  'DETAIL',
  async ({ request, page, log }: DetailRouteHandler) => {
    log.debug(`Checking detail page for ${request.url}`);

    await getEpicStorePrice(page, request);
  }
);

router.addDefaultHandler(async ({ request, page, log, enqueueLinks }) => {
  const queriedGame = getUrlQueryParam(request.url);
  log.debug(`Getting price for wishlist item: ${queriedGame}`);

  const isGameNotFound = await page
    .getByText('No results found')
    .textContent()
    .catch((e) => log.error(e));

  if (isGameNotFound) return;

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
      .getByLabel(/Base Game|Add-On/)
      .first()
      // TODO: improve. first() it could be wrong because it could some Add-On, not the Base Game
      //e.g. Alan Wake 'https://store.epicgames.com/en-US/browse?q=Alan%20Wake&sortBy=relevancy&sortDir=DESC&count=40'
      .getAttribute('href')
      .catch((e) => log.error(e))) ?? '';

  const regex = new RegExp(link);

  const userData: UserData = {
    game: foundGame,
  };

  await enqueueLinks({
    regexps: [regex],
    label: 'DETAIL',
    userData,
  });
});
