/**
 * One-time migration: moves all existing Supabase storage .zip files to Google Drive.
 *
 * Prerequisites:
 *   npm install @supabase/supabase-js fflate dotenv google-auth-library googleapis
 *
 * Usage:
 *   Copy .env.migration.example → .env, fill in values, then:
 *   node scripts/migrate-to-drive.js
 *
 * Safe to re-run — rows with file_path starting with "gdrive:" are already migrated and skipped.
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { unzipSync } from 'fflate';
import { google } from 'googleapis';

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

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
);

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

const folderCache = {};

async function findOrCreateFolder(name, parentId) {
  const cacheKey = `${parentId}/${name}`;
  if (folderCache[cacheKey]) return folderCache[cacheKey];

  const { data } = await drive.files.list({
    q: `name='${name}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`,
    fields: 'files(id)',
  });

  if (data.files?.length > 0) {
    folderCache[cacheKey] = data.files[0].id;
    return data.files[0].id;
  }

  const { data: folder } = await drive.files.create({
    requestBody: { name, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] },
    fields: 'id',
  });
  folderCache[cacheKey] = folder.id;
  return folder.id;
}

async function uploadToDrive(buffer, fileName, mimeType, folderId) {
  const { data: file } = await drive.files.create({
    requestBody: { name: fileName, parents: [folderId] },
    media: { mimeType, body: Buffer.from(buffer) },
    fields: 'id',
  });

  await drive.permissions.create({
    fileId: file.id,
    requestBody: { role: 'reader', type: 'anyone' },
  });

  return file.id;
}

async function migrate() {
  const { data: docs, error } = await supabase
    .from('documents')
    .select('id, file_path, file_name, file_type, course_code')
    .not('file_path', 'is', null);

  if (error) throw error;

  const toMigrate = docs.filter(d => !d.file_path.startsWith('gdrive:'));
  console.log(`Found ${docs.length} file rows, ${toMigrate.length} need migration.\n`);

  const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  let ok = 0, fail = 0;

  for (const doc of toMigrate) {
    try {
      process.stdout.write(`  [${ok + fail + 1}/${toMigrate.length}] ${doc.file_path} ... `);

      const { data: urlData, error: urlErr } = await supabase.storage
        .from('documents')
        .createSignedUrl(doc.file_path, 300);
      if (urlErr) throw urlErr;

      const res = await fetch(urlData.signedUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const arrayBuffer = await res.arrayBuffer();
      let fileData;
      let ext = doc.file_type;
      let fileName = doc.file_name;

      if (doc.file_path.endsWith('.zip')) {
        const unzipped = unzipSync(new Uint8Array(arrayBuffer));
        const fileNames = Object.keys(unzipped);
        if (!fileNames.length) throw new Error('Empty zip');
        fileData = unzipped[fileNames[0]];
        ext = ext || fileNames[0].split('.').pop().toLowerCase();
        fileName = fileName || fileNames[0];
      } else {
        fileData = new Uint8Array(arrayBuffer);
      }

      const mimeType = MIME_TYPES[ext] ?? 'application/octet-stream';
      const courseFolderId = await findOrCreateFolder(doc.course_code, rootFolderId);
      const fileId = await uploadToDrive(fileData, fileName, mimeType, courseFolderId);

      const { error: updateErr } = await supabase
        .from('documents')
        .update({ file_path: `gdrive:${fileId}` })
        .eq('id', doc.id);
      if (updateErr) throw updateErr;

      console.log(`done → gdrive:${fileId}`);
      ok++;
    } catch (err) {
      console.log(`FAILED — ${err.message}`);
      fail++;
    }
  }

  console.log(`\nMigration complete: ${ok} succeeded, ${fail} failed.`);
  if (fail > 0) console.log('Re-run the script to retry failed files.');
}

migrate().catch(err => { console.error(err); process.exit(1); });
