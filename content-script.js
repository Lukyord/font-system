// Content script to detect font properties on hover
(function () {
    let hoverListener = null;
    let mouseOutListener = null;
    let documentMouseLeaveListener = null;
    let debounceTimer = null;
    const DEBOUNCE_DELAY = 100; // ms

    function getFontProperties(element) {
        const computedStyle = window.getComputedStyle(element);
        const fontFamily = computedStyle.fontFamily;
        const fontWeight = computedStyle.fontWeight;
        const fontSize = computedStyle.fontSize;
        const lineHeight = computedStyle.lineHeight;

        // Extract just the first font family (remove fallbacks)
        const primaryFamily = fontFamily.split(",")[0].replace(/['"]/g, "").trim();

        return {
            family: primaryFamily,
            weight: fontWeight,
            fontSize: fontSize,
            lineHeight: lineHeight,
        };
    }

    function startHoverDetection() {
        if (hoverListener) {
            return; // Already started
        }

        mouseOutListener = (e) => {
            // Check if mouse left the document (no relatedTarget means it left the window)
            if (!e.relatedTarget || (e.relatedTarget === document.body && e.target === document.documentElement)) {
                // Mouse left the page
                chrome.runtime.sendMessage(
                    {
                        type: "MOUSE_LEFT_PAGE",
                    },
                    () => {
                        // Ignore errors
                        if (chrome.runtime.lastError) {
                            // Silently fail
                        }
                    }
                );
            }
        };

        // Also listen for mouseleave on document
        documentMouseLeaveListener = () => {
            chrome.runtime.sendMessage(
                {
                    type: "MOUSE_LEFT_PAGE",
                },
                () => {
                    if (chrome.runtime.lastError) {
                        // Silently fail
                    }
                }
            );
        };

        hoverListener = (e) => {
            // Debounce to avoid too many messages
            if (debounceTimer) {
                clearTimeout(debounceTimer);
            }

            debounceTimer = setTimeout(() => {
                const fontProps = getFontProperties(e.target);
                // Send message to sidepanel
                chrome.runtime.sendMessage(
                    {
                        type: "FONT_HOVER",
                        font: fontProps,
                    },
                    () => {
                        // Ignore errors (e.g., if sidepanel is closed)
                        if (chrome.runtime.lastError) {
                            // Silently fail
                        }
                    }
                );
            }, DEBOUNCE_DELAY);
        };

        document.addEventListener("mouseover", hoverListener, true);
        document.addEventListener("mouseout", mouseOutListener, true);
        document.addEventListener("mouseleave", documentMouseLeaveListener, true);
    }

    function stopHoverDetection() {
        if (hoverListener) {
            document.removeEventListener("mouseover", hoverListener, true);
            hoverListener = null;
        }
        if (mouseOutListener) {
            document.removeEventListener("mouseout", mouseOutListener, true);
            mouseOutListener = null;
        }
        if (documentMouseLeaveListener) {
            document.removeEventListener("mouseleave", documentMouseLeaveListener, true);
            documentMouseLeaveListener = null;
        }
        if (debounceTimer) {
            clearTimeout(debounceTimer);
            debounceTimer = null;
        }
    }

    // Listen for messages from sidepanel
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === "START_HOVER_DETECTION") {
            startHoverDetection();
            sendResponse({ success: true });
        } else if (message.type === "STOP_HOVER_DETECTION") {
            stopHoverDetection();
            sendResponse({ success: true });
        }
        return true; // Keep channel open for async response
    });
})();
