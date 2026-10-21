const path = require('path');
const config = require(path.join(__dirname, '..', 'config', 'timezone.json'));

const ABBR_MAP = config._timezone_options;

function resolveTimezone(abbr) {
    return ABBR_MAP[abbr] || abbr; // fall through if already an IANA name
}

const IANA = resolveTimezone(config.timezone);

// UTC offset in hours for the configured timezone (accounts for DST)
function getUTCOffsetHours() {
    const now = new Date();
    const utcStr = now.toLocaleString('en-US', { timeZone: 'UTC', hour12: false, hour: '2-digit', minute: '2-digit' });
    const localStr = now.toLocaleString('en-US', { timeZone: IANA, hour12: false, hour: '2-digit', minute: '2-digit' });
    const [utcH, utcM] = utcStr.split(':').map(Number);
    const [locH, locM] = localStr.split(':').map(Number);
    return (locH - utcH) + (locM - utcM) / 60;
}

module.exports = { IANA, getUTCOffsetHours };
