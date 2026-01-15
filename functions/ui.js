/**
 * Reset UI elements to their default state
 * @param {HTMLElement} errorEl - Error element
 * @param {HTMLElement} resultsEl - Results container
 * @param {HTMLElement} scanButton - Scan button
 * @param {HTMLElement} singleHoverButton - Single hover button
 * @param {HTMLElement} groupHoverButton - Group hover button
 */
export function resetUI(errorEl, resultsEl, scanButton, singleHoverButton, groupHoverButton) {
    errorEl.style.display = "none";
    resultsEl.innerHTML = "";
    scanButton.disabled = false;
    singleHoverButton.disabled = true;
    singleHoverButton.textContent = "Single Hover";
    singleHoverButton.classList.remove("active");
    groupHoverButton.disabled = true;
    groupHoverButton.textContent = "Group Hover";
    groupHoverButton.classList.remove("active");
}

/**
 * Update hover button UI state
 * @param {HTMLElement} hoverButton - Hover button
 * @param {boolean} enabled - Whether hover mode is enabled
 */
export function updateHoverButtonUI(hoverButton, enabled) {
    if (enabled) {
        hoverButton.classList.add("active");
    } else {
        hoverButton.classList.remove("active");
    }
}

/**
 * Clear all font weight badge highlights and line height displays
 */
export function clearHighlights() {
    document.querySelectorAll(".font-weight-badge").forEach((el) => {
        el.classList.remove("highlighted");
    });
    document.querySelectorAll(".line-height-display").forEach((el) => {
        el.textContent = "";
        el.style.display = "none";
    });
}

/**
 * Highlight a font combination in the results and scroll to it
 * @param {Object} font - Font object with family, fontSize, weight, lineHeight
 * @param {boolean} hoverModeEnabled - Whether hover mode is currently enabled
 */
export function highlightFontCombination(font, hoverModeEnabled) {
    if (!hoverModeEnabled) {
        return;
    }

    // Remove previous highlights
    document.querySelectorAll(".font-weight-badge").forEach((el) => {
        el.classList.remove("highlighted");
    });

    const selector = `.font-weight-badge[data-font-family="${font.family}"][data-font-size="${font.fontSize}"][data-font-weight="${font.weight}"]`;
    const matchingElement = document.querySelector(selector);

    if (!matchingElement) {
        return;
    }

    matchingElement.classList.add("highlighted");

    const fontSizeGroup = matchingElement.closest(".font-size-group");
    const lineHeightDisplay = fontSizeGroup?.querySelector(".line-height-display");

    if (lineHeightDisplay) {
        lineHeightDisplay.textContent = `Line height: ${font.lineHeight}`;
        lineHeightDisplay.style.display = "inline";
    }

    matchingElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
    });
}
