const { google } = require('googleapis');
const { getAuthClient } = require('./google_auth');

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

const dark_colors_map = {
    primary: { background: "#2F2740", titleText: "#B99AFE", timeText: "#947BCC" },
    noSchool: { background: "#393A3A", titleText: "#E4E8E7", timeText: "#B6BAB8" },
    tests: { background: "#460E06", titleText: "#FF401C", timeText: "#E23314" },
    school: { background: "#3F3600", titleText: "#FED800", timeText: "#CBAD03" },
    personal: { background: "#253730", titleText: "#92E0C0", timeText: "#74B49A" },
    projects: { background: "#3E1D00", titleText: "#FB7500", timeText: "#C85D00" },
    misc: { background: "#3E0F34", titleText: "#FC38D1", timeText: "#CA2DA7" },
    usHolidays: { background: "#062B3E", titleText: "#1BADF7", timeText: "#FFFFFF" },
}


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




async function getCalendarEvents(startDate = new Date()) {

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

    //  Four weeks after lastSunday (covers the full 4-week grid)
    const fourWeeksLater = new Date(lastSunday);
    fourWeeksLater.setDate(lastSunday.getDate() + 28);

    //  Fetch events — tag each item with its calendar key at fetch time
    const calendarRequests = Object.entries(calendars).map(([name, calId]) =>
        calendar.events.list({
            calendarId: calId,
            timeMin: lastSunday.toISOString(),
            timeMax: fourWeeksLater.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
            maxResults: 500,
        }).then(res => (res.data.items || []).map(item => ({ ...item, _calendarKey: name })))
    );

    const eventArrays = await Promise.all(calendarRequests);
    let events = eventArrays.flat();

    //  Sort events by start time
    events.sort((a, b) => {
        const dateA = new Date(a.start.dateTime || a.start.date);
        const dateB = new Date(b.start.dateTime || b.start.date);
        return dateA - dateB;
    });

    //  calendarStart = lastSunday at 11:59 PM (local time)
    const calendarStart = new Date(lastSunday.getFullYear(), lastSunday.getMonth(), lastSunday.getDate(), 23, 59, 0);

    // Parse an all-day date string ("YYYY-MM-DD") as LOCAL noon to avoid UTC shift
    const parseLocalDate = (dateStr) => {
        const [y, m, d] = dateStr.split('-').map(Number);
        return new Date(y, m - 1, d, 12, 0, 0);
    };

    const diffDaysFrom = (localDate) =>
        Math.ceil((localDate.getTime() - calendarStart.getTime()) / (1000 * 60 * 60 * 24));

    const calendarKey = (event) =>
        event._calendarKey ||
        Object.keys(calendars).find(key => calendars[key] === event.organizer?.email);

    //  Format: expand multi-day all-day events across every day they span
    events = events.flatMap(event => {
        const allDay = !!event.start.date;
        const color  = dark_colors_map[calendarKey(event)];

        if (allDay) {
            const dayStart = parseLocalDate(event.start.date);
            // end.date is exclusive (Google convention), default to next day
            const dayEnd   = event.end?.date ? parseLocalDate(event.end.date) : new Date(dayStart.getTime() + 86400000);

            const spanStart = diffDaysFrom(dayStart);
            const spanEnd   = diffDaysFrom(dayEnd);  // exclusive

            const entries = [];
            const cursor  = new Date(dayStart);
            while (cursor < dayEnd) {
                entries.push({
                    title: event.summary,
                    color,
                    daysFromToday: diffDaysFrom(cursor),
                    allDay: true,
                    start: null,
                    spanStart,
                    spanEnd,
                });
                cursor.setDate(cursor.getDate() + 1);
            }
            return entries;
        }

        // Timed event — parse time directly from ISO string; Google sends time already in event's local timezone
        const m = event.start.dateTime.match(/T(\d{2}):(\d{2})/);
        let hours = parseInt(m[1], 10);
        const minutes = parseInt(m[2], 10);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        const startText = minutes === 0
            ? `${hours} ${ampm}`
            : `${hours}:${String(minutes).padStart(2, '0')} ${ampm}`;

        return [{
            title: event.summary,
            color,
            daysFromToday: diffDaysFrom(dt),
            allDay: false,
            start: startText,
        }];
    });

    return events;
}


// getCalendarEvents();


module.exports = {
    getTextWidth,
    splitTextIntoLines,
    getCalendarEvents,
};
