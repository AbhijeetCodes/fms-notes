/**
 * One-time migration: moves all existing Supabase storage files to Cloudflare R2.
 *
 * Prerequisites:
 *   npm install @aws-sdk/client-s3 @supabase/supabase-js fflate dotenv
 *
 * Usage:
 *   Set env vars (see .env.migration.example), then:
 *   node scripts/migrate-to-r2.js
 *
 * Safe to re-run — already-migrated rows (file_path not ending in .zip) are skipped.
 */

import 'dotenv/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';
import { unzipSync } from 'fflate';

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
  process.env.SUPABASE_SERVICE_KEY, // service role key — bypasses RLS
);

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function migrate() {
  const { data: docs, error } = await supabase
    .from('documents')
    .select('id, file_path, file_name, file_type, course_code')
    .not('file_path', 'is', null);

  if (error) throw error;

  const toMigrate = docs.filter(d => d.file_path.endsWith('.zip'));
  console.log(`Found ${docs.length} file rows, ${toMigrate.length} need migration.`);

  let ok = 0, fail = 0;

  for (const doc of toMigrate) {
    try {
      process.stdout.write(`  [${ok + fail + 1}/${toMigrate.length}] ${doc.file_path} ... `);

      // Download from Supabase with a fresh signed URL
      const { data: urlData, error: urlErr } = await supabase.storage
        .from('documents')
        .createSignedUrl(doc.file_path, 300);
      if (urlErr) throw urlErr;

      const res = await fetch(urlData.signedUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const arrayBuffer = await res.arrayBuffer();
      const unzipped = unzipSync(new Uint8Array(arrayBuffer));
      const fileNames = Object.keys(unzipped);
      if (!fileNames.length) throw new Error('Empty zip');

      const fileData = unzipped[fileNames[0]];
      const ext = doc.file_type || fileNames[0].split('.').pop().toLowerCase();
      const mimeType = MIME_TYPES[ext] ?? 'application/octet-stream';

      // Keep the same folder/id structure, just without .zip
      const newKey = doc.file_path.replace(/\.zip$/, `.${ext}`);

      await r2.send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: newKey,
        Body: fileData,
        ContentType: mimeType,
      }));

      // Update the DB row to point at the new R2 key
      const { error: updateErr } = await supabase
        .from('documents')
        .update({ file_path: newKey })
        .eq('id', doc.id);
      if (updateErr) throw updateErr;

      console.log(`done → ${newKey}`);
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
