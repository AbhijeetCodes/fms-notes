import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../App';
import { signInWithGoogle, fetchMyDocuments } from '../lib/supabase';
import { getCourseByCode } from '../data/courses';

export default function MyUploads() {
  const { user } = useAuth();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetchMyDocuments(user.id)
      .then(setDocs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="sign-in-prompt">
        <p>Sign in to see your uploaded documents.</p>
        <button className="btn btn-primary" onClick={() => signInWithGoogle()}>Sign in with Google</button>
      </div>
    );
  }

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <>
      <h1 className="page-title">My Uploads</h1>
      <p className="page-subtitle">Track the status of your submitted documents.</p>

      {docs.length === 0 ? (
        <div className="empty-state">
          <div className="icon">&#128196;</div>
          <p>You haven't uploaded anything yet.</p>
          <Link to="/upload" className="btn btn-primary" style={{ marginTop: 16 }}>Upload your first document</Link>
        </div>
      ) : (
        <div className="doc-list">
          {docs.map(doc => {
            const course = getCourseByCode(doc.course_code);
            const isLink = !!doc.url && !doc.file_path;
            return (
              <div key={doc.id} className="doc-card">
                <span className={`file-badge ${isLink ? 'link' : doc.file_type}`}>{isLink ? 'link' : doc.file_type}</span>
                <div className="doc-info">
                  <div className="title">
                    {doc.title}
                    <span className={`status-badge ${doc.status}`} style={{ marginLeft: 8 }}>
                      {doc.status}
                    </span>
                  </div>
                  <div className="meta">
                    {course?.name || doc.course_code} &middot; {new Date(doc.created_at).toLocaleDateString()}
                  </div>
                  {isLink && <div className="description link-url">{doc.url}</div>}
                  {doc.status === 'rejected' && doc.reject_reason && (
                    <div className="alert error" style={{ marginTop: 8, marginBottom: 0 }}>
                      Reason: {doc.reject_reason}
                    </div>
                  )}
                  {doc.tags?.length > 0 && (
                    <div className="tags">
                      {doc.tags.map(t => <span key={t} className="tag">{t}</span>)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
