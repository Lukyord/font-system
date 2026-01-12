// Enable side panel globally
chrome.sidePanel.setOptions({
    path: "sidepanel.html",
    enabled: true,
});

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener(async (tab) => {
    await chrome.sidePanel.open({ tabId: tab.id });
});
