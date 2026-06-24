const sharp = require('sharp');
const { getCalendarEvents } = require('./calendar_render_helper');

const W = 1179;
const H = 2556;

const BOTTOM_OFFSET = 0;  // positive = push grid down, negative = push up
const SAFE_TOP    = Math.round(1040 / 2622 * H) + BOTTOM_OFFSET;
const SAFE_BOTTOM = 90;
const HEADER_H    = 72;
const GRID_TOP    = SAFE_TOP + HEADER_H;
const GRID_BOTTOM = H - SAFE_BOTTOM;
const ROWS = 4;
const COLS = 7;
const ROW_H = (GRID_BOTTOM - GRID_TOP) / ROWS;
const COL_W = W / COLS;

const EVT_FONT = 18;
const PILL_LINE_H = 20;
const PILL_VPAD   = 6;
const PILL_GAP    = 4;
const EVT_TOP     = 108;  // offset from rowY where event zone begins

// ── Primitives ────────────────────────────────────────────────────────────────

const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const T = (content, x, y, size, weight, color, anchor = 'middle') =>
    `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${color}" ` +
    `text-anchor="${anchor}" dominant-baseline="central">${esc(content)}</text>`;

const R = (x, y, w, h, fill, rx = 0) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" rx="${rx}"/>`;

const C = (cx, cy, r, fill) =>
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`;

const L = (x1, y1, x2, y2, color, op = 1) =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1" opacity="${op}"/>`;

function wrapTitle(title, pillWidthPx) {
    const maxChars = Math.floor(pillWidthPx / (EVT_FONT * 0.6));
    if (title.length <= maxChars) return [title];
    const words = title.split(' ');
    let line1 = '';
    let i = 0;
    while (i < words.length && (line1 + (line1 ? ' ' : '') + words[i]).length <= maxChars) {
        line1 += (line1 ? ' ' : '') + words[i];
        i++;
    }
    if (!line1) {
        return [title.substring(0, maxChars - 1) + '-', title.substring(maxChars - 1)];
    }
    const line2 = words.slice(i).join(' ');
    return line2 ? [line1, line2] : [line1];
}

// Greedy lane assignment: pack non-overlapping spans into the same lane.
// Each span needs {colA, colB}; gets a .lane property assigned.
function assignLanes(spans) {
    const lanes = []; // lanes[i] = list of col ranges already in lane i
    for (const span of spans) {
        let placed = false;
        for (let li = 0; li < lanes.length; li++) {
            const conflict = lanes[li].some(r => span.colA <= r.colB && span.colB >= r.colA);
            if (!conflict) {
                span.lane = li;
                lanes[li].push(span);
                placed = true;
                break;
            }
        }
        if (!placed) {
            span.lane = lanes.length;
            lanes.push([span]);
        }
    }
    return spans;
}

// ── Main render ───────────────────────────────────────────────────────────────

