import type { AuthData } from './twitter-auth';

export interface ExportResult {
  type: 'twitter';
  items: Array<{ id: string }>;
}

const GRAPHQL_FEATURES = {
  graphql_timeline_v2_bookmark_timeline: true,
  rweb_tipjar_consumption_enabled: true,
  responsive_web_graphql_exclude_directive_enabled: true,
  verified_phone_label_enabled: false,
  creator_subscriptions_tweet_preview_api_enabled: true,
  responsive_web_graphql_timeline_navigation_enabled: true,
  responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
  communities_web_enable_tweet_community_results_fetch: true,
  c9s_tweet_anatomy_moderator_badge_enabled: true,
  articles_preview_enabled: true,
  tweetypie_unmention_optimization_enabled: true,
  responsive_web_edit_tweet_api_enabled: true,
  graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
  view_counts_everywhere_api_enabled: true,
  longform_notetweets_consumption_enabled: true,
  responsive_web_twitter_article_tweet_consumption_enabled: true,
  tweet_awards_web_tipping_enabled: false,
  creator_subscriptions_quote_tweet_preview_enabled: false,
  freedom_of_speech_not_reach_fetch_enabled: true,
  standardized_nudges_misinfo: true,
  tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
  rweb_video_timestamps_enabled: true,
  longform_notetweets_rich_text_read_enabled: true,
  longform_notetweets_inline_media_enabled: true,
  responsive_web_enhance_cards_enabled: false,
};

interface BookmarkEntry {
  entryId: string;
  content?: {
    value?: string;
  };
}

interface BookmarksResponse {
  data?: {
    bookmark_timeline_v2?: {
      timeline?: {
        instructions?: Array<{
          entries?: BookmarkEntry[];
        }>;
      };
    };
  };
}

export function extractTweetIds(entries: BookmarkEntry[]): string[] {
  return entries
    .filter(entry => entry.entryId.startsWith('tweet-'))
    .map(entry => entry.entryId.replace('tweet-', ''));
}

export function findNextCursor(entries: BookmarkEntry[]): string | null {
  const cursorEntry = entries.find(entry => entry.entryId.startsWith('cursor-bottom-'));
  return cursorEntry?.content?.value ?? null;
}

export function buildExportResult(ids: string[]): ExportResult {
  return {
    type: 'twitter',
    items: ids.map(id => ({ id })),
  };
}

type ProgressCallback = (message: string) => void;

export async function fetchAllBookmarkIds(
  authData: AuthData,
  onProgress?: ProgressCallback
): Promise<string[]> {
  const allIds: string[] = [];
  let cursor = '';
  let page = 0;

  while (true) {
    page++;
    onProgress?.(`Fetching page ${page}...`);

    const variables = {
      count: 100,
      cursor,
      includePromotedContent: false,
    };

    const url = `https://x.com/i/api/graphql/${authData.bookmarksApiId}/Bookmarks?features=${encodeURIComponent(JSON.stringify(GRAPHQL_FEATURES))}&variables=${encodeURIComponent(JSON.stringify(variables))}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Cookie: authData.cookie,
        Authorization: authData.auth,
        'X-Csrf-token': authData.csrf,
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`Twitter API error: ${response.status}`);
    }

    const data: BookmarksResponse = await response.json();
    const entries = data.data?.bookmark_timeline_v2?.timeline?.instructions?.[0]?.entries ?? [];
    const newIds = extractTweetIds(entries);

    if (newIds.length === 0) break;

    allIds.push(...newIds);
    onProgress?.(`Found ${allIds.length} bookmarks so far...`);

    const nextCursor = findNextCursor(entries);
    if (!nextCursor) break;

    cursor = nextCursor;
  }

  return allIds;
}

export function downloadAsJson(ids: string[]): void {
  const result = buildExportResult(ids);
  const jsonContent = JSON.stringify(result, null, 2);
  const dataUrl = `data:application/json;charset=utf-8,${encodeURIComponent(jsonContent)}`;
  const fileName = `twitter_bookmarks_${Date.now()}.json`;

  chrome.downloads.download({
    url: dataUrl,
    filename: fileName,
    saveAs: true,
  });
}
