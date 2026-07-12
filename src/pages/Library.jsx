import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { courses, getCoursesBySemester, getElectivesByArea, ELECTIVE_AREAS } from '../data/courses';
import { fetchDocumentCounts, searchDocuments } from '../lib/supabase';
import { getCourseByCode } from '../data/courses';

export default function Library() {
  const [semester, setSemester] = useState(1);
  const [counts, setCounts] = useState({});
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [openAreas, setOpenAreas] = useState({});

  useEffect(() => {
    fetchDocumentCounts().then(setCounts).catch(() => {});
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

  const coreCourses = getCoursesBySemester(semester);
  const electivesByArea = getElectivesByArea();
  const showElectives = semester === 3 || semester === 4;
  const totalDocs = Object.values(counts).reduce((a, b) => a + b, 0);

  const toggleArea = (area) => {
    setOpenAreas(prev => ({ ...prev, [area]: !prev[area] }));
  };

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

      <div className="semester-tabs">
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
    </>
  );
}
