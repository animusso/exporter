// src/popup/index.ts
var twitterBtn = document.getElementById("twitter-export-btn");
var instagramBtn = document.getElementById("instagram-export-btn");
var statusBar = document.getElementById("status-bar");
var statusText = document.getElementById("status-text");
var exporting = false;
twitterBtn.addEventListener("click", () => {
  if (exporting) return;
  exporting = true;
  disableButtons();
  setStatus("Starting export...", "active");
  chrome.runtime.sendMessage({ action: "exportTwitterBookmarks" }, (response) => {
    if (chrome.runtime.lastError) {
      setStatus(`Error: ${chrome.runtime.lastError.message}`, "error");
      enableButtons();
      exporting = false;
      return;
    }
    if (response?.status === "done") {
      setStatus(`Exported ${response.count} bookmarks.`, "success");
    } else if (response?.status === "empty") {
      setStatus("No bookmarks found.", "error");
    } else if (response?.status === "error") {
      setStatus(`Error: ${response.message}`, "error");
    }
    enableButtons();
    exporting = false;
  });
});
instagramBtn.addEventListener("click", () => {
  if (exporting) return;
  exporting = true;
  disableButtons();
  setStatus("Starting Instagram export...", "active");
  chrome.runtime.sendMessage({ action: "exportInstagramBookmarks" }, (response) => {
    if (chrome.runtime.lastError) {
      setStatus(`Error: ${chrome.runtime.lastError.message}`, "error");
      enableButtons();
      exporting = false;
      return;
    }
    if (response?.status === "done") {
      setStatus(`Exported ${response.count} saved posts.`, "success");
    } else if (response?.status === "empty") {
      setStatus("No saved posts found.", "error");
    } else if (response?.status === "error") {
      setStatus(`Error: ${response.message}`, "error");
    }
    enableButtons();
    exporting = false;
  });
});
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "status") {
    setStatus(message.text, message.text.startsWith("Error") ? "error" : "active");
  }
});
function setStatus(text, state) {
  statusBar.classList.add("visible");
  statusBar.classList.remove("error", "success");
  if (state === "error") statusBar.classList.add("error");
  if (state === "success") statusBar.classList.add("success");
  statusText.textContent = text;
}
function disableButtons() {
  twitterBtn.disabled = true;
  instagramBtn.disabled = true;
}
function enableButtons() {
  twitterBtn.disabled = false;
  instagramBtn.disabled = false;
}
//# sourceMappingURL=index.js.map
