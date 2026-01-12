import { scanAllFonts } from "./functions/api.js";
import { displayFonts, showError } from "./functions/display.js";

// Get references to DOM elements
const scanButton = document.getElementById("scanButton");
const hoverToggleButton = document.getElementById("hoverToggleButton");
const loadingEl = document.getElementById("loading");
const errorEl = document.getElementById("error");
const resultsEl = document.getElementById("results");

// Track hover mode state
let hoverModeEnabled = false;
let currentTabIdForHover = null;

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
                        // Inject content script for hover detection
                        injectHoverDetection(tab.id);
                        currentTabIdForHover = tab.id;
                        // Enable hover toggle button
                        hoverToggleButton.disabled = false;
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

// Function to inject hover detection content script
function injectHoverDetection(tabId) {
    chrome.scripting.executeScript(
        {
            target: { tabId: tabId },
            files: ["content-script.js"],
        },
        () => {
            if (!chrome.runtime.lastError) {
                // Start hover detection
                chrome.tabs.sendMessage(tabId, { type: "START_HOVER_DETECTION" });
            }
        }
    );
}

// Function to clear all highlights
function clearHighlights() {
    const allCombinations = document.querySelectorAll(".font-combination");
    allCombinations.forEach((el) => {
        el.classList.remove("highlighted");
    });
}

// Function to highlight and scroll to matching font combination
function highlightFontCombination(font) {
    if (!hoverModeEnabled) {
        return;
    }

    // Create the same key format used in display
    const fontKey = `${font.family}|${font.weight}|${font.fontSize}|${font.lineHeight}`;

    // Find all font combination elements
    const allCombinations = document.querySelectorAll(".font-combination");

    // Remove previous highlights
    allCombinations.forEach((el) => {
        el.classList.remove("highlighted");
    });

    // Find and highlight matching element
    const matchingElement = Array.from(allCombinations).find((el) => {
        return el.getAttribute("data-font-key") === fontKey;
    });

    if (matchingElement) {
        matchingElement.classList.add("highlighted");
        // Scroll to the element
        matchingElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
        });
    }
}

// Function to toggle hover mode
function toggleHoverMode() {
    hoverModeEnabled = !hoverModeEnabled;

    if (hoverModeEnabled) {
        hoverToggleButton.textContent = "Disable Hover Mode";
        hoverToggleButton.classList.add("active");
        // Start hover detection if we have a tab
        if (currentTabIdForHover) {
            chrome.tabs.sendMessage(currentTabIdForHover, { type: "START_HOVER_DETECTION" }, () => {
                if (chrome.runtime.lastError) {
                    // Content script might not be injected, try to inject it
                    injectHoverDetection(currentTabIdForHover);
                }
            });
        }
    } else {
        hoverToggleButton.textContent = "Enable Hover Mode";
        hoverToggleButton.classList.remove("active");
        // Stop hover detection
        if (currentTabIdForHover) {
            chrome.tabs.sendMessage(currentTabIdForHover, { type: "STOP_HOVER_DETECTION" });
        }
        // Clear highlights
        clearHighlights();
    }
}

// Listen for hover messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "FONT_HOVER") {
        highlightFontCombination(message.font);
    } else if (message.type === "MOUSE_LEFT_PAGE") {
        clearHighlights();
    }
});

// Set up button click handler and tab monitoring
document.addEventListener("DOMContentLoaded", () => {
    scanButton.addEventListener("click", scanFonts);
    hoverToggleButton.addEventListener("click", toggleHoverMode);

    // Get initial tab ID
    updateCurrentTab();

    // Listen for tab activation changes
    chrome.tabs.onActivated.addListener(() => {
        updateCurrentTab();
        // Reset hover mode when tab changes
        if (hoverModeEnabled) {
            hoverModeEnabled = false;
            hoverToggleButton.textContent = "Enable Hover Mode";
            hoverToggleButton.classList.remove("active");
            clearHighlights();
            currentTabIdForHover = null;
        }
    });

    // Listen for tab updates (when URL changes)
    chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
        if (changeInfo.status === "complete" && tabId === currentTabId) {
            // Tab finished loading, clear results
            resultsEl.innerHTML = "";
            errorEl.style.display = "none";
            // Reset hover mode
            if (hoverModeEnabled) {
                hoverModeEnabled = false;
                hoverToggleButton.textContent = "Enable Hover Mode";
                hoverToggleButton.classList.remove("active");
                clearHighlights();
                currentTabIdForHover = null;
            }
        }
    });
});
