const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const { overlayText, overlayCircle, overlayRectangle, buildFinalSVG } = require('../../utils/graphics.js');
const { getTextWidth, splitTextIntoLines, getCalendarEvents } = require('./calendar_render_helper.js');


async function calendar_render() {
    try {
        //  Load font resource
        const baseImage = sharp('assets/calendar/skeleton-dark.png');


        //  Calculate date texts
        const today = new Date();
        const dayOfWeek = today.getDay();  // 0 (Sun) to 6 (Sat)
        const prevSunday = today.getDate() - dayOfWeek;

        const dateNumbers = [];
        for (let i = 0; i < 14; i++) {
            const date_i = new Date(today.getFullYear(), today.getMonth(), prevSunday + i);
            dateNumbers.push(date_i.getDate().toString());
        }


        //  Overlay date texts, red circle, events
        const start_x = 85;
        const step_x = 172;
        const start_y = 1040;
        const step_y = 580;

        let svgInnerContent = '';

        const events = await getCalendarEvents();

        for (let i = 0; i < dateNumbers.length; i++) {
            const x = start_x + step_x * (i % 7);
            const y = start_y + step_y * Math.floor(i / 7);
            // const color = (i === dayOfWeek) ? '#FFF' : ((i % 7 === 0 || i % 7 === 6) ? '#8A8A8D' : '#000000');
            const color = (i === dayOfWeek) ? '#FFF' : ((i % 7 === 0 || i % 7 === 6) ? '#8D8D92' : '#FFFFFF');
            const fontWeight = (i === dayOfWeek) ? 700 : 563;

            //  Overlay red circle for today
            if (i === dayOfWeek) {
                svgInnerContent += overlayCircle(x, y);
            }

            //  Overlay date text
            svgInnerContent += overlayText(dateNumbers[i], x, y, 56, fontWeight, color);



            // ================================  Calculate height / event  ================================ //

            //  Constants
            const lineHeight = 43.2;        //  1.2 * font size (36)
            const eventInnerPadding = 3.4;    //  (rectHeight - lineHeight) / 2
            const eventOuterPadding = 15;

            const textPadding = 20;

            const maxLineWidth = 140 - 4;    //  small buffer
            const maxHeight = 400;


            //  Calculate total number of lines
            const todaysEvents = events.filter(event => event.daysFromToday === i);

            todaysEvents.forEach((event, index) => {
                const estimatedWidth = getTextWidth(event.title) + textPadding + 13;  //  buffer to prevent overflow
                event.numLines = Math.ceil(estimatedWidth / maxLineWidth);
                console.log(event.title, event.numLines);
                event.lines = splitTextIntoLines(event.title, maxLineWidth, event.numLines);
            });


            // ================================  Overlay events for the day  ================================ //
            for (let todaysEventsIndex = 0; todaysEventsIndex < todaysEvents.length; todaysEventsIndex++) {
                const event = todaysEvents[todaysEventsIndex];

                //  Overlay background
                const numberOfLines = event.allDay ? event.numLines : event.numLines + 1;
                const rectLength = 160;
                const rectHeight = (numberOfLines * lineHeight) + (eventInnerPadding * 2);
                const rectX = x - 80;
                // const rectY = y + 75 + (todaysEventsIndex * (rectHeight + eventOuterPadding));
                const rectY = y + 75 + todaysEvents.slice(0, todaysEventsIndex).reduce((acc, ev) => {
                    const numberOfLines = ev.allDay ? ev.numLines : ev.numLines + 1;
                    return acc + (numberOfLines * lineHeight) + (eventInnerPadding * 2) + eventOuterPadding;
                }, 0);

                svgInnerContent += overlayRectangle(rectX, rectY, rectLength, rectHeight, event.color.background);

                //  Overlay title text
                const textX = rectX + 10;
                const textY = rectY + 25;

                for (let lineIndex = 0; lineIndex < event.lines.length; lineIndex++) {
                    const lineText = event.lines[lineIndex];
                    const lineTextY = textY + lineIndex * lineHeight;

                    svgInnerContent += overlayText(
                        lineText,
                        textX,
                        lineTextY,
                        36,
                        600,
                        event.color.titleText,
                        alignment = 'start'
                    );
                }

                //  Overlay time text
                if (!event.allDay) {
                    const timeText = event.start;
                    const timeTextX = rectX + 10;
                    const timeTextY = textY + (event.lines.length * lineHeight);

                    svgInnerContent += overlayText(
                        timeText,
                        timeTextX,
                        timeTextY,
                        36,
                        500,
                        event.color.timeText,
                        alignment = 'start'
                    );
                }

            }

        }


        //  Build final SVG
        const finalSvg = buildFinalSVG(svgInnerContent);

        console.log('Image saved successfully!');

        return await baseImage
            .composite([{ input: Buffer.from(finalSvg), top: 0, left: 0 }])
            .toFile('output.png');
            // .toBuffer();

    } catch (error) {
        console.error('Error generating image:', error);
    }
}

calendar_render();




// ============================================================================================================= //

module.exports = {
    calendar_render
};
