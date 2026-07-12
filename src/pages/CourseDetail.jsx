import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCourseByCode } from '../data/courses';
import { fetchApprovedDocuments, getSignedUrl } from '../lib/supabase';

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function CourseDetail() {
  const { code } = useParams();
  const course = getCourseByCode(code);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tagFilter, setTagFilter] = useState(null);

  useEffect(() => {
    fetchApprovedDocuments(code)
      .then(setDocs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [code]);

  const handleDownload = async (doc) => {
    try {
      const url = await getSignedUrl(doc.file_path);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      a.click();
    } catch (err) {
      alert('Download failed: ' + err.message);
    }
  };

  const filtered = tagFilter
    ? docs.filter(d => d.tags?.includes(tagFilter))
    : docs;

  const allTags = [...new Set(docs.flatMap(d => d.tags || []))];

  return (
    <>
      <Link to="/" className="back-link">&#8592; Back to Library</Link>
      {course ? (
        <>
          <h1 className="page-title">{course.name}</h1>
          <p className="page-subtitle">{course.code}{course.area ? ` · ${course.area}` : ''}</p>
        </>
      ) : (
        <h1 className="page-title">{code}</h1>
      )}

      {allTags.length > 0 && (
        <div className="tags" style={{ marginBottom: 16 }}>
          {tagFilter && (
            <button className="tag" style={{ background: 'var(--accent)', color: 'white' }} onClick={() => setTagFilter(null)}>
              &#10005; {tagFilter}
            </button>
          )}
          {allTags.filter(t => t !== tagFilter).map(t => (
            <button key={t} className="tag" onClick={() => setTagFilter(t)}>{t}</button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="loading">Loading documents...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="icon">&#128195;</div>
          <p>{tagFilter ? `No documents tagged "${tagFilter}"` : 'No documents uploaded yet for this course.'}</p>
          <Link to="/upload" className="btn btn-primary" style={{ marginTop: 16 }}>Upload one</Link>
        </div>
      ) : (
        <div className="doc-list">
          {filtered.map(doc => (
            <div key={doc.id} className="doc-card">
              <span className={`file-badge ${doc.file_type}`}>{doc.file_type}</span>
              <div className="doc-info">
                <div className="title">{doc.title}</div>
                <div className="meta">
                  {doc.uploader_name} &middot; {new Date(doc.created_at).toLocaleDateString()} &middot; {formatSize(doc.file_size)}
                </div>
                {doc.description && <div className="description">{doc.description}</div>}
                {doc.tags?.length > 0 && (
                  <div className="tags">
                    {doc.tags.map(t => (
                      <button key={t} className="tag" onClick={() => setTagFilter(t)}>{t}</button>
                    ))}
                  </div>
                )}
              </div>
              <div className="doc-actions">
                <button className="btn btn-sm btn-primary" onClick={() => handleDownload(doc)}>
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
