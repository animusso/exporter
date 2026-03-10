import { setupAuthCapture, waitForAuthData } from './twitter-auth';
import { fetchAllBookmarkIds, downloadAsJson } from './twitter-bookmarks';
import { setupInstagramAuthCapture, waitForInstagramAuthData } from './instagram-auth';
import {
  fetchSavedPosts,
  buildExportResult,
  downloadAsJson as downloadInstagramJson,
} from './instagram-bookmarks';

setupAuthCapture();
setupInstagramAuthCapture();

// Clear stale ig_state from previous versions
chrome.storage.local.remove('ig_state');

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'exportTwitterBookmarks') {
    handleTwitterExport(sendResponse);
    return true;
  }
  if (request.action === 'exportInstagramBookmarks') {
    handleInstagramExport(sendResponse);
    return true;
  }
  return undefined;
});

async function handleTwitterExport(
  sendResponse: (response: unknown) => void
): Promise<void> {
  try {
    sendStatus('Opening Twitter bookmarks...');
    chrome.tabs.create({ url: 'https://x.com/i/bookmarks/all', active: false });

    sendStatus('Waiting for authentication...');
    const authData = await waitForAuthData();

    sendStatus('Fetching bookmarks...');
    const ids = await fetchAllBookmarkIds(authData, (message) => {
      sendStatus(message);
    });

    if (ids.length === 0) {
      sendStatus('No bookmarks found.');
      sendResponse({ status: 'empty' });
      return;
    }

    sendStatus(`Downloading ${ids.length} bookmarks...`);
    downloadAsJson(ids);
    sendStatus(`Exported ${ids.length} bookmarks.`);
    sendResponse({ status: 'done', count: ids.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    sendStatus(`Error: ${message}`);
    sendResponse({ status: 'error', message });
  }
}

async function handleInstagramExport(
  sendResponse: (response: unknown) => void
): Promise<void> {
  try {
    sendStatus('Waiting for Instagram authentication...');
    chrome.tabs.create({ url: 'https://www.instagram.com/', active: false });

    const authData = await waitForInstagramAuthData();

    sendStatus('Fetching saved posts...');
    const urls = await fetchSavedPosts(authData, (msg) => {
      sendStatus(msg);
    });

    if (urls.length === 0) {
      sendStatus('No saved posts found.');
      sendResponse({ status: 'empty' });
      return;
    }

    sendStatus(`Downloading ${urls.length} saved posts...`);
    const result = buildExportResult(urls);
    downloadInstagramJson(result);
    sendStatus(`Exported ${urls.length} saved posts.`);
    sendResponse({ status: 'done', count: urls.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    sendStatus(`Error: ${message}`);
    sendResponse({ status: 'error', message });
  }
}

function sendStatus(text: string): void {
  chrome.runtime.sendMessage({ action: 'status', text }).catch(() => {
    // Popup may be closed, ignore
  });
}
