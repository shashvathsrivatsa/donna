/**
 * Quick test script: generates calendar_test_output.png with mock events.
 * Run with: node test_calendar_render.js
 */

const { calendar_render_2 } = require('./modules/calendar/calendar_render_2');
const fs = require('fs');

// Mock events — format mirrors what getCalendarEvents() returns.
// daysFromToday: 0 = today (Sunday of the current week grid)
const mockEvents = [
    // Single-day timed events
    { title: 'Standup', daysFromToday: 1, start: '9:00 AM', allDay: false, color: { titleText: '#5AC8FA', timeText: '#4AABB8' } },
    { title: 'Lunch with Alex', daysFromToday: 2, start: '12:30 PM', allDay: false, color: { titleText: '#FF9500', timeText: '#CC7700' } },
    { title: 'Design Review', daysFromToday: 3, start: '2:00 PM', allDay: false, color: { titleText: '#FF2D55', timeText: '#CC0044' } },
    { title: 'Weekly Sync', daysFromToday: 4, start: '4:00 PM', allDay: false, color: { titleText: '#34C759', timeText: '#28A046' } },
    { title: 'Doctor Appointment', daysFromToday: 8, start: '10:00 AM', allDay: false, color: { titleText: '#FF9500', timeText: '#CC7700' } },
    { title: 'Team Offsite', daysFromToday: 10, start: '9:00 AM', allDay: false, color: { titleText: '#5856D6', timeText: '#4644AA' } },
    { title: 'Coffee Chat', daysFromToday: 15, start: '3:00 PM', allDay: false, color: { titleText: '#FF3B30', timeText: '#CC2200' } },

    // All-day single events
    { title: 'Holiday', daysFromToday: 5, allDay: true, color: { titleText: '#FFD60A', timeText: '#B89800' } },

    // Multi-day span (spanStart/spanEnd are day indices)
    { title: 'Vacation', spanStart: 9, spanEnd: 13, allDay: true, color: { titleText: '#64D2FF', timeText: '#3AAACC' }, daysFromToday: 9 },
    { title: 'Vacation', spanStart: 9, spanEnd: 13, allDay: true, color: { titleText: '#64D2FF', timeText: '#3AAACC' }, daysFromToday: 10 },
    { title: 'Vacation', spanStart: 9, spanEnd: 13, allDay: true, color: { titleText: '#64D2FF', timeText: '#3AAACC' }, daysFromToday: 11 },
    { title: 'Vacation', spanStart: 9, spanEnd: 13, allDay: true, color: { titleText: '#64D2FF', timeText: '#3AAACC' }, daysFromToday: 12 },

    // Another multi-day span overlapping vacation
    { title: 'Conf', spanStart: 11, spanEnd: 14, allDay: true, color: { titleText: '#FF9F0A', timeText: '#CC7700' }, daysFromToday: 11 },
    { title: 'Conf', spanStart: 11, spanEnd: 14, allDay: true, color: { titleText: '#FF9F0A', timeText: '#CC7700' }, daysFromToday: 12 },
    { title: 'Conf', spanStart: 11, spanEnd: 14, allDay: true, color: { titleText: '#FF9F0A', timeText: '#CC7700' }, daysFromToday: 13 },
];

(async () => {
    const buf = await calendar_render_2(mockEvents, new Date());
    fs.writeFileSync('calendar_test_output.png', buf);
    console.log('Done → calendar_test_output.png');
})();
