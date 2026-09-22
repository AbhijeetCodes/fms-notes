import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../App';
import { courses, getCoursesBySemester, getElectivesByArea, ELECTIVE_AREAS, getCourseByCode } from '../data/courses';
import {
  fetchDocumentCounts, searchDocuments, fetchNoticeBoardDocuments,
  fetchDocumentsByTag, downloadDocument,
} from '../lib/supabase';
import NextDeadline from '../components/NextDeadline';
import { IconSearch, IconUpload } from '../components/Icons';
import GoogleSignIn from '../components/GoogleSignIn';

const INVITE_KEY = 'fms-invite-dismissed';

/**
 * First thing anyone sees: this library is open to the whole batch and the only
 * entry requirement is a Google sign-in. Dismissible, and it stays dismissed.
 */
function InviteBanner({ user }) {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(INVITE_KEY) === '1'; } catch { return false; }
  });

  if (dismissed) return null;

  const dismiss = () => {
    try { localStorage.setItem(INVITE_KEY, '1'); } catch { /* private mode — just hide it */ }
    setDismissed(true);
  };

  return (
    <section className="invite-banner" aria-labelledby="invite-heading">
      <span className="invite-banner-icon" aria-hidden="true">
        <IconUpload />
      </span>

      <div className="invite-banner-text">
        <strong id="invite-heading">Anyone can add notes here</strong>
        <p>
          {user
            ? 'You’re signed in — add your lecture notes, slides or past papers and the whole batch gets them. Takes about a minute.'
            : 'Notes, slides, past papers — all shared by students, free for everyone. All it takes to upload is a Google sign-in.'}
        </p>
      </div>

      <div className="invite-banner-actions">
        {user ? (
          <Link to="/upload" className="invite-banner-cta">
            <IconUpload />
            Upload notes
          </Link>
        ) : (
          <GoogleSignIn className="invite-banner-cta" />
        )}
      </div>

      <button className="invite-banner-close" onClick={dismiss} aria-label="Dismiss this message">
        &times;
      </button>
    </section>
  );
}

function DocCard({ doc }) {
  const course = getCourseByCode(doc.course_code);
  const isLink = !!doc.url && !doc.file_path;
  return (
    <Link to={`/course/${doc.course_code}`} className="doc-card">
      <span className={`file-badge ${isLink ? 'link' : doc.file_type}`}>{isLink ? 'link' : doc.file_type}</span>
      <div className="doc-info">
        <div className="title">{doc.title}</div>
        <div className="meta">
          {course?.name || doc.course_code} &middot; {doc.uploader_name} &middot;{' '}
          {new Date(doc.created_at).toLocaleDateString('en-GB')}
        </div>
        {doc.tags?.length > 0 && (
          <div className="tags">
            {doc.tags.map(t => <span key={t} className="tag">{t}</span>)}
          </div>
        )}
      </div>
    </Link>
  );
}

function CourseCard({ course, count }) {
  return (
    <Link to={`/course/${course.code}`} className={`course-card ${count ? '' : 'dimmed'}`}>
      <span className="code">{course.code}</span>
      <span className="name">{course.name}</span>
      <span className="count">{count || 0} document{count !== 1 ? 's' : ''}</span>
    </Link>
  );
}

const TYPE_FILTERS = [
  { tag: 'notes', label: 'Notes' },
  { tag: 'slides', label: 'Slides' },
  { tag: 'past-paper', label: 'Past papers' },
  { tag: 'assignment', label: 'Assignments' },
  { tag: 'case-study', label: 'Case studies' },
  { tag: 'book', label: 'Books' },
];

