import { createClient } from '@supabase/supabase-js';
import { unzipSync } from 'fflate';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + window.location.pathname },
  });
  if (error) throw error;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function isModerator(email) {
  const { data, error } = await supabase
    .from('moderators')
    .select('user_email')
    .eq('user_email', email);
  if (error) return false;
  return data && data.length > 0;
}

const ALLOWED_EXTENSIONS = ['pdf', 'ppt', 'pptx', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png'];
const MAX_FILE_SIZE = 50 * 1024 * 1024;

export function validateFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return `File type .${ext} is not allowed. Use: ${ALLOWED_EXTENSIONS.join(', ')}`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max is 50MB.`;
  }
  return null;
}

export async function uploadDocument({ file, courseCode, title, description, tags, user, onProgress }) {
  const ext = file.name.split('.').pop().toLowerCase();

  if (onProgress) onProgress('uploading');

  const session = await getSession();
  const formData = new FormData();
  formData.append('file', file);
  formData.append('courseCode', courseCode);

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-to-drive`,
    { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` }, body: formData },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Upload failed');
  }
  const { fileId } = await res.json();
  const key = `gdrive:${fileId}`;

  const { error: dbError } = await supabase.from('documents').insert({
    course_code: courseCode,
    title,
    description: description || null,
    file_path: key,
    file_name: file.name,
    file_size: file.size,
    file_type: ext,
    tags: tags.length ? tags : [],
    uploader_id: user.id,
    uploader_name: user.user_metadata?.full_name || user.email,
    uploader_email: user.email,
    status: 'pending',
  });
  if (dbError) throw dbError;
}

export async function uploadLink({ url, courseCode, title, description, tags, user }) {
  const { error: dbError } = await supabase.from('documents').insert({
    course_code: courseCode,
    title,
    description: description || null,
    url,
    file_path: null,
    file_name: null,
    file_size: null,
    file_type: null,
    tags: tags.length ? tags : [],
    uploader_id: user.id,
    uploader_name: user.user_metadata?.full_name || user.email,
    uploader_email: user.email,
    status: 'pending',
  });
  if (dbError) throw dbError;
}

export async function fetchApprovedDocuments(courseCode) {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('course_code', courseCode)
    .eq('status', 'approved')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchNoticeBoardDocuments() {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('status', 'approved')
    .or(`course_code.eq.NOTICE-BOARD,tags.cs.{pinned}`)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchMyDocuments(userId) {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('uploader_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchPendingDocuments() {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function fetchAllDocuments() {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function approveDocument(id, reviewerId) {
  const { error } = await supabase
    .from('documents')
    .update({
      status: 'approved',
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw error;
}

export async function togglePinDocument(id, currentTags, pin) {
  const tags = new Set(currentTags || []);
  if (pin) tags.add('pinned');
  else tags.delete('pinned');
  const { error } = await supabase
    .from('documents')
    .update({ tags: Array.from(tags) })
    .eq('id', id);
  if (error) throw error;
}

export async function rejectDocument(id, reviewerId, reason) {
  const { error } = await supabase
    .from('documents')
    .update({
      status: 'rejected',
      reject_reason: reason || null,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw error;
}

// Legacy: signed URL from Supabase storage (for old .zip files)
async function getSupabaseSignedUrl(filePath) {
  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(filePath, 60 * 60);
  if (error) throw error;
  return data.signedUrl;
}

function getDriveDownloadUrl(fileId) {
  return `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`;
}

function getDriveViewUrl(fileId) {
  return `https://drive.google.com/file/d/${fileId}/view`;
}

const MIME_TYPES = {
  pdf: 'application/pdf',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
};

export async function downloadDocument(doc) {
  if (doc.file_path?.startsWith('gdrive:')) {
    const fileId = doc.file_path.slice(7);
    const a = document.createElement('a');
    a.href = getDriveDownloadUrl(fileId);
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.click();
    return;
  }

  // Legacy: .zip stored in Supabase storage — decompress in-browser
  const url = await getSupabaseSignedUrl(doc.file_path);
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch file');
  const arrayBuffer = await response.arrayBuffer();
  const unzipped = unzipSync(new Uint8Array(arrayBuffer));
  const fileNames = Object.keys(unzipped);
  if (!fileNames.length) throw new Error('Zip archive is empty');
  const fileData = unzipped[fileNames[0]];
  const ext = doc.file_type || fileNames[0].split('.').pop().toLowerCase();
  const blob = new Blob([fileData], { type: MIME_TYPES[ext] || 'application/octet-stream' });
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = doc.file_name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
}

export async function previewDocument(doc) {
  if (doc.file_path?.startsWith('gdrive:')) {
    const fileId = doc.file_path.slice(7);
    window.open(getDriveViewUrl(fileId), '_blank');
    return null;
  }

  // Legacy: .zip stored in Supabase storage — decompress in-browser
  const url = await getSupabaseSignedUrl(doc.file_path);
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch file');
  const arrayBuffer = await response.arrayBuffer();
  const unzipped = unzipSync(new Uint8Array(arrayBuffer));
  const fileNames = Object.keys(unzipped);
  if (!fileNames.length) throw new Error('Zip archive is empty');
  const fileData = unzipped[fileNames[0]];
  const ext = doc.file_type || fileNames[0].split('.').pop().toLowerCase();
  const blob = new Blob([fileData], { type: MIME_TYPES[ext] || 'application/octet-stream' });
  const objectUrl = URL.createObjectURL(blob);
  window.open(objectUrl, '_blank');
  setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
  return objectUrl;
}

export async function fetchDocumentCounts() {
  const { data, error } = await supabase
    .from('documents')
    .select('course_code')
    .eq('status', 'approved');
  if (error) throw error;
  const counts = {};
  for (const row of data) {
    counts[row.course_code] = (counts[row.course_code] || 0) + 1;
  }
  return counts;
}

export async function fetchDocumentsByTag(tag) {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('status', 'approved')
    .contains('tags', [tag])
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function searchDocuments(query) {
  const q = `%${query}%`;
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('status', 'approved')
    .or(`title.ilike.${q},description.ilike.${q},uploader_name.ilike.${q}`)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchStorageUsed() {
  const { data, error } = await supabase
    .from('documents')
    .select('file_size')
    .in('status', ['pending', 'approved']);
  if (error) throw error;
  return data.reduce((sum, r) => sum + (r.file_size || 0), 0);
}
