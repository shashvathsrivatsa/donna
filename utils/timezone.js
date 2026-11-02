const path = require('path');
const config = require(path.join(__dirname, '..', 'config', 'timezone.json'));

const ABBR_MAP = config._timezone_options;

function resolveTimezone(abbr) {
    return ABBR_MAP[abbr] || abbr; // fall through if already an IANA name
}

const IANA = resolveTimezone(config.timezone);

// Returns the current day-of-month in the configured timezone
function getLocalDate() {
    return Number(new Intl.DateTimeFormat('en-US', { timeZone: IANA, day: 'numeric' }).format(new Date()));
}

module.exports = { IANA, getLocalDate };