export default function Library() {
  const { user } = useAuth();
  const [semester, setSemester] = useState(1);
  const [counts, setCounts] = useState({});
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [openAreas, setOpenAreas] = useState({});
  const [noticeDocs, setNoticeDocs] = useState([]);
  const [downloading, setDownloading] = useState(null);
  const [typeFilter, setTypeFilter] = useState(null);
  const [typeFilterDocs, setTypeFilterDocs] = useState([]);
  const [typeFilterLoading, setTypeFilterLoading] = useState(false);
  const [onlyWithNotes, setOnlyWithNotes] = useState(false);

  useEffect(() => {
    fetchDocumentCounts().then(setCounts).catch(() => {});
    fetchNoticeBoardDocuments().then(setNoticeDocs).catch(() => {});
  }, []);

  useEffect(() => {
    if (!search.trim()) { setSearchResults(null); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchDocuments(search.trim());
        setSearchResults(results);
      } catch { setSearchResults([]); }
      setSearching(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const handleDownload = async (doc) => {
    setDownloading(doc.id);
    try {
      await downloadDocument(doc);
    } catch (err) {
      alert('Download failed: ' + err.message);
    }
    setDownloading(null);
  };

  const handleTypeFilter = async (tag) => {
    if (typeFilter === tag) { setTypeFilter(null); setTypeFilterDocs([]); return; }
    setTypeFilter(tag);
    setTypeFilterLoading(true);
    try {
      const docs = await fetchDocumentsByTag(tag);
      setTypeFilterDocs(docs);
    } catch { setTypeFilterDocs([]); }
    setTypeFilterLoading(false);
  };

  const toggleArea = (area) => setOpenAreas(prev => ({ ...prev, [area]: !prev[area] }));

  const visible = (list) => onlyWithNotes ? list.filter(c => counts[c.code]) : list;

  const coreCourses = visible(getCoursesBySemester(semester));
  const electivesByArea = getElectivesByArea();
  const showElectives = semester === 3 || semester === 4;
  const totalDocs = Object.values(counts).reduce((a, b) => a + b, 0);
  const coveredCourses = courses.filter(c => counts[c.code]).length;

  const searchField = (
    <div className="search-bar">
      <IconSearch className="search-icon" />
      <input
        type="search"
        aria-label="Search documents"
        placeholder="Search notes, slides, past papers…"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      {search && (
        <button className="search-clear" onClick={() => setSearch('')} aria-label="Clear search">
          &times;
        </button>
      )}
    </div>
  );

  /* ── Search results replace the browse view ── */
  if (searchResults) {
    return (
      <>
        {searchField}
        {searching ? (
          <div className="loading">Searching…</div>
        ) : (
          <>
            <div className="search-summary">
              <span>
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for
                {' '}&ldquo;{search}&rdquo;
              </span>
              <button className="link-button" onClick={() => setSearch('')}>Back to library</button>
            </div>
            {searchResults.length === 0 ? (
              <div className="empty-state">
                <div className="icon" aria-hidden="true">&#128269;</div>
                <p>Nothing matches that yet.</p>
                <Link to="/upload" className="btn btn-primary" style={{ marginTop: 16 }}>
                  Be the first to upload it
                </Link>
              </div>
            ) : (
              <div className="doc-list">
                {searchResults.map(doc => <DocCard key={doc.id} doc={doc} />)}
              </div>
            )}
          </>
        )}
      </>
    );
  }

  return (
    <>
      <InviteBanner user={user} />

      {/* Deadlines first — the one thing everyone opens this for */}
      <NextDeadline />

      {searchField}

      <div className="stats-strip">
        <span className="stat">
          <span className="value">{totalDocs}</span>
          <span className="label">document{totalDocs !== 1 ? 's' : ''}</span>
        </span>
        <span className="stat">
          <span className="value">{coveredCourses}</span>
          <span className="label">of {courses.length} courses covered</span>
        </span>
        <span className="stat-spacer" />
        <Link to="/upload" className="btn btn-sm btn-primary">
          <IconUpload />
          Add notes
        </Link>
      </div>

      <section className="notice-board" aria-labelledby="notice-heading">
        <div className="notice-board-header">
          <span className="notice-board-title" id="notice-heading">Notice board</span>
          <span className="notice-board-sub">Pinned by admins</span>
        </div>
        {noticeDocs.length === 0 ? (
          <div className="notice-board-empty">Nothing pinned right now.</div>
        ) : (
          <div className="notice-doc-list">
            {noticeDocs.map(doc => {
              const isPinned = doc.course_code !== 'NOTICE-BOARD';
              const course = getCourseByCode(doc.course_code);
              const isLink = !!doc.url && !doc.file_path;
              return (
                <button
                  type="button"
                  key={doc.id}
                  className={`notice-row${downloading === doc.id ? ' downloading' : ''}`}
                  onClick={() => isLink ? window.open(doc.url, '_blank', 'noopener,noreferrer') : handleDownload(doc)}
                  title={isLink ? 'Open link' : 'Download'}
                >
                  <span className={`file-badge ${isLink ? 'link' : doc.file_type}`}>{isLink ? 'link' : doc.file_type}</span>
                  <span className="notice-row-info">
                    <span className="notice-row-title">{doc.title}</span>
                    <span className="notice-row-meta">
                      {isPinned && course ? `${course.name} · ` : ''}
                      {doc.uploader_name} · {new Date(doc.created_at).toLocaleDateString('en-GB')}
                    </span>
                  </span>
                  <span className="notice-row-dl" aria-hidden="true">
                    {downloading === doc.id ? '⏳' : isLink ? '↗' : '⬇'}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <div className="section-head">
        <h2 className="section-title">Browse by type</h2>
      </div>
      <div className="type-filter-chips">
        {TYPE_FILTERS.map(({ tag, label }) => (
          <button
            key={tag}
            className={`type-chip ${typeFilter === tag ? 'active' : ''}`}
            aria-pressed={typeFilter === tag}
            onClick={() => handleTypeFilter(tag)}
          >
            {label}
            {typeFilter === tag && <span aria-hidden="true">✕</span>}
          </button>
        ))}
      </div>

      {typeFilter && (
        <div style={{ marginTop: 16 }}>
          {typeFilterLoading ? (
            <div className="loading">Loading…</div>
          ) : typeFilterDocs.length === 0 ? (
            <div className="empty-state">
              <p>Nothing tagged &ldquo;{typeFilter}&rdquo; yet.</p>
            </div>
          ) : (
            <div className="doc-list">
              {typeFilterDocs.map(doc => <DocCard key={doc.id} doc={doc} />)}
            </div>
          )}
        </div>
      )}

      <div className="section-head">
        <h2 className="section-title">Browse by course</h2>
        <label className="switch">
          <input
            type="checkbox"
            checked={onlyWithNotes}
            onChange={e => setOnlyWithNotes(e.target.checked)}
          />
          <span className="track" aria-hidden="true" />
          Only courses with notes
        </label>
      </div>

      <div className="semester-tabs" role="tablist" aria-label="Semester">
        {[1, 2, 3, 4].map(s => (
          <button
            key={s}
            role="tab"
            aria-selected={semester === s}
            className={`semester-tab ${semester === s ? 'active' : ''}`}
            onClick={() => setSemester(s)}
          >
            Sem {s}
          </button>
        ))}
      </div>

      <h3 className="section-title">Core courses</h3>
      {coreCourses.length === 0 ? (
        <div className="empty-state" style={{ marginBottom: 24 }}>
          <p>No semester {semester} course has notes yet.</p>
          <button className="link-button" onClick={() => setOnlyWithNotes(false)}>
            Show all courses
          </button>
        </div>
      ) : (
        <div className="course-grid">
          {coreCourses.map(c => <CourseCard key={c.code} course={c} count={counts[c.code]} />)}
        </div>
      )}

      {showElectives && (
        <>
          <h3 className="section-title">Elective courses</h3>
          {ELECTIVE_AREAS.map(area => {
            const areaCourses = visible(electivesByArea[area] || []);
            if (!areaCourses.length) return null;
            const isOpen = openAreas[area];
            return (
              <div key={area} className="area-group">
                <button className="area-toggle" onClick={() => toggleArea(area)} aria-expanded={!!isOpen}>
                  <span className={`arrow ${isOpen ? 'open' : ''}`} aria-hidden="true">&#9654;</span>
                  {area} ({areaCourses.length})
                </button>
                {isOpen && (
                  <div className="course-grid">
                    {areaCourses.map(c => <CourseCard key={c.code} course={c} count={counts[c.code]} />)}
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}

      {counts['OTHERS'] > 0 && (
        <>
          <h3 className="section-title">Other documents</h3>
          <div className="course-grid">
            <Link to="/course/OTHERS" className="course-card">
              <span className="code">OTHERS</span>
              <span className="name">Miscellaneous &amp; other documents</span>
              <span className="count">
                {counts['OTHERS']} document{counts['OTHERS'] !== 1 ? 's' : ''}
              </span>
            </Link>
          </div>
        </>
      )}
    </>
  );
}
