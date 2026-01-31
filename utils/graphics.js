const fs = require('fs');
const path = require('path');

// Load the resource once at startup
const fontResource = loadFontResource('SF-Pro-Display-Medium.woff2');

function buildFinalSVG(svgInnerContent) {
    // FIX 1: Use a unique name to ensure we don't rely on local system fonts
    const uniqueFontFamily = 'SF Pro Embedded';
    
    // FIX 2: Correct src syntax (remove charset=utf-8)
    // FIX 3: Set font-weight to 500 (Medium) since this is a static Medium file
    return `
        <svg width="1206" height="2622" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <style>
                    @font-face {
                        font-family: '${uniqueFontFamily}';
                        src: url('data:${fontResource.mimeType};base64,${fontResource.fontBase64}') format('${fontResource.fontFormat}');
                        font-weight: 500;
                        font-style: normal;
                    }
                </style>
            </defs>
            ${svgInnerContent}
        </svg>
    `;
}

function overlayText(text, x, y, fontSize, fontWeight, color, alignment='middle') {
    // Use the unique name here as well
    // Note: Since the file is static Medium (500), requesting other weights 
    // (like 700 or 300) might result in "faux bold" or fallback depending on the renderer.
    return `
        <text x="${x}" y="${y}" 
            fill="${color}" 
            font-family="'SF Pro Embedded', sans-serif" 
            font-weight="500" 
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
        throw new Error(`Font file not found: ${fontFilename}`);
    }

    const fontBuffer = fs.readFileSync(fontPath);
    const fontBase64 = fontBuffer.toString('base64');
    const fontExt = path.extname(fontPath).toLowerCase();
    
    const mimeTypes = {
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
        '.ttf': 'font/ttf',
        '.otf': 'font/otf'
    };

    return {
        fontBase64,
        mimeType: mimeTypes[fontExt] || 'font/woff2',
        fontFormat: fontExt.slice(1), // e.g., 'woff2'
        fontFamily: 'SF Pro Embedded' // Internal reference name
    };
}



module.exports = {
    buildFinalSVG,
    overlayText,
    overlayCircle,
    overlayRectangle
};
