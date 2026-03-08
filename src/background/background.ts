import { setupAuthCapture, waitForAuthData } from './twitter-auth';
import { fetchAllBookmarkIds, downloadAsJson } from './twitter-bookmarks';

setupAuthCapture();

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'exportTwitterBookmarks') {
    handleTwitterExport(sendResponse);
    return true;
  }
  return undefined;
});

async function handleTwitterExport(
  sendResponse: (response: unknown) => void
): Promise<void> {
  try {
    sendStatus('Opening Twitter bookmarks...');
    chrome.tabs.create({ url: 'https://x.com/i/bookmarks/all' });

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

function sendStatus(text: string): void {
  chrome.runtime.sendMessage({ action: 'status', text }).catch(() => {
    // Popup may be closed, ignore
  });
}
