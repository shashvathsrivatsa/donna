const { google } = require('googleapis');
const { getAuthClient } = require('./google_auth');


function getTextWidth(text) {
    const wideCharWidth = 32;
    const mediumCharWidth = 20;
    const narrowCharWidth = 10;

    const narrowChars = text.match(/[ilI1frtj!.,:;()\[\]\s\/\\]/g)?.length ?? 0;
    const wideChars = text.match(/[MW@#%mwGOQDHKNUR&]/g)?.length ?? 0;
    const mediumChars = text.length - wideChars - narrowChars;

    const estimatedWidth = (wideChars * wideCharWidth) + (mediumChars * mediumCharWidth) + (narrowChars * narrowCharWidth);

    return estimatedWidth;
}


function splitTextIntoLines(text, maxLineWidth, numLines) {
    const lines = [];
    let remainingText = text;

    for (let lineIndex = 0; lineIndex < numLines; lineIndex++) {
        // If this is the last line or remaining text fits, add it all
        if (lineIndex === numLines - 1 || getTextWidth(remainingText) <= maxLineWidth) {
            lines.push(remainingText);
            break;
        }

        // Try to split at a word boundary
        let bestSplit = -1;
        let testText = '';
        const words = remainingText.split(' ');

        // Build up text word by word until we exceed maxLineWidth
        for (let i = 0; i < words.length; i++) {
            const testWithNextWord = testText + (testText ? ' ' : '') + words[i];
            if (getTextWidth(testWithNextWord) <= maxLineWidth) {
                testText = testWithNextWord;
                bestSplit = i;
            } else {
                break;
            }
        }

        // If we found a good word boundary split
        if (bestSplit >= 0 && testText.length > 0) {
            lines.push(testText);
            remainingText = words.slice(bestSplit + 1).join(' ');
        } else {
            // No word boundary works, split mid-word with hyphen
            let charCount = 0;
            for (let i = 1; i < remainingText.length; i++) {
                const testChunk = remainingText.substring(0, i) + '-';
                if (getTextWidth(testChunk) > maxLineWidth) {
                    charCount = i - 1;
                    break;
                }
                charCount = i;
            }

            if (charCount > 0) {
                lines.push(remainingText.substring(0, charCount) + '-');
                remainingText = remainingText.substring(charCount);
            } else {
                // Edge case: even single char + hyphen is too wide
                lines.push(remainingText.substring(0, 1));
                remainingText = remainingText.substring(1);
            }
        }
    }

    return lines;
}




async function getCalendarEvents(startDate) {
    if (!startDate) {
        const now = new Date();
        startDate = new Date(now.getTime() - (5 * 60 * 60 * 1000));    // manually minus 5 hours
    }

    //  Initialize Google Calendar API
    const auth = await getAuthClient();
    const calendar = google.calendar({ version: 'v3', auth });

    const calendars = {
        usHolidays: "6lqpbv8647igscie1ictda2c57nigmcn@import.calendar.google.com",
        noSchool: "7cbee8ced370d19e708df09375de71a002c35f5e3699c0dd92e8c9ddd4be8a94@group.calendar.google.com",
        primary: "shashvaths@gmail.com",
        tests: "mg4duct3mt76nk62ck4gi0mof0@group.calendar.google.com",
        school: "7i5hfg2oa2du7s2s31v558qtno@group.calendar.google.com",
        personal: "9e47nm9itkfkenuok05l9h329k@group.calendar.google.com",
        projects: "faef4cc31f36673614361df2ff52ebdbd3804940196f6b371a08441380fe29ec@group.calendar.google.com",
        misc: "s6pnfbbf3nungnbj5il2ra7teo@group.calendar.google.com",
    };


    //  Calculate time range
    const lastSunday = startDate;
    lastSunday.setDate(lastSunday.getDate() - lastSunday.getDay());
    lastSunday.setHours(0, 0, 0, 0);

    const twoWeeksLater = new Date();
    twoWeeksLater.setDate(lastSunday.getDate() + 14);


    //  Fetch events
    const calendarRequests = Object.values(calendars).map(calId =>
        calendar.events.list({
            calendarId: calId,
            timeMin: lastSunday.toISOString(),
            timeMax: twoWeeksLater.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
            maxResults: 250,
        })
    );

    const responses = await Promise.all(calendarRequests);
    let events = responses.flatMap(res => res.data.items || []);


    //  Sort events by start time
    events.sort((a, b) => {
        const dateA = new Date(a.start.dateTime || a.start.date);
        const dateB = new Date(b.start.dateTime || b.start.date);
        return dateA - dateB;
    });

    //  Format & return
    const light_colors_map = {
        primary: { background: "#EEE5FF", titleText: "#5D4C7F", timeText: "#8A74BF" },
        noSchool: { background: "#F8F9FA", titleText: "#737474", timeText: "#AAAFAE" },
        tests: { background: "#FFC8BF", titleText: "#801400", timeText: "#BE1C00" },
        school: { background: "#FEF5BE", titleText: "#7F6D00", timeText: "#BEA200" },
        personal: { background: "#E4F6EE", titleText: "#487061", timeText: "#6CA990" },
        projects: { background: "#FDDBBF", titleText: "#7D3A00", timeText: "#BB5702" },
        misc: { background: "#FECDF3", titleText: "#7F1C68", timeText: "#BD2A9D" },
        usHolidays: { background: "#C5EAFD", titleText: "#0D577C", timeText: "#1A82BF" },
    }

    events = events.map(event => {
        const allDay = !!event.start.date;

        let startDate = new Date(event.start.dateTime || event.start.date);
        if (allDay) startDate = new Date(startDate.getTime() + (5 * 60 * 60 * 1000));

        const diffTime = startDate.getTime() - lastSunday.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        //  Calculate start text - either "3 PM" or "3:30 PM" (if minute is 00, omit minutes)
        const startText = event.start.dateTime ? (() => {
            const dateObj = new Date(event.start.dateTime);
            let hours = dateObj.getHours();
            const minutes = dateObj.getMinutes();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12; // the hour '0' should be '12'
            const minutesStr = minutes < 10 ? '0' + minutes : minutes;
            return minutes === 0 ? `${hours} ${ampm}` : `${hours}:${minutesStr} ${ampm}`;
        })() : null;

        return {
            title: event.summary,
            color: light_colors_map[Object.keys(calendars).find(key => calendars[key] === event.organizer.email)],
            daysFromToday: diffDays,
            allDay: allDay,
            start: startText,
        }
    });

    return events;
}


// getCalendarEvents();


module.exports = {
    getTextWidth,
    splitTextIntoLines,
    getCalendarEvents,
};
