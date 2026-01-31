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
                        src: url(data:${fontResource.mimeType};charset=utf-8;base64,${fontResource.fontBase64}) format('${fontResource.fontFormat}');
                        font-weight: 100 900; 
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

    // Add error checking
    if (!fs.existsSync(fontPath)) {
        console.error(`Font file not found at: ${fontPath}`);
        console.error(`Current directory: ${__dirname}`);
        throw new Error(`Font file not found: ${fontFilename}`);
    } else {
        console.log(`Font file found at: ${fontPath}`);
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
    const mimeType = mimeTypes[fontExt] || 'font/woff2';

    return {
        fontBase64,
        mimeType,
        fontFormat: fontExt.slice(1),
        fontFamily: 'SF Pro Display'
    };
}



module.exports = {
    buildFinalSVG,
    overlayText,
    overlayCircle,
    overlayRectangle
};
