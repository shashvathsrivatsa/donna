const fs = require('fs');
const path = require('path');


const font = "SF Pro Normal";


function overlayText(text, x, y, fontSize, fontWeight, color, alignment='middle') {
    return `
        <text x="${x}" y="${y}" 
            fill="${color}" 
            font-family="${font}" 
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




function buildFinalSVG(svgInnerContent) {
    return `
        <svg width="1206" height="2622" xmlns="http://www.w3.org/2000/svg">
            ${svgInnerContent}
        </svg>
    `;
}
            // <defs>
            //     <style>
            //         @font-face {
            //             font-family="${font}"; 
            //             font-weight: 100 900; 
            //             font-style: normal;
            //             font-display: block;
            //         }
            //     </style>
            // </defs>




module.exports = {
    overlayText,
    overlayCircle,
    overlayRectangle,
    buildFinalSVG
};
