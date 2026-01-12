export function displayFonts(fonts, loadingEl, resultsEl) {
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

export function showError(message, loadingEl, errorEl) {
    loadingEl.style.display = "none";
    errorEl.textContent = message;
    errorEl.style.display = "block";
}
