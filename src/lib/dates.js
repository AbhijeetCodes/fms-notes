// Helpers for calendar dates. `event_date` is a plain 'YYYY-MM-DD' string from
// Postgres — parse it as a LOCAL date so the day never shifts by a timezone.

export function parseDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayISO() {
  return toISO(new Date());
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// "Monday · 12 Oct 2026"
export function formatDayDate(iso) {
  const d = parseDate(iso);
  return `${DAYS[d.getDay()]} · ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
}

// "Mon, 12 Oct"
export function formatShortDayDate(iso) {
  const d = parseDate(iso);
  return `${WEEKDAY_LABELS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
}

export function formatMonthYear(year, month) {
  return `${MONTHS[month]} ${year}`;
}

// Whole days from today to the event date (negative = past).
export function daysUntil(iso) {
  const target = parseDate(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target - today) / 86400000);
}

export function countdownLabel(iso) {
  const n = daysUntil(iso);
  if (n < 0) return `${Math.abs(n)} day${Math.abs(n) === 1 ? '' : 's'} ago`;
  if (n === 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  return `In ${n} days`;
}

// "14:30:00" -> "2:30 PM"
export function formatTime(time) {
  if (!time) return null;
  const [h, m] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
}

// Calendar grid: 6 rows x 7 columns of Date objects covering the given month.
export function monthGrid(year, month) {
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay());
  return Array.from({ length: 42 }, (_, i) =>
    new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
}
