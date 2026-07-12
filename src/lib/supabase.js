import { createClient } from '@supabase/supabase-js';

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
const MAX_FILE_SIZE = 15 * 1024 * 1024;

export function validateFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return `File type .${ext} is not allowed. Use: ${ALLOWED_EXTENSIONS.join(', ')}`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max is 15MB.`;
  }
  return null;
}

export async function uploadDocument({ file, courseCode, title, description, tags, user }) {
  const ext = file.name.split('.').pop().toLowerCase();
  const filePath = `${courseCode}/${crypto.randomUUID()}.${ext}`;

  const { error: storageError } = await supabase.storage
    .from('documents')
    .upload(filePath, file);
  if (storageError) throw storageError;

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

export async function approveDocument(id, reviewerEmail) {
  const { error } = await supabase
    .from('documents')
    .update({
      status: 'approved',
      reviewed_by: reviewerEmail,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw error;
}

export async function rejectDocument(id, reviewerEmail, reason) {
  const { error } = await supabase
    .from('documents')
    .update({
      status: 'rejected',
      reject_reason: reason || null,
      reviewed_by: reviewerEmail,
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
