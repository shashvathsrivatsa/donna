const fs = require('fs');
const path = require('path');

const fontResource = loadFontResource('SF-Pro-Display-Medium.woff2');

function buildFinalSVG(svgInnerContent) {
    return `
        <svg width="1206" height="2622" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <style>
                    @font-face {
                        font-family: '${fontResource.fontFamily}';
                        /* MIME types must be correct for strict browsers (e.g., 'font/woff2' instead of just 'woff2') */
                        src: url(data:${fontResource.mimeType};base64,${fontResource.fontBase64}) format('${fontResource.fontFormat}');
                        /* Since you are loading 'Medium', we usually want font-weight: 500, but keeping generic for now */
                        font-weight: normal; 
                        font-style: normal;
                    }
                </style>
            </defs>
            ${svgInnerContent}
        </svg>
        `;
}

function overlayText(text, x, y, fontSize, fontWeight, color, alignment='middle') {
    return `
        <text x="${x}" y="${y}" 
            fill="${color}" 
            font-family="${fontResource.fontFamily}" 
            font-weight="${fontWeight}" 
            font-size="${fontSize}"
            text-anchor="${alignment}" 
            dominant-baseline="central">
            ${text}
        </text>\n
        `;
}

function overlayCircle(x, y) {
    return `<circle cx="${x}" cy="${y}" r="60" fill="#FF383C" />\n`;
}

function overlayRectangle(x, y, length, width, bgColor) {
    const borderRadius = 12;
    return `
        <rect x="${x}" y="${y}" 
            width="${length}" 
            height="${width}" 
            rx="${borderRadius}"
            ry="${borderRadius}"
            fill="${bgColor}" />
        `;
}

function loadFontResource(fontFilename) {
    const fontPath = path.join(__dirname, '../fonts', fontFilename);

    if (!fs.existsSync(fontPath)) {
        console.error(`Font file not found at: ${fontPath}`);
        console.error(`Current directory: ${__dirname}`);
        throw new Error(`Font file not found: ${fontFilename}`);
    }

    const fontBuffer = fs.readFileSync(fontPath);
    
    // DEBUGGING: Log the file size. 
    // If this logs a size under 500 bytes, your file is a Git LFS pointer, not the actual font.
    console.log(`[DEBUG] Loaded font: ${fontFilename} | Size: ${fontBuffer.length} bytes`);

    const fontBase64 = fontBuffer.toString('base64');

    const fontExt = path.extname(fontPath).toLowerCase();
    
    // FIXED: Use standard internet media types (MIME types)
    const mimeTypes = {
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
        '.ttf': 'font/truetype',
        '.otf': 'font/opentype'
    };
    const mimeType = mimeTypes[fontExt] || 'font/woff2';

    return {
        fontBase64,
        mimeType,
        fontFormat: fontExt.slice(1), // 'woff2', 'ttf', etc.
        fontFamily: 'SF Pro Display'
    };
}

module.exports = {
    buildFinalSVG,
    overlayText,
    overlayCircle,
    overlayRectangle
};
