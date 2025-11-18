// Backblaze B2 integration for video uploads
// This service handles authentication and file upload to B2
// Credentials should be loaded from environment variables or config.json
// This is a Sync only component, use other DB if forking.
import B2 from 'backblaze-b2';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';
import { fileURLToPath } from 'url';
// Recreate __dirname in ESM context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.resolve(__dirname, '../config.json');
let config = {};
try {
    if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
}
catch (e) {
    console.error('Failed to load config.json:', e);
}
//
const B2_KEY_ID = (process.env.B2_KEY_ID || config.B2_KEY_ID || '').trim();
const B2_APP_KEY = (process.env.B2_APP_KEY || config.B2_APP_KEY || '').trim();
const B2_BUCKET_ID = (process.env.B2_BUCKET_ID || config.B2_BUCKET_ID || '').trim();
// Basic shape checks (Backblaze key IDs usually start with '00')
function looksValidKeyId(k) { return /^00[0-9a-f]{22,}$/i.test(k); }
function looksValidBucketId(b) { return /^[0-9a-f]{10,}$/i.test(b); }
if (!B2_KEY_ID || !B2_APP_KEY || !B2_BUCKET_ID) {
    console.warn('[B2] One or more required env vars are missing (B2_KEY_ID / B2_APP_KEY / B2_BUCKET_ID).');
}
console.log('[B2] Init (masked):', {
    keyId: B2_KEY_ID ? B2_KEY_ID.slice(0, 6) + '…' + B2_KEY_ID.slice(-4) : 'missing',
    keyIdLength: B2_KEY_ID ? B2_KEY_ID.length : 0,
    appKey: B2_APP_KEY ? '***' + B2_APP_KEY.slice(-4) : 'missing',
    appKeyLength: B2_APP_KEY ? B2_APP_KEY.length : 0,
    bucketId: B2_BUCKET_ID ? B2_BUCKET_ID.slice(0, 4) + '…' + B2_BUCKET_ID.slice(-4) : 'missing'
});
if (B2_KEY_ID && !looksValidKeyId(B2_KEY_ID)) {
    console.warn('[B2] B2_KEY_ID format looks unusual. Double‑check you used the "keyID" (not the applicationKey value).');
}
if (B2_BUCKET_ID && !looksValidBucketId(B2_BUCKET_ID)) {
    console.warn('[B2] B2_BUCKET_ID format looks unusual. Ensure you used the bucketId, not the bucket name.');
}
const b2 = new B2({ applicationKeyId: B2_KEY_ID, applicationKey: B2_APP_KEY });
let lastAuthTime = 0;
let authInFlight = null;
const AUTH_TTL_MS = 1000 * 60 * 50; // 50 minutes (B2 tokens last 24h; renew well before)
async function ensureAuthorized() {
    const now = Date.now();
    if (authInFlight)
        return authInFlight;
    if (now - lastAuthTime < AUTH_TTL_MS)
        return; // still fresh
    authInFlight = (async () => {
        try {
            await b2.authorize();
            lastAuthTime = Date.now();
            console.log('[B2] Authorized successfully at', new Date(lastAuthTime).toISOString());
        }
        catch (e) {
            // Provide deeper diagnostics without exposing full secrets
            const status = e?.response?.status;
            const data = e?.response?.data;
            console.error('[B2] Authorization failed:', e?.message || e);
            if (status || data) {
                console.error('[B2] Auth HTTP diagnostics:', { status, data });
            }
            console.error('[B2] Key diagnostics:', {
                keyIdStartsWith: B2_KEY_ID ? B2_KEY_ID.slice(0, 8) : 'missing',
                keyIdEndsWith: B2_KEY_ID ? B2_KEY_ID.slice(-6) : 'missing',
                keyIdLength: B2_KEY_ID?.length,
                appKeyLength: B2_APP_KEY?.length,
                bucketIdLength: B2_BUCKET_ID?.length,
            });
            // Helpful hint suggestions
            console.error('[B2] Hints: 1) If you regenerated the MASTER key, use the Account ID (short) not the long key; 2) For a non-master key, ensure you used keyID (left column) + the one-time applicationKey. 3) Recreate a NEW restricted key and try again if unsure.');
            throw new Error('B2 authorization failed: ' + (e?.message || 'unknown error'));
        }
        finally {
            authInFlight = null;
        }
    })();
    return authInFlight;
}
export async function uploadVideoToB2(filePath, fileName) {
    if (!B2_KEY_ID || !B2_APP_KEY || !B2_BUCKET_ID) {
        throw new Error('B2 credentials not fully configured on server');
    }
    await ensureAuthorized();
    try {
        // Will throw if bucket does not exist / wrong bucketId
        await b2.getBucket({ bucketId: B2_BUCKET_ID });
    }
    catch (e) {
        if (/bucket/i.test(e?.message || '')) {
            throw new Error('B2 bucket lookup failed. Verify B2_BUCKET_ID is correct. ' + e.message);
        }
        throw e;
    }
    const fileData = fs.readFileSync(filePath);
    const detectedMime = mime.lookup(fileName) || 'video/mp4';
    const { data } = await b2.getUploadUrl({ bucketId: B2_BUCKET_ID });
    try {
        const uploadResponse = await b2.uploadFile({
            uploadUrl: data.uploadUrl,
            uploadAuthToken: data.authorizationToken,
            fileName,
            data: fileData,
            mime: detectedMime,
        });
        const info = {
            fileId: uploadResponse.data.fileId,
            fileName: uploadResponse.data.fileName,
            bucketId: B2_BUCKET_ID,
            size: uploadResponse.data.contentLength,
            mimeType: detectedMime.toString(),
        };
        // Public bucket quick URL (requires bucket to be public)
        if (process.env.B2_PUBLIC_BASE) {
            info.downloadUrl = `${process.env.B2_PUBLIC_BASE.replace(/\/$/, '')}/file/${uploadResponse.data.fileName}`;
        }
        return info;
    }
    catch (e) {
        if (e?.message?.includes('Invalid accountId')) {
            throw new Error('B2 rejected credentials: Invalid accountId. Make sure you used the Application Key ID (keyId), not the application key or account email.');
        }
        throw e;
    }
}
// Add more functions as needed for listing, deleting, etc.
// End of b2.service.ts
// This was created as there is no JS SDK for B2 only Python and Java
