import { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { fetchPendingDocuments, fetchAllDocuments, approveDocument, rejectDocument, previewDocument, fetchStorageUsed } from '../lib/supabase';
import { getCourseByCode } from '../data/courses';

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

const STORAGE_LIMIT = 1024 * 1024 * 1024;

export default function Admin() {
  const { user, isMod } = useAuth();
  const [tab, setTab] = useState('pending');
  const [pending, setPending] = useState([]);
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storageUsed, setStorageUsed] = useState(0);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [acting, setActing] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [p, a, s] = await Promise.all([
        fetchPendingDocuments(),
        fetchAllDocuments(),
        fetchStorageUsed(),
      ]);
      setPending(p);
      setAll(a);
      setStorageUsed(s);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { if (isMod) load(); else setLoading(false); }, [isMod]);

  if (!user || !isMod) {
    return (
      <div className="empty-state">
        <div className="icon">&#128274;</div>
        <p>This page is only available to moderators.</p>
      </div>
    );
  }

  const isValidUUID = (uuid) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);

  const handleApprove = async (id) => {
    setActing(id);
    try {
      const reviewerId = isValidUUID(user.id) ? user.id : null;
      await approveDocument(id, reviewerId);
      await load();
    } catch (err) { alert('Error: ' + err.message); }
    setActing(null);
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setActing(rejectModal);
    try {
      const reviewerId = isValidUUID(user.id) ? user.id : null;
      await rejectDocument(rejectModal, reviewerId, rejectReason);
      setRejectModal(null);
      setRejectReason('');
      await load();
    } catch (err) { alert('Error: ' + err.message); }
    setActing(null);
  };

  const handlePreview = async (doc) => {
    setActing(doc.id);
    try {
      await previewDocument(doc);
    } catch (err) { alert('Could not open: ' + err.message); }
    setActing(null);
  };

  const pct = Math.min(100, (storageUsed / STORAGE_LIMIT) * 100);
  const docs = tab === 'pending' ? pending : all;

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <>
      <h1 className="page-title">Admin</h1>

      <div className="storage-meter">
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Storage: {formatSize(storageUsed)} / 1 GB ({pct.toFixed(1)}%)
        </div>
        <div className="storage-bar">
          <div className="fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="semester-tabs" style={{ marginBottom: 24 }}>
        <button className={`semester-tab ${tab === 'pending' ? 'active' : ''}`} onClick={() => setTab('pending')}>
          Pending ({pending.length})
        </button>
        <button className={`semester-tab ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>
          All Documents ({all.length})
        </button>
      </div>

      {docs.length === 0 ? (
        <div className="empty-state">
          <div className="icon">&#9989;</div>
          <p>{tab === 'pending' ? 'No pending documents.' : 'No documents yet.'}</p>
        </div>
      ) : (
        <div className="doc-list">
          {docs.map(doc => {
            const course = getCourseByCode(doc.course_code);
            return (
              <div key={doc.id} className="doc-card">
                <span className={`file-badge ${doc.file_type}`}>{doc.file_type}</span>
                <div className="doc-info">
                  <div className="title">
                    {doc.title}
                    <span className={`status-badge ${doc.status}`} style={{ marginLeft: 8 }}>{doc.status}</span>
                  </div>
                  <div className="meta">
                    {course?.name || doc.course_code} &middot; {doc.uploader_name} ({doc.uploader_email}) &middot; {new Date(doc.created_at).toLocaleDateString()} &middot; {formatSize(doc.file_size)}
                  </div>
                  {doc.description && <div className="description">{doc.description}</div>}
                  {doc.tags?.length > 0 && (
                    <div className="tags">
                      {doc.tags.map(t => <span key={t} className="tag">{t}</span>)}
                    </div>
                  )}
                </div>
                <div className="doc-actions" style={{ flexDirection: 'column', gap: 4 }}>
                  <button className="btn btn-sm" disabled={acting === doc.id} onClick={() => handlePreview(doc)}>
                    {acting === doc.id ? 'Loading...' : 'View'}
                  </button>
                  {doc.status === 'pending' && (
                    <>
                      <button className="btn btn-sm btn-success" disabled={acting === doc.id} onClick={() => handleApprove(doc.id)}>
                        Approve
                      </button>
                      <button className="btn btn-sm btn-danger" disabled={acting === doc.id} onClick={() => { setRejectModal(doc.id); setRejectReason(''); }}>
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {rejectModal && (
        <div className="modal-backdrop" onClick={() => setRejectModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Reject Document</h3>
            <div className="form-group">
              <label>Reason (optional)</label>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Tell the uploader why..." />
            </div>
            <div className="actions">
              <button className="btn" onClick={() => setRejectModal(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleReject} disabled={acting === rejectModal}>Reject</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
