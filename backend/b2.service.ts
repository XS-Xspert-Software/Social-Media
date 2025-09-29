// Backblaze B2 integration for video uploads
// This service handles authentication and file upload to B2
// Credentials should be loaded from environment variables or config.json

import B2 from 'backblaze-b2';
import fs from 'fs';
import path from 'path';

const configPath = path.resolve(__dirname, '../config.json');
let config: any = {};
try {
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }
} catch (e) {
  console.error('Failed to load config.json:', e);
}

const B2_KEY_ID = process.env.B2_KEY_ID || config.B2_KEY_ID || '';
const B2_APP_KEY = process.env.B2_APP_KEY || config.B2_APP_KEY || '';
const B2_BUCKET_ID = process.env.B2_BUCKET_ID || config.B2_BUCKET_ID || '';

const b2 = new B2({
  applicationKeyId: B2_KEY_ID,
  applicationKey: B2_APP_KEY,
});

export async function uploadVideoToB2(filePath: string, fileName: string): Promise<string> {
  await b2.authorize();
  const { data: bucket } = await b2.getBucket({ bucketId: B2_BUCKET_ID });
  const fileData = fs.readFileSync(filePath);
  const { data } = await b2.getUploadUrl({ bucketId: B2_BUCKET_ID });
  const uploadResponse = await b2.uploadFile({
    uploadUrl: data.uploadUrl,
    uploadAuthToken: data.authorizationToken,
    fileName,
    data: fileData,
    mime: 'video/mp4', // or detect from fileName
  });
  return uploadResponse.data.fileId;
}

// Add more functions as needed for listing, deleting, etc.