async function calendar_render_2(events, startDate = new Date()) {
    const today = new Date(startDate);
    const dow   = today.getDay();
    const DAY_S = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    // Deduplicate multi-day spans; keep individual entries for single-day events
    const seenSpans       = new Set();
    const multiDaySpans   = [];
    const singleDayEvents = [];

    for (const evt of events) {
        const isMultiDay = evt.allDay && evt.spanStart !== undefined && (evt.spanEnd - evt.spanStart) > 1;
        if (isMultiDay) {
            const key = `${evt.title}|${evt.spanStart}`;
            if (!seenSpans.has(key)) {
                seenSpans.add(key);
                multiDaySpans.push(evt);
            }
        } else {
            singleDayEvents.push(evt);
        }
    }

    let s = '';
    s += R(0, 0, W, H, '#000000');

    // Day-of-week headers
    for (let col = 0; col < COLS; col++) {
        const cx      = COL_W * col + COL_W / 2;
        const isWknd  = col === 0 || col === 6;
        const isToday = col === dow;
        const color   = isToday ? '#FF3B30' : isWknd ? '#505050' : '#666666';
        s += T(DAY_S[col], cx, SAFE_TOP + HEADER_H / 2, 26, 700, color, 'middle');
    }
    s += L(0, GRID_TOP, W, GRID_TOP, '#484848');

    // 4-week grid
    for (let row = 0; row < ROWS; row++) {
        const rowY     = GRID_TOP + row * ROW_H;
        const rowStart = row * COLS;
        const rowEnd   = rowStart + COLS - 1;

        if (row > 0) s += L(0, rowY, W, rowY, '#3A3A3A');
        for (let col = 1; col < COLS; col++) {
            s += L(COL_W * col, rowY, COL_W * col, rowY + ROW_H, '#333333');
        }

        // ── Multi-day spans for this row ──────────────────────────────────────
        // Clip each span to this row's column range, assign non-overlapping lanes
        const rowSpans = multiDaySpans
            .filter(span => span.spanStart <= rowEnd && (span.spanEnd - 1) >= rowStart)
            .map(span => ({
                ...span,
                colA: Math.max(span.spanStart, rowStart) % COLS,
                colB: Math.min(span.spanEnd - 1, rowEnd)  % COLS,
                isFirstSegment: span.spanStart >= rowStart,
            }));

        assignLanes(rowSpans);

        // Per-column: highest lane index covering that column (-1 = no spans)
        const colMaxLane = new Array(COLS).fill(-1);
        for (const span of rowSpans) {
            for (let c = span.colA; c <= span.colB; c++) {
                colMaxLane[c] = Math.max(colMaxLane[c], span.lane);
            }
        }

        // Draw multi-day pills (wide stretched rectangles, same style as regular pills)
        for (const span of rowSpans) {
            const pillH = PILL_LINE_H + PILL_VPAD * 2;
            const barY  = rowY + EVT_TOP + span.lane * (pillH + PILL_GAP);
            const pad   = 5;
            const barX  = COL_W * span.colA + pad;
            const barW  = COL_W * (span.colB - span.colA + 1) - pad * 2;
            const barCx = barX + barW / 2;

            s += `<rect x="${barX}" y="${barY}" width="${barW}" height="${pillH}" rx="4" fill="#000000"/>`;
            s += `<rect x="${barX}" y="${barY}" width="${barW}" height="${pillH}" ` +
                 `rx="4" fill="${span.color.titleText}" fill-opacity="0.22"/>`;
            s += `<rect x="${barX + 1}" y="${barY + 1}" width="3" height="${pillH - 2}" rx="1" fill="${span.color.titleText}"/>`;

            const barCenterX = barX + barW / 2;
            const lines  = wrapTitle(span.title, barW - 10);
            for (let li = 0; li < lines.length; li++) {
                let textX;
                if (span.isFirstSegment || span.colA === span.colB) {
                    textX = barCenterX;
                    s += T(lines[li], textX, barY + PILL_VPAD + PILL_LINE_H * (li + 0.5), EVT_FONT, 400, span.color.titleText, 'middle');
                } else {
                    textX = barX + 12;
                    s += T(lines[li], textX, barY + PILL_VPAD + PILL_LINE_H * (li + 0.5), EVT_FONT, 400, span.color.titleText, 'start');
                }
            }
        }

        // ── Per-column: date numbers + single-day events ──────────────────────
        for (let col = 0; col < COLS; col++) {
            const dayIdx  = row * COLS + col;
            const cx      = COL_W * col + COL_W / 2;
            const d       = new Date(today.getFullYear(), today.getMonth(), today.getDate() - dow + dayIdx);
            const dn      = d.getDate();
            const isToday = dayIdx === dow;
            const isPast  = dayIdx < dow;
            const isWknd  = col === 0 || col === 6;

            // Date number
            const numY = rowY + 58;

            const numColor = isToday ? '#FF3B30'
                           : isWknd  ? '#606060'
                           :           '#AAAAAA';
            s += T(dn, cx, numY, 36, isToday ? 700 : 400, numColor, 'middle');
            if (isToday) s += R(cx - 10, numY + 30, 20, 3, '#FF3B30', 2);

            if (isPast || dayIdx > 27) continue;

            const dayEvts = singleDayEvents.filter(e => e.daysFromToday === dayIdx);
            if (dayEvts.length === 0) continue;

            const pillX      = COL_W * col + 5;
            const pillW      = COL_W - 10;
            const textMaxPx  = pillW - 20;
            const cellBottom = rowY + ROW_H - 10;

            // Start below any multi-day bars covering this column
            const pillH0 = PILL_LINE_H + PILL_VPAD * 2;
            const offset = colMaxLane[col] >= 0
                ? (colMaxLane[col] + 1) * (pillH0 + PILL_GAP)
                : 0;
            let evtY = rowY + EVT_TOP + offset;

            for (let ei = 0; ei < dayEvts.length; ei++) {
                const evt       = dayEvts[ei];
                const lines     = wrapTitle(evt.title, textMaxPx);
                const extraLine = evt.allDay ? 0 : 1;
                const pillH     = (lines.length + extraLine) * PILL_LINE_H + PILL_VPAD * 2;

                if (evtY + pillH > cellBottom) {
                    const rem = dayEvts.length - ei;
                    if (rem > 0) s += T(`+${rem}`, cx, evtY + 8, 14, 700, '#555555', 'middle');
                    break;
                }

                s += `<rect x="${pillX}" y="${evtY}" width="${pillW}" height="${pillH}" rx="4" fill="#000000"/>`;
                s += `<rect x="${pillX}" y="${evtY}" width="${pillW}" height="${pillH}" ` +
                     `rx="4" fill="${evt.color.titleText}" fill-opacity="0.22"/>`;
                s += `<rect x="${pillX + 1}" y="${evtY + 1}" width="3" height="${pillH - 2}" rx="1" fill="${evt.color.titleText}"/>`;

                const pillCx = pillX + pillW / 2;
                for (let li = 0; li < lines.length; li++) {
                    s += T(lines[li], pillCx, evtY + PILL_VPAD + PILL_LINE_H * (li + 0.5), EVT_FONT, 400, evt.color.titleText, 'middle');
                }
                if (!evt.allDay) {
                    s += T(evt.start, pillCx, evtY + PILL_VPAD + PILL_LINE_H * (lines.length + 0.5), EVT_FONT - 2, 400, evt.color.timeText, 'middle');
                }

                evtY += pillH + PILL_GAP;
            }
        }
    }

    s += L(0, GRID_BOTTOM, W, GRID_BOTTOM, '#3A3A3A');
    s += L(1, GRID_TOP, 1, GRID_BOTTOM, '#3A3A3A');
    s += L(W - 1, GRID_TOP, W - 1, GRID_BOTTOM, '#3A3A3A');

    const svg =
        `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"
     xmlns="http://www.w3.org/2000/svg"
     font-family="Courier New, Courier, monospace">
  ${s}
</svg>`;

    return await sharp(Buffer.from(svg)).png().toBuffer();
}

// (async () => {
//     const events = await getCalendarEvents();
//     const buf = await calendar_render(events);
//     require('fs').writeFileSync('calendar_2_output.png', buf);
//     console.log('Done → calendar_2_output.png');
// })();

module.exports = { calendar_render_2 };
