const { DAVClient } = require("tsdav");
const ICAL = require("ical.js");

async function main() {
    const client = new DAVClient({
        serverUrl: "https://caldav.icloud.com",
        credentials: {
            username: "shash.srivatsa@icloud.com",
            password: "xxxx-xxxx-xxxx-xxxx",
        },
        authMethod: "Basic",
        defaultAccountType: "caldav",
    });

    await client.login();

    const calendars = await client.fetchCalendars();
    const events = await client.fetchCalendarObjects({
        calendar: calendars[0],
        timeRange: {
            start: new Date("2026-10-01").toISOString(),
            end: new Date("2026-10-31").toISOString(),
        },
    });

    for (const event of events) {
        const parsed = ICAL.parse(event.data);
        const comp = new ICAL.Component(parsed);
        const vevent = comp.getFirstSubcomponent("vevent");
        const ev = new ICAL.Event(vevent);
        console.log(ev.summary, ev.startDate.toJSDate());
    }
}

main();
