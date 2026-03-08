export interface AuthData {
  cookie: string;
  auth: string;
  csrf: string;
  bookmarksApiId: string;
}

const BOOKMARKS_URL_PATTERN = /https:\/\/x\.com\/i\/api\/graphql\/([^/]+)\/Bookmarks\?/;

export function setupAuthCapture(): void {
  chrome.webRequest.onBeforeSendHeaders.addListener(
    (details): undefined => {
      if (!details.url.includes('x.com') && !details.url.includes('twitter.com')) {
        return;
      }

      chrome.storage.local.get(
        ['bookmarksApiId', 'cookie', 'csrf', 'auth'],
        (result) => {
          const match = details.url.match(BOOKMARKS_URL_PATTERN);
          if (match?.[1] && !result['bookmarksApiId']) {
            chrome.storage.local.set({ bookmarksApiId: match[1] });
          }

          const headers = details.requestHeaders;
          if (!headers) return;

          const auth = headers.find(h => h.name.toLowerCase() === 'authorization')?.value ?? '';
          const cookie = headers.find(h => h.name.toLowerCase() === 'cookie')?.value ?? '';
          const csrf = headers.find(h => h.name.toLowerCase() === 'x-csrf-token')?.value ?? '';

          if (!auth || !cookie || !csrf) return;

          if (result['cookie'] !== cookie || result['csrf'] !== csrf || result['auth'] !== auth) {
            chrome.storage.local.set({ cookie, csrf, auth });
          }
        }
      );
    },
    { urls: ['*://x.com/*', '*://twitter.com/*'] },
    ['requestHeaders', 'extraHeaders']
  );
}

export function waitForAuthData(): Promise<AuthData> {
  return new Promise((resolve) => {
    const check = () => {
      chrome.storage.local.get(
        ['bookmarksApiId', 'cookie', 'csrf', 'auth'],
        (result) => {
          if (result['bookmarksApiId'] && result['cookie'] && result['csrf'] && result['auth']) {
            resolve({
              bookmarksApiId: result['bookmarksApiId'] as string,
              cookie: result['cookie'] as string,
              csrf: result['csrf'] as string,
              auth: result['auth'] as string,
            });
          } else {
            setTimeout(check, 100);
          }
        }
      );
    };
    check();
  });
}

export function extractApiIdFromUrl(url: string): string | null {
  const match = url.match(BOOKMARKS_URL_PATTERN);
  return match?.[1] ?? null;
}

export function extractHeaders(
  requestHeaders: chrome.webRequest.HttpHeader[]
): { auth: string; cookie: string; csrf: string } {
  const auth = requestHeaders.find(h => h.name.toLowerCase() === 'authorization')?.value ?? '';
  const cookie = requestHeaders.find(h => h.name.toLowerCase() === 'cookie')?.value ?? '';
  const csrf = requestHeaders.find(h => h.name.toLowerCase() === 'x-csrf-token')?.value ?? '';
  return { auth, cookie, csrf };
}
