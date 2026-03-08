const twitterBtn = document.getElementById('twitter-export-btn') as HTMLButtonElement;
const statusBar = document.getElementById('status-bar') as HTMLDivElement;
const statusText = document.getElementById('status-text') as HTMLSpanElement;

let exporting = false;

twitterBtn.addEventListener('click', () => {
  if (exporting) return;

  exporting = true;
  twitterBtn.disabled = true;
  setStatus('Starting export...', 'active');

  chrome.runtime.sendMessage({ action: 'exportTwitterBookmarks' }, (response) => {
    if (chrome.runtime.lastError) {
      setStatus(`Error: ${chrome.runtime.lastError.message}`, 'error');
      resetButton();
      return;
    }

    if (response?.status === 'done') {
      setStatus(`Exported ${response.count} bookmarks.`, 'success');
      resetButton();
    } else if (response?.status === 'empty') {
      setStatus('No bookmarks found.', 'error');
      resetButton();
    } else if (response?.status === 'error') {
      setStatus(`Error: ${response.message}`, 'error');
      resetButton();
    }
  });
});

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

function resetButton(): void {
  exporting = false;
  twitterBtn.disabled = false;
}
