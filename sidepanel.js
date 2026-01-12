import { scanAllFonts } from "./functions/api.js";
import { displayFonts, showError } from "./functions/display.js";

// Get references to DOM elements
const scanButton = document.getElementById("scanButton");
const loadingEl = document.getElementById("loading");
const errorEl = document.getElementById("error");
const resultsEl = document.getElementById("results");

function scanFonts() {
    // Hide previous results and errors
    errorEl.style.display = "none";
    resultsEl.innerHTML = "";
    loadingEl.style.display = "block";
    scanButton.disabled = true;

    // Get the current active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs[0]) {
            showError("No active tab found", loadingEl, errorEl);
            scanButton.disabled = false;
            return;
        }

        const tab = tabs[0];

        // Check if scripting API is available (use safe property access)
        const scripting = chrome.scripting;
        if (!scripting || typeof scripting.executeScript !== "function") {
            showError(
                "Scripting API not available. Please: 1) Reload the extension in chrome://extensions/, 2) Make sure you're using Chrome 88+",
                loadingEl,
                errorEl
            );
            scanButton.disabled = false;
            return;
        }

        // Try to get the full tab info to check if we have access
        chrome.tabs.get(tab.id, (currentTab) => {
            // Even if we can't get tab info, we might still be able to execute scripts
            // So we'll try anyway and handle errors from the scripting API

            // Execute the font scanning function directly in the page
            scripting.executeScript(
                {
                    target: { tabId: tab.id },
                    func: scanAllFonts,
                },
                (results) => {
                    scanButton.disabled = false;

                    if (chrome.runtime.lastError) {
                        const errorMsg = chrome.runtime.lastError.message;
                        // Provide a more helpful error message for permission issues
                        if (
                            errorMsg.includes("Cannot access contents") ||
                            errorMsg.includes("permission") ||
                            errorMsg.includes("host") ||
                            errorMsg.includes("Cannot access")
                        ) {
                            showError(
                                "Cannot access this page. Please click the extension icon in the toolbar to grant permission for this tab.",
                                loadingEl,
                                errorEl
                            );
                        } else {
                            showError("Error: " + errorMsg, loadingEl, errorEl);
                        }
                        return;
                    }

                    if (results && results[0] && results[0].result) {
                        displayFonts(results[0].result, loadingEl, resultsEl);
                    } else {
                        showError("Failed to scan fonts", loadingEl, errorEl);
                    }
                }
            );
        });
    });
}

// Track the current tab ID to detect tab switches
let currentTabId = null;

// Function to update the current tab and check if it changed
function updateCurrentTab() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].id !== currentTabId) {
            currentTabId = tabs[0].id;
            // Clear previous results when tab changes
            resultsEl.innerHTML = "";
            errorEl.style.display = "none";
        }
    });
}

// Set up button click handler and tab monitoring
document.addEventListener("DOMContentLoaded", () => {
    scanButton.addEventListener("click", scanFonts);

    // Get initial tab ID
    updateCurrentTab();

    // Listen for tab activation changes
    chrome.tabs.onActivated.addListener(() => {
        updateCurrentTab();
    });

    // Listen for tab updates (when URL changes)
    chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
        if (changeInfo.status === "complete" && tabId === currentTabId) {
            // Tab finished loading, clear results
            resultsEl.innerHTML = "";
            errorEl.style.display = "none";
        }
    });
});
