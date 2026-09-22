import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchUpcomingEvents } from '../lib/supabase';
import { getCourseByCode } from '../data/courses';
import { getEventType, isDeadline } from '../data/eventTypes';
import { formatDayDate, countdownLabel, formatTime, daysUntil } from '../lib/dates';

function urgencyClass(iso) {
  const n = daysUntil(iso);
  if (n <= 1) return 'urgent';
  if (n <= 3) return 'soon';
  return '';
}

export default function NextDeadline() {
  const [deadlines, setDeadlines] = useState(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchUpcomingEvents({ limit: 100 })
      .then(events => setDeadlines(
        events.filter(isDeadline).sort((a, b) =>
          a.event_date.localeCompare(b.event_date) || (a.event_time || '').localeCompare(b.event_time || '')),
      ))
      .catch(() => setDeadlines([]));
  }, []);

  if (deadlines === null) return null;

  if (deadlines.length === 0) {
    return (
      <div className="next-deadline empty">
        <span className="next-deadline-icon">🗓️</span>
        <div className="next-deadline-body">
          <span className="next-deadline-title">No deadlines on the calendar yet</span>
          <span className="next-deadline-sub">Know an assignment or exam date? Add it for the batch.</span>
        </div>
        <Link to="/calendar" className="next-deadline-cta">Add a date →</Link>
      </div>
    );
  }

  const [next, ...rest] = deadlines;
  const type = getEventType(next.event_type);
  const course = next.course_code ? getCourseByCode(next.course_code) : null;
  const time = formatTime(next.event_time);

  return (
    <div className={`next-deadline ${urgencyClass(next.event_date)}`}>
      <button
        className="next-deadline-main"
        onClick={() => setExpanded(v => !v)}
        aria-expanded={expanded}
        title="Tap to see all upcoming deadlines"
      >
        <span className="next-deadline-icon">{type.icon}</span>
        <div className="next-deadline-body">
          <span className="next-deadline-kicker">
            <span className="next-deadline-pill">Next deadline</span>
            <span className="next-deadline-countdown">{countdownLabel(next.event_date)}</span>
          </span>
          <span className="next-deadline-title">{next.title}</span>
          <span className="next-deadline-sub">
            {formatDayDate(next.event_date)}{time ? ` · ${time}` : ''}
            {course ? ` · ${course.name}` : ''}
          </span>
        </div>
        <span className="next-deadline-toggle">
          {deadlines.length > 1 && (
            <span className="next-deadline-count">{deadlines.length} upcoming</span>
          )}
          <span className={`arrow ${expanded ? 'open' : ''}`}>▾</span>
        </span>
      </button>

      {expanded && (
        <div className="next-deadline-all">
          <div className="next-deadline-all-head">All upcoming deadlines</div>
          {deadlines.map(e => {
            const t = getEventType(e.event_type);
            const c = e.course_code ? getCourseByCode(e.course_code) : null;
            const tm = formatTime(e.event_time);
            return (
              <Link key={e.id} to={`/calendar?view=month&date=${e.event_date}`} className={`next-deadline-item ${urgencyClass(e.event_date)}`}>
                <span className="next-deadline-item-day">{formatDayDate(e.event_date)}</span>
                <span className="next-deadline-item-main">
                  <span className="next-deadline-item-icon">{t.icon}</span>
                  <span className="next-deadline-item-title">{e.title}</span>
                  <span className={`event-type-badge ${e.event_type}`}>{t.label}</span>
                </span>
                <span className="next-deadline-item-meta">
                  {tm ? `${tm} · ` : ''}{c ? `${c.name} · ` : ''}{countdownLabel(e.event_date)}
                </span>
              </Link>
            );
          })}
          {rest.length === 0 && (
            <div className="next-deadline-item-meta" style={{ padding: '0 14px 10px' }}>
              That&apos;s the only one scheduled so far.
            </div>
          )}
          <Link to="/calendar" className="next-deadline-footer-link">Open full calendar →</Link>
        </div>
      )}
    </div>
  );
}
