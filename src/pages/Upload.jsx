import { useState, useRef } from 'react';
import { useAuth } from '../App';
import { courses, ELECTIVE_AREAS } from '../data/courses';
import { signInWithGoogle, validateFile, uploadDocument, uploadLink } from '../lib/supabase';

const SUGGESTED_TAGS = ['notes', 'slides', 'past-paper', 'assignment', 'case-study', 'book'];

export default function Upload() {
  const { user } = useAuth();
  const [uploadType, setUploadType] = useState('file');
  const [semester, setSemester] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [file, setFile] = useState(null);
  const [dragover, setDragover] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileRef = useRef();

  if (!user) {
    return (
      <div className="sign-in-prompt">
        <p>Sign in with your Google account to upload and share documents with your classmates.</p>
        <button className="btn btn-primary" onClick={() => signInWithGoogle()}>
          Sign in with Google
        </button>
      </div>
    );
  }

  const availableCourses = semester
    ? semester === 'elective'
      ? courses.filter(c => c.kind === 'elective')
      : semester === 'other'
          ? courses.filter(c => c.kind === 'other')
          : courses.filter(c => c.semester === parseInt(semester))
    : [];

  const groupedElectives = {};
  if (semester === 'elective') {
    for (const area of ELECTIVE_AREAS) {
      groupedElectives[area] = availableCourses.filter(c => c.area === area);
    }
  }

  const handleFile = (f) => {
    const err = validateFile(f);
    if (err) { setError(err); setFile(null); return; }
    setError(null);
    setFile(f);
  };

  const addTag = (t) => {
    const tag = t.trim().toLowerCase();
    if (tag && !tags.includes(tag)) setTags([...tags, tag]);
    setTagInput('');
  };

  const removeTag = (t) => setTags(tags.filter(x => x !== t));

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    }
    if (e.key === 'Backspace' && !tagInput && tags.length) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const canSubmit = courseCode && title.trim() && (uploadType === 'file' ? file : url.trim());

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setUploadProgress('');
    setError(null);
    try {
      if (uploadType === 'link') {
        await uploadLink({
          url: url.trim(), courseCode, title: title.trim(), description: description.trim(), tags, user,
        });
      } else {
        await uploadDocument({
          file, courseCode, title: title.trim(), description: description.trim(), tags, user,
          onProgress: setUploadProgress
        });
      }
      setResult('Submitted! It will appear in the library after a moderator approves it.');
      setCourseCode('');
      setTitle('');
      setDescription('');
      setUrl('');
      setTags([]);
      setFile(null);
    } catch (err) {
      setError(err.message || 'Upload failed');
    }
    setSubmitting(false);
  };

  return (
    <>
      <h1 className="page-title">Share with Classmates</h1>
      <p className="page-subtitle">Upload a file or share a link — notes, slides, case study URLs, anything useful.</p>

      {result && <div className="alert success">{result}</div>}
      {error && <div className="alert error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>What are you sharing?</label>
          <div className="upload-type-toggle">
            <button type="button" className={`upload-type-btn ${uploadType === 'file' ? 'active' : ''}`} onClick={() => setUploadType('file')}>
              File Upload
            </button>
            <button type="button" className={`upload-type-btn ${uploadType === 'link' ? 'active' : ''}`} onClick={() => setUploadType('link')}>
              Link / URL
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>Semester / Category</label>
          <select value={semester} onChange={e => { setSemester(e.target.value); setCourseCode(''); }}>
            <option value="">Select...</option>
            <option value="1">Semester 1</option>
            <option value="2">Semester 2</option>
            <option value="3">Semester 3</option>
            <option value="4">Semester 4</option>
            <option value="elective">Electives</option>
            <option value="other">Others</option>
          </select>
        </div>

        {semester && (
          <div className="form-group">
            <label>Course</label>
            {semester === 'elective' ? (
              <select value={courseCode} onChange={e => setCourseCode(e.target.value)}>
                <option value="">Select course...</option>
                {ELECTIVE_AREAS.map(area => (
                  groupedElectives[area]?.length > 0 && (
                    <optgroup key={area} label={area}>
                      {groupedElectives[area].map(c => (
                        <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
                      ))}
                    </optgroup>
                  )
                ))}
              </select>
            ) : (
              <select value={courseCode} onChange={e => setCourseCode(e.target.value)}>
                <option value="">Select course...</option>
                {availableCourses.map(c => (
                  <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
                ))}
              </select>
            )}
          </div>
        )}

        <div className="form-group">
          <label>Title</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Unit 3 Notes — Elasticity" maxLength={200} />
        </div>

        <div className="form-group">
          <label>Description <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>(optional)</span></label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Any extra context about this document..." maxLength={500} />
        </div>

        <div className="form-group">
          <label>Tags</label>
          <div className="tag-input" onClick={() => document.getElementById('tag-field')?.focus()}>
            {tags.map(t => (
              <span key={t} className="tag">
                {t} <span className="remove" onClick={() => removeTag(t)}>&times;</span>
              </span>
            ))}
            <input
              id="tag-field"
              type="text"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder={tags.length ? '' : 'Type and press Enter...'}
            />
          </div>
          <div className="suggested-tags">
            {SUGGESTED_TAGS.filter(t => !tags.includes(t)).map(t => (
              <button key={t} type="button" onClick={() => addTag(t)}>{t}</button>
            ))}
          </div>
        </div>

        {uploadType === 'link' ? (
          <div className="form-group">
            <label>URL</label>
            <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com/case-study" />
            <div className="hint" style={{ marginTop: 4 }}>Paste the full URL including https://</div>
          </div>
        ) : (
          <div className="form-group">
            <label>File</label>
            <div
              className={`file-drop ${dragover ? 'dragover' : ''}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragover(true); }}
              onDragLeave={() => setDragover(false)}
              onDrop={e => { e.preventDefault(); setDragover(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
            >
              <div className="label">Drop a file here or click to browse</div>
              <div className="hint">PDF, PPT, DOC, XLS, JPG, PNG — max 50MB</div>
              {file && <div className="selected-file">{file.name} ({(file.size / (1024 * 1024)).toFixed(1)} MB)</div>}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              style={{ display: 'none' }}
              onChange={e => { if (e.target.files[0]) handleFile(e.target.files[0]); }}
            />
          </div>
        )}

        {submitting && uploadType === 'file' && (
          <div className="upload-progress">
            <div>
              {uploadProgress === 'compressing' ? 'Compressing document...' : 'Uploading your document...'}
            </div>
            <div className="bar"><div className="fill" /></div>
          </div>
        )}

        {submitting && uploadType === 'link' && (
          <div className="upload-progress">
            <div>Saving your link...</div>
            <div className="bar"><div className="fill" /></div>
          </div>
        )}

        <button type="submit" className="btn btn-primary" disabled={!canSubmit || submitting}>
          {submitting ? 'Submitting...' : 'Submit for Review'}
        </button>
      </form>
    </>
  );
}
