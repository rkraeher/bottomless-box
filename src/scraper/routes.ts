import {
  Request,
  Log,
  createPlaywrightRouter,
  handleRequestTimeout,
  KeyValueStore,
} from 'crawlee';
import { Page } from 'playwright';
import {
  GameDetails,
  getEpicStorePrice,
  getUrlQueryParam,
  partialMatch,
  validateMatch,
} from '../helpers';

export interface UserData {
  id: string;
  game: string;
}
interface DetailRouteHandler {
  request: Request<UserData>;
  page: Page;
  log: Log;
}

interface Listings {
  steam: GameDetails;
  epic: GameDetails;
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
    id: request.userData.id,
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

    const prospectorStore = await KeyValueStore.open('prospectorStore');
    const listing: Listings | null = await prospectorStore.getValue(
      request.userData.id
    );
    const steamListing = listing?.steam;

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

    const epicStoreDetails = {
      developer: developer ?? '',
      publisher: publisher ?? '',
      releaseDate: formattedReleaseDate ?? '',
      userData: request.userData,
    };

    if (steamListing) {
      const isExactMatch = validateMatch(steamListing, epicStoreDetails);

      if (isExactMatch) {
        // ? just for testing. instead, getEpicStorePrice from here and update the store inside that fn
        await prospectorStore.setValue(request.userData.id, {
          ...listing,
          epic: epicStoreDetails,
        });
      }
    }

    console.log({ epicStoreDetails });
    console.log('steam listing: ', steamListing);
    // move me up inside the isExactMatch block
    await getEpicStorePrice(page, request);
  }
);
