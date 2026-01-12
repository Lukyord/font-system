# Font Detector

A Chrome browser extension that detects and displays all font combinations found on web pages. The extension provides both scanning and interactive hover modes to help developers and designers identify fonts used on any webpage.

## Features

-   **Font Scanning**: Automatically scans the current webpage and identifies all unique font combinations (family, size, weight, and line-height)
-   **Organized Display**: Fonts are grouped by family, then sorted by size and weight for easy browsing
-   **Hover Mode**: Interactive mode that highlights elements and displays their font properties when you hover over them
-   **Side Panel Interface**: Clean, accessible interface that opens in Chrome's side panel
-   **Real-time Highlighting**: Visual feedback with blue outlines when hovering over elements in hover mode

## Installation

### From Source

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in the top right)
4. Click "Load unpacked"
5. Select the `font-system` directory
6. The extension icon should appear in your Chrome toolbar

## Usage

### Scanning Fonts

1. Navigate to any webpage you want to analyze
2. Click the extension icon in the toolbar to open the side panel
3. Click the "Scan Fonts" button
4. Wait for the scan to complete (usually takes a few seconds)
5. Browse the results organized by font family, size, and weight

### Hover Mode

1. After scanning, click "Enable Hover Mode"
2. Move your mouse over elements on the webpage
3. Elements will be highlighted with a blue outline
4. The corresponding font combination in the side panel will be highlighted
5. Click "Disable Hover Mode" to turn off the feature

## Project Structure

```
font-system/
├── manifest.json          # Extension manifest (Manifest V3)
├── background.js          # Service worker for extension initialization
├── content-script.js      # Injected script for hover detection
├── sidepanel.html         # Side panel HTML structure
├── sidepanel.js           # Main side panel logic
├── sidepanel.css          # Side panel styling
├── functions/
│   ├── api.js            # Font scanning API functions
│   ├── display.js        # Font display and rendering logic
│   ├── errors.js         # Error handling utilities
│   ├── hover.js          # Hover mode functionality
│   ├── messaging.js      # Message type constants
│   ├── scanning.js       # Font scanning orchestration
│   ├── scanner.js        # Core font scanning algorithm
│   ├── tabs.js           # Tab management utilities
│   ├── ui.js             # UI state management
│   └── utils.js          # General utility functions
└── icons/                # Extension icons (16x16, 32x32, 48x48, 128x128)
```

## How It Works

### Font Scanning

The extension uses `document.fonts.check()` to identify which fonts are actually loaded and used on the page. It:

1. Scans all elements in the DOM
2. Extracts computed font properties (family, size, weight, line-height)
3. Groups and deduplicates font combinations
4. Displays results in an organized, sortable format

### Hover Detection

When hover mode is enabled:

1. A content script is injected into the active tab
2. Mouse events are captured and debounced
3. Font properties are extracted from hovered elements
4. Elements are visually highlighted
5. Matching font combinations in the side panel are highlighted

## Technologies

-   **Chrome Extensions API** (Manifest V3)
-   **Vanilla JavaScript** (ES6 modules)
-   **CSS3** for styling
-   **Chrome Side Panel API** for the UI

## Permissions

The extension requires the following permissions:

-   `activeTab`: To access and scan the current tab
-   `scripting`: To inject content scripts for font scanning and hover detection
-   `sidePanel`: To display the extension interface

## Browser Compatibility

-   Chrome 114+ (for Side Panel API support)
-   Other Chromium-based browsers (Edge, Brave, etc.) with Side Panel support

## Development

### Prerequisites

-   Chrome browser (114+)
-   Basic knowledge of Chrome Extensions API

### Making Changes

1. Edit the relevant files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test your changes

### Debugging

-   **Side Panel**: Right-click in the side panel → Inspect
-   **Content Script**: Open DevTools on the webpage → Check Console
-   **Background Script**: Go to `chrome://extensions/` → Click "service worker" link

## License

This project is part of an extension tutorial. Feel free to use and modify as needed.

## Contributing

This is a tutorial project, but suggestions and improvements are welcome!
