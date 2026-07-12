import { createClient } from '@supabase/supabase-js';
import { zipSync, unzipSync, strToU8 } from 'fflate';

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

const ALLOWED_EXTENSIONS = ['pdf', 'ppt', 'pptx', 'doc', 'docx', 'xls', 'xlsx'];
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
  const fileId = crypto.randomUUID();
  const filePath = `${courseCode}/${fileId}.zip`;

  // Notify caller that compression is starting
  if (onProgress) onProgress('compressing');

  // Read file into ArrayBuffer and compress into a zip archive
  const arrayBuffer = await file.arrayBuffer();
  const fileData = new Uint8Array(arrayBuffer);
  const zipped = zipSync({ [file.name]: fileData }, { level: 6 });
  const zippedBlob = new Blob([zipped], { type: 'application/zip' });

  // Notify caller that upload is starting
  if (onProgress) onProgress('uploading');

  const { error: storageError } = await supabase.storage
    .from('documents')
    .upload(filePath, zippedBlob, {
      contentType: 'application/zip',
    });
  if (storageError) throw storageError;

  // Store original file metadata in the database
  const { error: dbError } = await supabase.from('documents').insert({
    course_code: courseCode,
    title,
    description: description || null,
    file_path: filePath,
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

export function getFileUrl(filePath) {
  const { data } = supabase.storage.from('documents').getPublicUrl(filePath);
  return data.publicUrl;
}

export async function getSignedUrl(filePath) {
  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(filePath, 60 * 60);
  if (error) throw error;
  return data.signedUrl;
}

const MIME_TYPES = {
  pdf: 'application/pdf',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

/**
 * Fetch and decompress a document, returning a Blob with the original file content.
 * Handles both zipped (new) and unzipped (legacy) files transparently.
 */
async function fetchAndDecompress(doc) {
  const url = await getSignedUrl(doc.file_path);
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch file');

  if (doc.file_path.endsWith('.zip')) {
    const arrayBuffer = await response.arrayBuffer();
    const unzipped = unzipSync(new Uint8Array(arrayBuffer));
    // Get the first (only) file from the archive
    const fileNames = Object.keys(unzipped);
    if (fileNames.length === 0) throw new Error('Zip archive is empty');
    const fileData = unzipped[fileNames[0]];
    const ext = doc.file_type || fileNames[0].split('.').pop().toLowerCase();
    const mimeType = MIME_TYPES[ext] || 'application/octet-stream';
    return new Blob([fileData], { type: mimeType });
  }

  // Legacy uncompressed file
  return await response.blob();
}

/**
 * Download a document — decompresses if zipped, then triggers a browser download
 * with the original filename.
 */
export async function downloadDocument(doc) {
  const blob = await fetchAndDecompress(doc);
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = doc.file_name;
  a.click();
  // Clean up the object URL after a short delay
  setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
}

/**
 * Preview a document — decompresses if zipped, then opens in a new tab.
 * Returns the object URL so the caller can revoke it later if needed.
 */
export async function previewDocument(doc) {
  if (!doc.file_path.endsWith('.zip')) {
    // Legacy file — just open the signed URL directly
    const url = await getSignedUrl(doc.file_path);
    window.open(url, '_blank');
    return null;
  }
  const blob = await fetchAndDecompress(doc);
  const objectUrl = URL.createObjectURL(blob);
  window.open(objectUrl, '_blank');
  // Clean up after a delay to let the tab load
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
