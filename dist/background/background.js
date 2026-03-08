// src/background/twitter-auth.ts
var BOOKMARKS_URL_PATTERN = /https:\/\/x\.com\/i\/api\/graphql\/([^/]+)\/Bookmarks\?/;
function setupAuthCapture() {
  chrome.webRequest.onBeforeSendHeaders.addListener(
    (details) => {
      if (!details.url.includes("x.com") && !details.url.includes("twitter.com")) {
        return;
      }
      chrome.storage.local.get(
        ["bookmarksApiId", "cookie", "csrf", "auth"],
        (result) => {
          const match = details.url.match(BOOKMARKS_URL_PATTERN);
          if (match?.[1] && !result["bookmarksApiId"]) {
            chrome.storage.local.set({ bookmarksApiId: match[1] });
          }
          const headers = details.requestHeaders;
          if (!headers) return;
          const auth = headers.find((h) => h.name.toLowerCase() === "authorization")?.value ?? "";
          const cookie = headers.find((h) => h.name.toLowerCase() === "cookie")?.value ?? "";
          const csrf = headers.find((h) => h.name.toLowerCase() === "x-csrf-token")?.value ?? "";
          if (!auth || !cookie || !csrf) return;
          if (result["cookie"] !== cookie || result["csrf"] !== csrf || result["auth"] !== auth) {
            chrome.storage.local.set({ cookie, csrf, auth });
          }
        }
      );
    },
    { urls: ["*://x.com/*", "*://twitter.com/*"] },
    ["requestHeaders", "extraHeaders"]
  );
}
function waitForAuthData() {
  return new Promise((resolve) => {
    const check = () => {
      chrome.storage.local.get(
        ["bookmarksApiId", "cookie", "csrf", "auth"],
        (result) => {
          if (result["bookmarksApiId"] && result["cookie"] && result["csrf"] && result["auth"]) {
            resolve({
              bookmarksApiId: result["bookmarksApiId"],
              cookie: result["cookie"],
              csrf: result["csrf"],
              auth: result["auth"]
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

// src/background/twitter-bookmarks.ts
var GRAPHQL_FEATURES = {
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
  responsive_web_enhance_cards_enabled: false
};
function extractTweetIds(entries) {
  return entries.filter((entry) => entry.entryId.startsWith("tweet-")).map((entry) => entry.entryId.replace("tweet-", ""));
}
function findNextCursor(entries) {
  const cursorEntry = entries.find((entry) => entry.entryId.startsWith("cursor-bottom-"));
  return cursorEntry?.content?.value ?? null;
}
function buildExportResult(ids) {
  return {
    type: "twitter",
    items: ids.map((id) => ({ id }))
  };
}
async function fetchAllBookmarkIds(authData, onProgress) {
  const allIds = [];
  let cursor = "";
  let page = 0;
  while (true) {
    page++;
    onProgress?.(`Fetching page ${page}...`);
    const variables = {
      count: 100,
      cursor,
      includePromotedContent: false
    };
    const url = `https://x.com/i/api/graphql/${authData.bookmarksApiId}/Bookmarks?features=${encodeURIComponent(JSON.stringify(GRAPHQL_FEATURES))}&variables=${encodeURIComponent(JSON.stringify(variables))}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Cookie: authData.cookie,
        Authorization: authData.auth,
        "X-Csrf-token": authData.csrf
      },
      redirect: "follow"
    });
    if (!response.ok) {
      throw new Error(`Twitter API error: ${response.status}`);
    }
    const data = await response.json();
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
function downloadAsJson(ids) {
  const result = buildExportResult(ids);
  const jsonContent = JSON.stringify(result, null, 2);
  const dataUrl = `data:application/json;charset=utf-8,${encodeURIComponent(jsonContent)}`;
  const fileName = `twitter_bookmarks_${Date.now()}.json`;
  chrome.downloads.download({
    url: dataUrl,
    filename: fileName,
    saveAs: true
  });
}

// src/background/background.ts
setupAuthCapture();
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === "exportTwitterBookmarks") {
    handleTwitterExport(sendResponse);
    return true;
  }
  return void 0;
});
async function handleTwitterExport(sendResponse) {
  try {
    sendStatus("Opening Twitter bookmarks...");
    chrome.tabs.create({ url: "https://x.com/i/bookmarks/all" });
    sendStatus("Waiting for authentication...");
    const authData = await waitForAuthData();
    sendStatus("Fetching bookmarks...");
    const ids = await fetchAllBookmarkIds(authData, (message) => {
      sendStatus(message);
    });
    if (ids.length === 0) {
      sendStatus("No bookmarks found.");
      sendResponse({ status: "empty" });
      return;
    }
    sendStatus(`Downloading ${ids.length} bookmarks...`);
    downloadAsJson(ids);
    sendStatus(`Exported ${ids.length} bookmarks.`);
    sendResponse({ status: "done", count: ids.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    sendStatus(`Error: ${message}`);
    sendResponse({ status: "error", message });
  }
}
function sendStatus(text) {
  chrome.runtime.sendMessage({ action: "status", text }).catch(() => {
  });
}
//# sourceMappingURL=background.js.map
