import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../App';
import { courses, ELECTIVE_AREAS, getCourseByCode } from '../data/courses';
import { EVENT_TYPES, getEventType, isDeadline } from '../data/eventTypes';
import { fetchApprovedEvents, fetchMyEvents, createEvent, deleteEvent, signInWithGoogle } from '../lib/supabase';
import {
  monthGrid, toISO, todayISO, parseDate, formatMonthYear, formatDayDate,
  countdownLabel, formatTime, WEEKDAY_LABELS,
} from '../lib/dates';

function EventRow({ event, onDelete, deleting }) {
  const type = getEventType(event.event_type);
  const course = event.course_code ? getCourseByCode(event.course_code) : null;
  const time = formatTime(event.event_time);
  return (
    <div className={`event-row ${event.event_type}`}>
      <span className="event-row-icon" title={type.label}>{type.icon}</span>
      <div className="event-row-info">
        <div className="event-row-title">
          {event.title}
          <span className={`event-type-badge ${event.event_type}`}>{type.label}</span>
        </div>
        <div className="event-row-meta">
          {formatDayDate(event.event_date)}
          {time ? ` · ${time}` : ''}
          {course ? <> · <Link to={`/course/${course.code}`}>{course.name}</Link></> : ''}
          {event.location ? ` · ${event.location}` : ''}
        </div>
        {event.description && <div className="event-row-desc">{event.description}</div>}
      </div>
      <div className="event-row-side">
        <span className={`event-countdown ${isDeadline(event) ? 'deadline' : ''}`}>
          {countdownLabel(event.event_date)}
        </span>
        {onDelete && (
          <button className="btn btn-sm btn-danger" disabled={deleting} onClick={() => onDelete(event)}>
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

function AddEventForm({ user, onAdded }) {
  const [open, setOpen] = useState(false);
  const [semester, setSemester] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState('assignment');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const availableCourses = semester
    ? semester === 'elective'
      ? courses.filter(c => c.kind === 'elective')
      : courses.filter(c => c.semester === parseInt(semester))
    : [];

  const groupedElectives = {};
  if (semester === 'elective') {
    for (const area of ELECTIVE_AREAS) {
      groupedElectives[area] = availableCourses.filter(c => c.area === area);
    }
  }

  const reset = () => {
    setSemester(''); setCourseCode(''); setTitle(''); setEventType('assignment');
    setEventDate(''); setEventTime(''); setLocation(''); setDescription('');
  };

  const canSubmit = title.trim() && eventDate;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await createEvent({
        title: title.trim(),
        description: description.trim(),
        courseCode,
        eventType,
        eventDate,
        eventTime,
        location: location.trim(),
        user,
      });
      reset();
      setDone(true);
      setOpen(false);
      onAdded?.();
    } catch (err) {
      setError(err.message);
    }
    setSubmitting(false);
  };

  if (!open) {
    return (
      <>
        {done && (
          <div className="alert success" style={{ marginBottom: 12 }}>
            Thanks! Your event was submitted and will appear on the calendar once a moderator approves it.
          </div>
        )}
        <button className="btn btn-primary" onClick={() => { setOpen(true); setDone(false); }}>
          + Add a date
        </button>
      </>
    );
  }

  return (
    <form className="event-form" onSubmit={handleSubmit}>
      <div className="event-form-title">Add a date</div>
      {error && <div className="alert error">{error}</div>}

      <div className="form-group">
        <label>What is it? *</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g. Marketing Management — Case submission"
        />
      </div>

      <div className="event-form-row">
        <div className="form-group">
          <label>Type *</label>
          <select value={eventType} onChange={e => setEventType(e.target.value)}>
            {EVENT_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Date *</label>
          <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Time (optional)</label>
          <input type="time" value={eventTime} onChange={e => setEventTime(e.target.value)} />
        </div>
      </div>

      <div className="event-form-row">
        <div className="form-group">
          <label>Semester (optional)</label>
          <select value={semester} onChange={e => { setSemester(e.target.value); setCourseCode(''); }}>
            <option value="">Not course-specific</option>
            {[1, 2, 3, 4].map(s => <option key={s} value={s}>Semester {s}</option>)}
            <option value="elective">Electives</option>
          </select>
        </div>
        <div className="form-group">
          <label>Course (optional)</label>
          <select value={courseCode} onChange={e => setCourseCode(e.target.value)} disabled={!semester}>
            <option value="">— None —</option>
            {semester === 'elective'
              ? ELECTIVE_AREAS.map(area => (
                  groupedElectives[area]?.length ? (
                    <optgroup key={area} label={area}>
                      {groupedElectives[area].map(c => (
                        <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
                      ))}
                    </optgroup>
                  ) : null
                ))
              : availableCourses.map(c => (
                  <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
                ))}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label>Venue / mode (optional)</label>
        <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Room 204, or Online" />
      </div>

      <div className="form-group">
        <label>Notes (optional)</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Anything else your batch should know..." />
      </div>

      <div className="event-form-actions">
        <button type="button" className="btn" onClick={() => { setOpen(false); setError(null); }}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={!canSubmit || submitting}>
          {submitting ? 'Submitting...' : 'Submit for review'}
        </button>
      </div>
      <div className="form-group">
        <span className="hint">Submitted dates go live on the calendar once a moderator approves them.</span>
      </div>
    </form>
  );
}

export default function Calendar() {
  const { user, isMod } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [myPending, setMyPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState(searchParams.get('view') === 'month' ? 'month' : 'list');
  const [typeFilter, setTypeFilter] = useState('all');
  const [acting, setActing] = useState(null);

  const today = todayISO();
  const initialDate = searchParams.get('date');
  const [cursor, setCursor] = useState(() => {
    const base = initialDate ? parseDate(initialDate) : new Date();
    return { year: base.getFullYear(), month: base.getMonth() };
  });
  const [selectedDay, setSelectedDay] = useState(initialDate || null);

  const load = async () => {
    setLoading(true);
    try {
      const approved = await fetchApprovedEvents();
      setEvents(approved);
      if (user) {
        const mine = await fetchMyEvents(user.id);
        setMyPending(mine.filter(e => e.status !== 'approved'));
      } else {
        setMyPending([]);
      }
    } catch {
      setEvents([]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  const visible = useMemo(() => {
    const filtered = typeFilter === 'all' ? events : events.filter(e => e.event_type === typeFilter);
    return [...filtered].sort((a, b) =>
      a.event_date.localeCompare(b.event_date) || (a.event_time || '').localeCompare(b.event_time || ''));
  }, [events, typeFilter]);

  const byDate = useMemo(() => {
    const map = {};
    for (const e of visible) (map[e.event_date] ||= []).push(e);
    return map;
  }, [visible]);

  const upcoming = useMemo(() => visible.filter(e => e.event_date >= today), [visible, today]);
  const past = useMemo(() => visible.filter(e => e.event_date < today).reverse(), [visible, today]);

  const grid = useMemo(() => monthGrid(cursor.year, cursor.month), [cursor]);

  const shiftMonth = (delta) => {
    setCursor(({ year, month }) => {
      const d = new Date(year, month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const switchView = (v) => {
    setView(v);
    const next = new URLSearchParams(searchParams);
    next.set('view', v);
    setSearchParams(next, { replace: true });
  };

  const handleDelete = async (event) => {
    if (!window.confirm(`Delete "${event.title}" from the calendar? This cannot be undone.`)) return;
    setActing(event.id);
    try {
      await deleteEvent(event.id);
      await load();
    } catch (err) {
      alert('Could not delete: ' + err.message);
    }
    setActing(null);
  };

  const selectedEvents = selectedDay ? (byDate[selectedDay] || []) : [];

  return (
    <>
      <h1 className="page-title">Calendar</h1>
      <p className="page-subtitle">
        Assignment due dates, exams and other important dates for the batch.
      </p>

      <div className="calendar-toolbar">
        <div className="semester-tabs" style={{ margin: 0 }}>
          <button className={`semester-tab ${view === 'list' ? 'active' : ''}`} onClick={() => switchView('list')}>
            Upcoming
          </button>
          <button className={`semester-tab ${view === 'month' ? 'active' : ''}`} onClick={() => switchView('month')}>
            Month
          </button>
        </div>
        <select className="calendar-type-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="all">All types</option>
          {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
        </select>
      </div>

      <div style={{ margin: '16px 0' }}>
        {user ? (
          <AddEventForm user={user} onAdded={load} />
        ) : (
          <div className="alert info">
            <button className="link-button" onClick={() => signInWithGoogle()}>Sign in</button> to add a due date or exam for your batch.
          </div>
        )}
      </div>

      {myPending.length > 0 && (
        <div className="event-pending-note">
          <strong>Your submissions awaiting review</strong>
          {myPending.map(e => (
            <div key={e.id} className="event-pending-row">
              <span className={`status-badge ${e.status}`}>{e.status}</span>
              {e.title} · {formatDayDate(e.event_date)}
              {e.status === 'rejected' && e.reject_reason ? ` — ${e.reject_reason}` : ''}
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="loading">Loading...</div>
      ) : view === 'month' ? (
        <>
          <div className="calendar-month">
            <div className="calendar-month-header">
              <button className="calendar-nav" onClick={() => shiftMonth(-1)} aria-label="Previous month">&#8249;</button>
              <span className="calendar-month-label">{formatMonthYear(cursor.year, cursor.month)}</span>
              <button className="calendar-nav" onClick={() => shiftMonth(1)} aria-label="Next month">&#8250;</button>
              <button
                className="calendar-today-btn"
                onClick={() => {
                  const now = new Date();
                  setCursor({ year: now.getFullYear(), month: now.getMonth() });
                  setSelectedDay(today);
                }}
              >
                Today
              </button>
            </div>
            <div className="calendar-weekdays">
              {WEEKDAY_LABELS.map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="calendar-grid">
              {grid.map(date => {
                const iso = toISO(date);
                const dayEvents = byDate[iso] || [];
                const outside = date.getMonth() !== cursor.month;
                return (
                  <button
                    key={iso}
                    className={[
                      'calendar-day',
                      outside ? 'outside' : '',
                      iso === today ? 'today' : '',
                      iso === selectedDay ? 'selected' : '',
                      dayEvents.length ? 'has-events' : '',
                    ].filter(Boolean).join(' ')}
                    onClick={() => setSelectedDay(iso === selectedDay ? null : iso)}
                  >
                    <span className="calendar-day-num">{date.getDate()}</span>
                    <span className="calendar-day-dots">
                      {dayEvents.slice(0, 3).map(e => (
                        <span key={e.id} className={`calendar-dot ${e.event_type}`} title={e.title} />
                      ))}
                      {dayEvents.length > 3 && <span className="calendar-day-more">+{dayEvents.length - 3}</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="calendar-day-panel">
            {!selectedDay ? (
              <div className="calendar-day-panel-empty">Pick a day to see what&apos;s on.</div>
            ) : selectedEvents.length === 0 ? (
              <div className="calendar-day-panel-empty">
                <strong>{formatDayDate(selectedDay)}</strong> — nothing scheduled.
              </div>
            ) : (
              <>
                <div className="section-title" style={{ marginTop: 0 }}>{formatDayDate(selectedDay)}</div>
                <div className="event-list">
                  {selectedEvents.map(e => (
                    <EventRow key={e.id} event={e} onDelete={isMod ? handleDelete : null} deleting={acting === e.id} />
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="section-title">Upcoming ({upcoming.length})</div>
          {upcoming.length === 0 ? (
            <div className="empty-state">
              <div className="icon">&#128197;</div>
              <p>No upcoming dates on the calendar yet.</p>
            </div>
          ) : (
            <div className="event-list">
              {upcoming.map(e => (
                <EventRow key={e.id} event={e} onDelete={isMod ? handleDelete : null} deleting={acting === e.id} />
              ))}
            </div>
          )}

          {past.length > 0 && (
            <>
              <div className="section-title">Past ({past.length})</div>
              <div className="event-list past">
                {past.map(e => (
                  <EventRow key={e.id} event={e} onDelete={isMod ? handleDelete : null} deleting={acting === e.id} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
