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

// crawlee-specific object used to pass custom user-defined data
export interface UserData {
  id: string;
  name: string;
}
interface DetailRouteHandler {
  request: Request<UserData>;
  page: Page;
  log: Log;
}

interface Listings {
  id: string;
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
    id: request.userData.id,
    name: foundGame,
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

    const initialRelease = await page
      .getByText('Initial Release', { exact: true })
      .locator('+ div time')
      .getAttribute('datetime')
      .catch((e) => log.error(e));

    const releaseDate = await page
      .getByText('Release Date', { exact: true })
      .locator('+ div time')
      .getAttribute('datetime')
      .catch((e) => log.error(e));

    // alternatives we can use a regex for release, but we have to select first match

    const formattedReleaseDate = initialRelease
      ? initialRelease &&
        new Date(initialRelease).toISOString().substring(0, 10)
      : releaseDate && new Date(releaseDate).toISOString().substring(0, 10);

    const epicStoreDetails: GameDetails = {
      id: request.userData.id,
      name: request.userData.name,
      price: undefined,
      url: request.url,
      developers: [developer ?? ''],
      publishers: [publisher ?? ''],
      releaseDate: formattedReleaseDate ?? '',
    };

    if (steamListing) {
      const isExactMatch = validateMatch(steamListing, epicStoreDetails);
      const isDuplicate = listing.hasOwnProperty('epic');
      // const isDuplicate = listing?.epic?.id

      // if (isExactMatch && !isDuplicate) {
      const price = await getEpicStorePrice(page);

      await prospectorStore.setValue(request.userData.id, {
        ...listing,
        epic: { ...epicStoreDetails, price },
      });
      // }
    }
  }
);
