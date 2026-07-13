import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { courses, getCoursesBySemester, getElectivesByArea, ELECTIVE_AREAS } from '../data/courses';
import { fetchDocumentCounts, searchDocuments, fetchNoticeBoardDocuments, fetchDocumentsByTag, downloadDocument } from '../lib/supabase';
import { getCourseByCode } from '../data/courses';

export default function Library() {
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

  useEffect(() => {
    fetchDocumentCounts().then(setCounts).catch(() => {});
    fetchNoticeBoardDocuments().then(setNoticeDocs).catch(() => {});
  }, []);

  const handleDownload = async (doc) => {
    setDownloading(doc.id);
    try {
      await downloadDocument(doc);
    } catch (err) {
      alert('Download failed: ' + err.message);
    }
    setDownloading(null);
  };

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

  const coreCourses = getCoursesBySemester(semester);
  const electivesByArea = getElectivesByArea();
  const showElectives = semester === 3 || semester === 4;
  const totalDocs = Object.values(counts).reduce((a, b) => a + b, 0);

  const toggleArea = (area) => {
    setOpenAreas(prev => ({ ...prev, [area]: !prev[area] }));
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

  const TYPE_FILTERS = [
    { tag: 'assignment', label: 'Assignments' },
    { tag: 'past-paper', label: 'Past Papers' },
    { tag: 'notes', label: 'Notes' },
    { tag: 'slides', label: 'Slides' },
    { tag: 'case-study', label: 'Case Studies' },
    { tag: 'book', label: 'Books' },
  ];

  if (searchResults) {
    return (
      <>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search documents by title, description, or uploader..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {searching ? (
          <div className="loading">Searching...</div>
        ) : searchResults.length === 0 ? (
          <div className="empty-state">
            <div className="icon">&#128269;</div>
            <p>No documents found for "{search}"</p>
          </div>
        ) : (
          <div className="doc-list">
            {searchResults.map(doc => {
              const course = getCourseByCode(doc.course_code);
              return (
                <Link key={doc.id} to={`/course/${doc.course_code}`} className="doc-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <span className={`file-badge ${doc.file_type}`}>{doc.file_type}</span>
                  <div className="doc-info">
                    <div className="title">{doc.title}</div>
                    <div className="meta">
                      {course?.name || doc.course_code} &middot; {doc.uploader_name} &middot; {new Date(doc.created_at).toLocaleDateString()}
                    </div>
                    {doc.tags?.length > 0 && (
                      <div className="tags">
                        {doc.tags.map(t => <span key={t} className="tag">{t}</span>)}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div className="hero">
        <div className="hero-content">
          <div className="hero-badge">MBA Executive Programme</div>
          <h1>Welcome to <span className="gold">FMS Notes</span></h1>
          <p>
            Your shared library for lecture notes, slides, past papers & study materials.
            {totalDocs > 0 && <> Currently hosting <strong>{totalDocs}</strong> document{totalDocs !== 1 ? 's' : ''} across all courses.</>}
          </p>
        </div>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search documents by title, description, or uploader..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="notice-board" style={{ marginTop: '2rem' }}>
        <div className="notice-board-header">
          <span style={{ fontSize: '1.1rem' }}>📌</span>
          <span className="notice-board-title">Notice Board</span>
          <span className="notice-board-sub">Announcements pinned by admins</span>
        </div>
        {noticeDocs.length === 0 ? (
          <div className="notice-board-empty">No announcements pinned yet.</div>
        ) : (
          <div className="notice-doc-list">
            {noticeDocs.map(doc => {
              const isPinned = doc.course_code !== 'NOTICE-BOARD';
              const course = getCourseByCode(doc.course_code);
              return (
                <div
                  key={doc.id}
                  className={`notice-row${downloading === doc.id ? ' downloading' : ''}`}
                  onClick={() => handleDownload(doc)}
                  title="Tap to download"
                >
                  <span className={`file-badge ${doc.file_type}`}>{doc.file_type}</span>
                  <div className="notice-row-info">
                    <span className="notice-row-title">{doc.title}</span>
                    <span className="notice-row-meta">
                      {isPinned && course ? `${course.name} · ` : ''}{doc.uploader_name} · {new Date(doc.created_at).toLocaleDateString('en-GB')}
                    </span>
                  </div>
                  <span className="notice-row-dl">
                    {downloading === doc.id ? '⏳' : '⬇'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ marginTop: '2rem' }}>
        <div className="section-title">Browse by Type</div>
        <div className="type-filter-chips">
          {TYPE_FILTERS.map(({ tag, label }) => (
            <button
              key={tag}
              className={`type-chip ${typeFilter === tag ? 'active' : ''}`}
              onClick={() => handleTypeFilter(tag)}
            >
              {label}
              {typeFilter === tag && ' ✕'}
            </button>
          ))}
        </div>
        {typeFilter && (
          <div style={{ marginTop: 16 }}>
            {typeFilterLoading ? (
              <div className="loading">Loading...</div>
            ) : typeFilterDocs.length === 0 ? (
              <div className="empty-state" style={{ padding: '1.5rem' }}>
                <p>No documents tagged "{typeFilter}" yet.</p>
              </div>
            ) : (
              <div className="doc-list">
                {typeFilterDocs.map(doc => {
                  const course = getCourseByCode(doc.course_code);
                  return (
                    <Link key={doc.id} to={`/course/${doc.course_code}`} className="doc-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                      <span className={`file-badge ${doc.file_type}`}>{doc.file_type}</span>
                      <div className="doc-info">
                        <div className="title">{doc.title}</div>
                        <div className="meta">
                          {course?.name || doc.course_code} &middot; {doc.uploader_name} &middot; {new Date(doc.created_at).toLocaleDateString()}
                        </div>
                        {doc.tags?.length > 0 && (
                          <div className="tags">
                            {doc.tags.map(t => <span key={t} className="tag">{t}</span>)}
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="semester-tabs" style={{ marginTop: '2rem' }}>
        {[1, 2, 3, 4].map(s => (
          <button
            key={s}
            className={`semester-tab ${semester === s ? 'active' : ''}`}
            onClick={() => setSemester(s)}
          >
            Semester {s}
          </button>
        ))}
      </div>

      <div className="section-title">Core Courses</div>
      <div className="course-grid">
        {coreCourses.map(c => (
          <Link key={c.code} to={`/course/${c.code}`} className={`course-card ${!counts[c.code] ? 'dimmed' : ''}`} style={{ textDecoration: 'none' }}>
            <span className="code">{c.code}</span>
            <span className="name">{c.name}</span>
            <span className="count">{counts[c.code] || 0} document{counts[c.code] !== 1 ? 's' : ''}</span>
          </Link>
        ))}
      </div>

      {showElectives && (
        <>
          <div className="section-title">Elective Courses</div>
          {ELECTIVE_AREAS.map(area => {
            const areaCourses = electivesByArea[area];
            if (!areaCourses?.length) return null;
            const isOpen = openAreas[area];
            return (
              <div key={area} className="area-group">
                <button className="area-toggle" onClick={() => toggleArea(area)}>
                  <span className={`arrow ${isOpen ? 'open' : ''}`}>&#9654;</span>
                  {area} ({areaCourses.length})
                </button>
                {isOpen && (
                  <div className="course-grid">
                    {areaCourses.map(c => (
                      <Link key={c.code} to={`/course/${c.code}`} className={`course-card ${!counts[c.code] ? 'dimmed' : ''}`} style={{ textDecoration: 'none' }}>
                        <span className="code">{c.code}</span>
                        <span className="name">{c.name}</span>
                        <span className="count">{counts[c.code] || 0} document{counts[c.code] !== 1 ? 's' : ''}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}

      {counts['OTHERS'] > 0 && (
        <>
          <div className="section-title">Other Documents</div>
          <div className="course-grid">
            <Link to="/course/OTHERS" className="course-card" style={{ textDecoration: 'none' }}>
              <span className="code">OTHERS</span>
              <span className="name">Miscellaneous & Other Documents</span>
              <span className="count">{counts['OTHERS']} document{counts['OTHERS'] !== 1 ? 's' : ''}</span>
            </Link>
          </div>
        </>
      )}
    </>
  );
}
