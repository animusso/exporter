export interface InstagramAuthData {
  cookie: string;
  csrf: string;
  igAppId: string;
}

const IG_STORAGE_KEYS = ['ig_cookie', 'ig_csrf', 'ig_app_id'] as const;

export function setupInstagramAuthCapture(): void {
  chrome.webRequest.onBeforeSendHeaders.addListener(
    (details): undefined => {
      if (!details.url.includes('instagram.com')) return;

      const headers = details.requestHeaders;
      if (!headers) return;

      const cookie = findHeader(headers, 'cookie');
      const csrf = findHeader(headers, 'x-csrftoken');
      const igAppId = findHeader(headers, 'x-ig-app-id');

      if (!cookie || !csrf) return;

      chrome.storage.local.get([...IG_STORAGE_KEYS], (result) => {
        const updates: Record<string, string> = {};

        if (cookie && result['ig_cookie'] !== cookie) updates['ig_cookie'] = cookie;
        if (csrf && result['ig_csrf'] !== csrf) updates['ig_csrf'] = csrf;
        if (igAppId && result['ig_app_id'] !== igAppId) updates['ig_app_id'] = igAppId;

        if (Object.keys(updates).length > 0) {
          chrome.storage.local.set(updates);
        }
      });
    },
    { urls: ['*://www.instagram.com/*'] },
    ['requestHeaders', 'extraHeaders']
  );
}

export function waitForInstagramAuthData(): Promise<InstagramAuthData> {
  return new Promise((resolve) => {
    const check = () => {
      chrome.storage.local.get([...IG_STORAGE_KEYS], (result) => {
        const cookie = result['ig_cookie'] as string | undefined;
        const csrf = result['ig_csrf'] as string | undefined;
        const igAppId = result['ig_app_id'] as string | undefined;

        if (cookie && csrf && igAppId) {
          resolve({ cookie, csrf, igAppId });
        } else {
          setTimeout(check, 500);
        }
      });
    };
    check();
  });
}

export function extractInstagramHeaders(
  requestHeaders: chrome.webRequest.HttpHeader[]
): { cookie: string; csrf: string; igAppId: string } {
  return {
    cookie: findHeader(requestHeaders, 'cookie'),
    csrf: findHeader(requestHeaders, 'x-csrftoken'),
    igAppId: findHeader(requestHeaders, 'x-ig-app-id'),
  };
}

function findHeader(headers: chrome.webRequest.HttpHeader[], name: string): string {
  return headers.find(h => h.name.toLowerCase() === name)?.value ?? '';
}
