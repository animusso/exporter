const twitterBtn = document.getElementById('twitter-export-btn') as HTMLButtonElement;
const instagramBtn = document.getElementById('instagram-export-btn') as HTMLButtonElement;
const statusBar = document.getElementById('status-bar') as HTMLDivElement;
const statusText = document.getElementById('status-text') as HTMLSpanElement;

let exporting = false;

twitterBtn.addEventListener('click', () => {
  if (exporting) return;

  exporting = true;
  disableButtons();
  setStatus('Starting export...', 'active');

  chrome.runtime.sendMessage({ action: 'exportTwitterBookmarks' }, (response) => {
    if (chrome.runtime.lastError) {
      setStatus(`Error: ${chrome.runtime.lastError.message}`, 'error');
      enableButtons();
      exporting = false;
      return;
    }

    if (response?.status === 'done') {
      setStatus(`Exported ${response.count} bookmarks.`, 'success');
    } else if (response?.status === 'empty') {
      setStatus('No bookmarks found.', 'error');
    } else if (response?.status === 'error') {
      setStatus(`Error: ${response.message}`, 'error');
    }
    enableButtons();
    exporting = false;
  });
});

instagramBtn.addEventListener('click', () => {
  if (exporting) return;

  exporting = true;
  disableButtons();
  setStatus('Starting Instagram export...', 'active');

  chrome.runtime.sendMessage({ action: 'exportInstagramBookmarks' }, (response) => {
    if (chrome.runtime.lastError) {
      setStatus(`Error: ${chrome.runtime.lastError.message}`, 'error');
      enableButtons();
      exporting = false;
      return;
    }

    if (response?.status === 'done') {
      setStatus(`Exported ${response.count} saved posts.`, 'success');
    } else if (response?.status === 'empty') {
      setStatus('No saved posts found.', 'error');
    } else if (response?.status === 'error') {
      setStatus(`Error: ${response.message}`, 'error');
    }
    enableButtons();
    exporting = false;
  });
});

// Status updates from background
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'status') {
    setStatus(message.text, message.text.startsWith('Error') ? 'error' : 'active');
  }
});

function setStatus(text: string, state: 'active' | 'error' | 'success'): void {
  statusBar.classList.add('visible');
  statusBar.classList.remove('error', 'success');
  if (state === 'error') statusBar.classList.add('error');
  if (state === 'success') statusBar.classList.add('success');
  statusText.textContent = text;
}

function disableButtons(): void {
  twitterBtn.disabled = true;
  instagramBtn.disabled = true;
}

function enableButtons(): void {
  twitterBtn.disabled = false;
  instagramBtn.disabled = false;
}
