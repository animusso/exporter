import type { InstagramAuthData } from './instagram-auth';

export interface InstagramExportResult {
  type: 'instagram';
  items: Array<{ url: string }>;
}

interface SavedPostsResponse {
  items?: Array<{
    media?: {
      code?: string;
      user?: {
        username?: string;
      };
    };
  }>;
  more_available?: boolean;
  next_max_id?: string;
}

type ProgressCallback = (message: string) => void;

export async function fetchSavedPosts(
  authData: InstagramAuthData,
  onProgress?: ProgressCallback
): Promise<string[]> {
  const urls: string[] = [];
  let maxId: string | undefined;
  let page = 0;

  while (true) {
    page++;
    onProgress?.(`Fetching page ${page}...`);

    const basePath = 'https://www.instagram.com/api/v1/feed/saved/posts/';
    const url = maxId ? `${basePath}?max_id=${maxId}` : basePath;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Cookie: authData.cookie,
        'X-CSRFToken': authData.csrf,
        'X-IG-App-ID': authData.igAppId,
      },
    });

    if (!response.ok) {
      throw new Error(`Instagram saved posts API error: ${response.status}`);
    }

    const data: SavedPostsResponse = await response.json();
    const items = data.items ?? [];

    for (const item of items) {
      const code = item.media?.code;
      const username = item.media?.user?.username;
      if (code && username) {
        urls.push(`${username}/p/${code}`);
      }
    }

    onProgress?.(`Found ${urls.length} posts so far...`);

    if (!data.more_available || !data.next_max_id) break;
    maxId = data.next_max_id;
  }

  return urls;
}

export function buildExportResult(urls: string[]): InstagramExportResult {
  return {
    type: 'instagram',
    items: urls.map((url) => ({ url })),
  };
}

export function extractPostUrl(item: { media?: { code?: string; user?: { username?: string } } }): string | null {
  const code = item.media?.code;
  const username = item.media?.user?.username;
  if (code && username) return `${username}/p/${code}`;
  return null;
}

export function downloadAsJson(result: InstagramExportResult): void {
  const jsonContent = JSON.stringify(result, null, 2);
  const dataUrl = `data:application/json;charset=utf-8,${encodeURIComponent(jsonContent)}`;
  const fileName = `instagram_saved_${Date.now()}.json`;

  chrome.downloads.download({
    url: dataUrl,
    filename: fileName,
    saveAs: true,
  });
}
