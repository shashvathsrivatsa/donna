const test = require('node:test');
const assert = require('node:assert/strict');

const {
    CALENDAR_TIME_ZONE,
    formatEventTime,
    getCalendarGrid,
    getEventDayIndex,
} = require('./calendar_render_helper');

test('calendar has an explicit Pacific timezone', () => {
    assert.equal(CALENDAR_TIME_ZONE, 'America/Los_Angeles');
});

test('formats a UTC next-day instant as the correct Pacific evening time', () => {
    assert.equal(formatEventTime('2026-07-14T01:00:00Z'), '6 PM');
});

test('places that UTC next-day instant on the previous Pacific calendar day', () => {
    const startDate = new Date('2026-07-13T19:00:00Z'); // Monday noon Pacific
    assert.equal(getCalendarGrid(startDate).dayOfWeek, 1);
    assert.equal(getEventDayIndex('2026-07-14T01:00:00Z', startDate), 1);
});

test('calendar calculations are stable across a daylight-saving boundary', () => {
    const startDate = new Date('2026-03-08T20:00:00Z');
    assert.equal(getEventDayIndex('2026-03-09T01:00:00Z', startDate), 0);
    assert.equal(getEventDayIndex('2026-03-09T06:30:00Z', startDate), 0);
    assert.equal(getEventDayIndex('2026-03-09T07:30:00Z', startDate), 1);
});
