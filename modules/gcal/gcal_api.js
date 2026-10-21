const { google } = require('googleapis');
const { getAuthClient } = require('./google_auth');

const { IANA: CALENDAR_TIME_ZONE } = require('../../utils/timezone');
const { calendars: CALENDARS } = require('../../config/calendar.json');
const DAY_MS = 24 * 60 * 60 * 1000;

const calendarDateFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: CALENDAR_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
});

const calendarTimeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: CALENDAR_TIME_ZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
});

const calendarDateTimeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: CALENDAR_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
});

function datePartsInCalendarTimeZone(date) {
    const parts = Object.fromEntries(
        calendarDateFormatter.formatToParts(date)
            .filter(part => part.type !== 'literal')
            .map(part => [part.type, Number(part.value)])
    );
    return { year: parts.year, month: parts.month, day: parts.day };
}

function datePartsToOrdinal({ year, month, day }) {
    return Math.floor(Date.UTC(year, month - 1, day) / DAY_MS);
}

function dateStringToOrdinal(dateString) {
    const [year, month, day] = dateString.split('-').map(Number);
    return datePartsToOrdinal({ year, month, day });
}

function ordinalToDateParts(ordinal) {
    const date = new Date(ordinal * DAY_MS);
    return {
        year: date.getUTCFullYear(),
        month: date.getUTCMonth() + 1,
        day: date.getUTCDate(),
    };
}

function getCalendarGrid(startDate = new Date()) {
    const current = datePartsInCalendarTimeZone(new Date(startDate));
    const currentOrdinal = datePartsToOrdinal(current);
    const dayOfWeek = new Date(currentOrdinal * DAY_MS).getUTCDay();
    return {
        currentOrdinal,
        dayOfWeek,
        startOrdinal: currentOrdinal - dayOfWeek,
    };
}

function getEventDayIndex(dateTime, startDate = new Date()) {
    const eventOrdinal = datePartsToOrdinal(datePartsInCalendarTimeZone(new Date(dateTime)));
    return eventOrdinal - getCalendarGrid(startDate).startOrdinal;
}

function formatEventTime(dateTime) {
    return calendarTimeFormatter.format(new Date(dateTime)).replace(':00 ', ' ');
}

// Convert a calendar-local midnight to an instant without depending on the
// machine's timezone. A second pass handles a DST offset change near the guess.
function calendarMidnightToDate({ year, month, day }) {
    const guess = Date.UTC(year, month - 1, day);
    const getOffset = (instant) => {
        const parts = Object.fromEntries(
            calendarDateTimeFormatter.formatToParts(new Date(instant))
                .filter(part => part.type !== 'literal')
                .map(part => [part.type, Number(part.value)])
        );
        return Date.UTC(
            parts.year,
            parts.month - 1,
            parts.day,
            parts.hour,
            parts.minute,
            parts.second
        ) - instant;
    };
    let instant = guess - getOffset(guess);
    instant = guess - getOffset(instant);
    return new Date(instant);
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

    //  Calculate time range
    const { startOrdinal } = getCalendarGrid(startDate);
    const lastSunday = calendarMidnightToDate(ordinalToDateParts(startOrdinal));
    const fourWeeksLater = calendarMidnightToDate(ordinalToDateParts(startOrdinal + 28));

    //  Fetch events — tag each item with its calendar key at fetch time
    const calendarRequests = Object.entries(CALENDARS).map(([name, entry]) =>
        calendar.events.list({
            calendarId: entry.id,
            timeMin: lastSunday.toISOString(),
            timeMax: fourWeeksLater.toISOString(),
            timeZone: CALENDAR_TIME_ZONE,
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

    const calendarKey = (event) =>
        event._calendarKey ||
        Object.keys(CALENDARS).find(key => CALENDARS[key].id === event.organizer?.email);

    //  Format: expand multi-day all-day events across every day they span
    events = events.flatMap(event => {
        const allDay = !!event.start.date;
        const key = calendarKey(event);
        const color = CALENDARS[key]?.dark;

        if (allDay) {
            const dayStart = dateStringToOrdinal(event.start.date);
            // end.date is exclusive (Google convention), default to next day
            const dayEnd = event.end?.date ? dateStringToOrdinal(event.end.date) : dayStart + 1;

            const spanStart = dayStart - startOrdinal;
            const spanEnd = dayEnd - startOrdinal;  // exclusive

            const entries = [];
            let cursor = dayStart;
            while (cursor < dayEnd) {
                entries.push({
                    title: event.summary,
                    color,
                    daysFromToday: cursor - startOrdinal,
                    allDay: true,
                    start: null,
                    spanStart,
                    spanEnd,
                });
                cursor += 1;
            }
            return entries;
        }

        const startText = formatEventTime(event.start.dateTime);

        return [{
            title: event.summary,
            color,
            daysFromToday: getEventDayIndex(event.start.dateTime, startDate),
            allDay: false,
            start: startText,
        }];
    });

    return events;
}


// getCalendarEvents();


module.exports = {
    CALENDAR_TIME_ZONE,
    datePartsInCalendarTimeZone,
    formatEventTime,
    getCalendarGrid,
    getEventDayIndex,
    ordinalToDateParts,
    getTextWidth,
    splitTextIntoLines,
    getCalendarEvents,
};
