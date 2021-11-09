async function currentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

chrome.tabs.onUpdated.addListener(async () => {
  chrome.storage.sync.get(["canvasURL", "darkMode"], async (res) => {
    if (res.canvasURL && res.darkMode) {
      const tab = await currentTab();
      if (tab?.url?.length > 0 && tab.url.replace(/\/$/, "") == res.canvasURL) {
        chrome.scripting.insertCSS({
          target: { tabId: tab.id },
          files: ["src/assets/css/canvas.css"],
        });
      }
    }
  });
});
