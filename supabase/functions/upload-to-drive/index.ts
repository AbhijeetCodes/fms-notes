import { createClient } from "npm:@supabase/supabase-js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

// ── Google auth ──────────────────────────────────────────────────────────────

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const content = pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");
  const binary = atob(content);
  const buf = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i);
  return buf.buffer;
}

function b64url(data: string | ArrayBuffer): string {
  let str: string;
  if (typeof data === "string") {
    // ASCII-safe base64 for JSON payloads
    str = btoa(data);
  } else {
    // ArrayBuffer → base64 via loop (avoids spread stack limit)
    const bytes = new Uint8Array(data);
    let s = "";
    for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    str = btoa(s);
  }
  return str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

async function getAccessToken(clientEmail: string, privateKeyPem: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = b64url(JSON.stringify({
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/drive",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  }));

  const signingInput = `${header}.${payload}`;

  let key: CryptoKey;
  try {
    key = await crypto.subtle.importKey(
      "pkcs8",
      pemToArrayBuffer(privateKeyPem),
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"],
    );
  } catch (e) {
    throw new Error(`Private key import failed: ${e}`);
  }

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(signingInput),
  );

  const jwt = `${signingInput}.${b64url(signature)}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const tokenBody = await tokenRes.json();
  if (!tokenRes.ok) throw new Error(`Google auth failed: ${JSON.stringify(tokenBody)}`);
  return tokenBody.access_token;
}

// ── Drive helpers ────────────────────────────────────────────────────────────

async function findOrCreateFolder(name: string, parentId: string, token: string): Promise<string> {
  const q = `name='${name}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`;
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id)`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!searchRes.ok) throw new Error(`Folder search failed: ${await searchRes.text()}`);

  const { files } = await searchRes.json();
  if (files?.length > 0) return files[0].id;

  const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    }),
  });
  if (!createRes.ok) throw new Error(`Folder create failed: ${await createRes.text()}`);
  const { id } = await createRes.json();
  return id;
}

async function uploadFile(file: File, folderId: string, token: string): Promise<string> {
  const initRes = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Upload-Content-Type": file.type || "application/octet-stream",
        "X-Upload-Content-Length": String(file.size),
      },
      body: JSON.stringify({ name: file.name, parents: [folderId] }),
    },
  );
  if (!initRes.ok) throw new Error(`Upload init failed: ${await initRes.text()}`);

  const uploadUrl = initRes.headers.get("Location");
  if (!uploadUrl) throw new Error("No upload URL in response");

  const arrayBuffer = await file.arrayBuffer();
  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type || "application/octet-stream",
      "Content-Length": String(file.size),
    },
    body: arrayBuffer,
  });
  if (!uploadRes.ok) throw new Error(`File upload failed: ${await uploadRes.text()}`);

  const { id } = await uploadRes.json();

  const permRes = await fetch(`https://www.googleapis.com/drive/v3/files/${id}/permissions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ role: "reader", type: "anyone" }),
  });
  if (!permRes.ok) throw new Error(`Permission failed: ${await permRes.text()}`);

  return id;
}

// ── Handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return json({ error: "Unauthorized" }, 401);

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return json({ error: "Invalid form data" }, 400);
    }

    const file = formData.get("file") as File | null;
    const courseCode = formData.get("courseCode") as string | null;
    if (!file || !courseCode) return json({ error: "Missing file or courseCode" }, 400);

    const privateKey = (Deno.env.get("GOOGLE_PRIVATE_KEY") ?? "").replace(/\\n/g, "\n");
    const clientEmail = Deno.env.get("GOOGLE_CLIENT_EMAIL") ?? "";
    const rootFolderId = Deno.env.get("GOOGLE_DRIVE_FOLDER_ID") ?? "";

    if (!privateKey || !clientEmail || !rootFolderId) {
      return json({ error: "Missing Google Drive configuration" }, 500);
    }

    const token = await getAccessToken(clientEmail, privateKey);
    const courseFolderId = await findOrCreateFolder(courseCode, rootFolderId, token);
    const fileId = await uploadFile(file, courseFolderId, token);

    return json({ fileId });
  } catch (e) {
    console.error("upload-to-drive error:", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
