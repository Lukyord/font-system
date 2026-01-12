// Get references to DOM elements
const loadingEl = document.getElementById("loading");
const errorEl = document.getElementById("error");
const resultsEl = document.getElementById("results");

// When popup opens, scan for fonts
document.addEventListener("DOMContentLoaded", () => {
    scanFonts();
});

function scanFonts() {
    // Get the current active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs[0]) {
            showError("No active tab found");
            return;
        }

        // Check if scripting API is available (use safe property access)
        const scripting = chrome.scripting;
        if (!scripting || typeof scripting.executeScript !== "function") {
            showError(
                "Scripting API not available. Please: 1) Reload the extension in chrome://extensions/, 2) Make sure you're using Chrome 88+"
            );
            return;
        }

        // Execute the font scanning function directly in the page
        scripting.executeScript(
            {
                target: { tabId: tabs[0].id },
                func: scanAllFonts,
            },
            (results) => {
                if (chrome.runtime.lastError) {
                    showError("Error: " + chrome.runtime.lastError.message);
                    return;
                }

                if (results && results[0] && results[0].result) {
                    displayFonts(results[0].result);
                } else {
                    showError("Failed to scan fonts");
                }
            }
        );
    });
}

// Font scanning function (will be executed in the page context)
function scanAllFonts() {
    const fontMap = new Map();
    const allElements = document.querySelectorAll("*");

    allElements.forEach((element) => {
        const computedStyle = window.getComputedStyle(element);

        const fontFamily = computedStyle.fontFamily;
        const fontWeight = computedStyle.fontWeight;
        const fontSize = computedStyle.fontSize;
        const lineHeight = computedStyle.lineHeight;

        // Create a unique key from the font properties
        const key = `${fontFamily}|${fontWeight}|${fontSize}|${lineHeight}`;

        // Only store if we haven't seen this combination before
        if (!fontMap.has(key)) {
            // Extract just the first font family (remove fallbacks)
            const primaryFamily = fontFamily.split(",")[0].replace(/['"]/g, "").trim();

            fontMap.set(key, {
                family: primaryFamily,
                weight: fontWeight,
                fontSize: fontSize,
                lineHeight: lineHeight,
            });
        }
    });

    // Convert Map to Array
    return Array.from(fontMap.values());
}

function displayFonts(fonts) {
    loadingEl.style.display = "none";

    if (fonts.length === 0) {
        resultsEl.innerHTML = '<p class="no-results">No fonts found</p>';
        return;
    }

    // Group fonts by family
    const fontsByFamily = new Map();
    fonts.forEach((font) => {
        if (!fontsByFamily.has(font.family)) {
            fontsByFamily.set(font.family, []);
        }
        fontsByFamily.get(font.family).push(font);
    });

    // Sort families alphabetically
    const sortedFamilies = Array.from(fontsByFamily.keys()).sort((a, b) => a.localeCompare(b));

    let html = '<div class="font-list">';
    sortedFamilies.forEach((family) => {
        const familyFonts = fontsByFamily.get(family);
        html += `<div class="font-group">`;
        html += `<div class="font-family-header">[${family}]</div>`;
        html += `<div class="font-combinations">`;
        familyFonts.forEach((font) => {
            html += `<div class="font-combination">- ${font.fontSize}/${font.lineHeight}, (${font.weight})</div>`;
        });
        html += `</div>`;
        html += `</div>`;
    });
    html += "</div>";

    resultsEl.innerHTML = html;
}

function showError(message) {
    loadingEl.style.display = "none";
    errorEl.textContent = message;
    errorEl.style.display = "block";
}
